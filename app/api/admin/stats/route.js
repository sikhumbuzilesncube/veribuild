import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['gatekeeperzw@gmail.com'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch all projects with their payment status
    const { data: allProjects } = await supabase
      .from('projects')
      .select(`
        id, 
        project_name, 
        created_at, 
        user_id,
        payments (payment_status, payment_purpose)
      `)
      .order('created_at', { ascending: false });

    const { data: authUsersData } = await supabase.auth.admin.listUsers();
    const authUsers = authUsersData?.users || [];
    
    const userMap = {};
    const roleCounts = { client: 0, worker: 0, architect: 0, construction: 0, hardware: 0 };
    const usersByRole = { client: [], worker: [], architect: [], construction: [], hardware: [] };

    authUsers.forEach(u => {
      const role = u.user_metadata?.user_type || 'client';
      
      if (roleCounts[role] !== undefined) roleCounts[role]++;
      else roleCounts.client++;

      const userData = {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || 'No name provided',
        phone: u.user_metadata?.phone || 'No phone provided',
        role: role,
        created_at: u.created_at
      };

      userMap[u.id] = userData;
      if (usersByRole[role]) usersByRole[role].push(userData);
      else usersByRole.client.push(userData);
    });

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount, payment_method, payment_purpose, payment_status, created_at, user_id')
      .eq('payment_status', 'completed');

    // Check for recent failed payments
    const { count: recentFailedPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'failed')
      .gte('created_at', oneDayAgo);

    const { count: totalUrgentJobs } = await supabase
      .from('job_requests')
      .select('*', { count: 'exact', head: true });

    // Check for recent errors
    const { data: recentLogs } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: recentErrorCount } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    const recentSignupsCount = authUsers.filter(u => new Date(u.created_at) >= sevenDaysAgo).length || 0;

    let totalProjectsStarted = 0;
    let completedProjects = 0;
    let totalUnpaidLeadsCount = 0;
    const recentUnpaidLeads = [];

    if (allProjects) {
      allProjects.forEach(project => {
        totalProjectsStarted++;
        
        const isPaid = project.payments?.some(p => 
          p.payment_status === 'completed' && p.payment_purpose === 'boq'
        );

        if (isPaid) {
          completedProjects++;
        } else {
          totalUnpaidLeadsCount++;
          if (recentUnpaidLeads.length < 20) {
            const clientInfo = userMap[project.user_id] || { email: 'Unknown', name: 'Unknown', phone: 'Unknown', role: 'unknown' };
            recentUnpaidLeads.push({
              id: project.id,
              project_name: project.project_name,
              created_at: project.created_at,
              user_id: project.user_id,
              client_name: clientInfo.name,
              client_email: clientInfo.email,
              client_phone: clientInfo.phone,
              client_role: clientInfo.role,
            });
          }
        }
      });
    }

    let totalRevenue = 0;
    let subRevenue = 0;
    let boqRevenue = 0;
    let recentRevenue = 0;
    const chartMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      chartMap[key] = { date: key, revenue: 0, boqs: 0 };
    }

    const recentPayments = [];

    if (paymentsData) {
      paymentsData.forEach((p) => {
        const amount = Number(p.amount);
        totalRevenue += amount;
        if (p.payment_purpose === 'subscription') subRevenue += amount;
        if (p.payment_purpose === 'boq') boqRevenue += amount;

        const paymentDate = new Date(p.created_at);
        if (paymentDate >= sevenDaysAgo) recentRevenue += amount;

        const dateKey = p.created_at.split('T')[0];
        if (chartMap[dateKey]) {
          chartMap[dateKey].revenue += amount;
          if (p.payment_purpose === 'boq') chartMap[dateKey].boqs += 1;
        }

        if (recentPayments.length < 5) recentPayments.push(p);
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: authUsers.length,
        recentSignups: recentSignupsCount,
        roleCounts: roleCounts,
        totalProjectsStarted: totalProjectsStarted,
        completedProjects: completedProjects,
        totalUnpaidLeads: totalUnpaidLeadsCount,
        recentFailedPayments: recentFailedPayments || 0,
        recentErrorCount: recentErrorCount || 0,
        totalRevenue: totalRevenue,
        subRevenue: subRevenue,
        boqRevenue: boqRevenue,
        recentRevenue: recentRevenue,
        totalUrgentJobs: totalUrgentJobs || 0,
      },
      usersByRole: usersByRole,
      recentPayments: recentPayments,
      recentLogs: recentLogs || [],
      recentUnpaidLeads: recentUnpaidLeads, 
      chartData: Object.values(chartMap),
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  }
