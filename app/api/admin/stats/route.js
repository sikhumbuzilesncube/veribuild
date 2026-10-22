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

    // Fetch everything, including the latest 5 errors
    const [
      { count: totalProjects },
      { data: recentProjectsData },
      { data: paymentsData },
      { count: totalUrgentJobs },
      { data: recentLogs },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('project_name, total_cost, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('payments').select('amount, payment_method, payment_purpose, payment_status, created_at, user_id').eq('payment_status', 'completed'),
      supabase.from('job_requests').select('*', { count: 'exact', head: true }),
      supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const actualTotalUsers = authUsers?.users?.length || 0;
    const recentSignupsCount = authUsers?.users?.filter(u => new Date(u.created_at) >= sevenDaysAgo).length || 0;

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
        totalUsers: actualTotalUsers,
        recentSignups: recentSignupsCount,
        totalProjects: totalProjects || 0,
        totalRevenue: totalRevenue,
        subRevenue: subRevenue,
        boqRevenue: boqRevenue,
        recentRevenue: recentRevenue,
        totalUrgentJobs: totalUrgentJobs || 0,
      },
      recentProjects: recentProjectsData || [],
      recentPayments: recentPayments,
      recentLogs: recentLogs || [],
      chartData: Object.values(chartMap),
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
      }
