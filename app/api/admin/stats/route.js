import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['gatekeeperzw@gmail.com'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    // 1. Verify the user is logged in and is the admin
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Use the Service Role key to fetch data (including auth.users)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    // Fetch all necessary data in parallel
    const [
      { count: totalProjects },
      { data: recentProjectsData },
      { data: paymentsData },
      { count: totalUrgentJobs },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('project_name, total_cost, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('payments').select('amount, payment_method, payment_purpose, payment_status, created_at, user_id').eq('payment_status', 'completed'),
      supabase.from('job_requests').select('*', { count: 'exact', head: true }),
    ]);

    // Get total auth users (Service role only)
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();
    const actualTotalUsers = authUsers?.users?.length || 0;
    
    // Calculate Revenue and Chart Data
    let totalRevenue = 0;
    let subRevenue = 0;
    let boqRevenue = 0;
    const chartMap = {};

    // Build last 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      chartMap[key] = { date: key, revenue: 0, boqs: 0 };
    }

    const recentPayments = [];

    if (paymentsData) {
      paymentsData.forEach((p) => {
        totalRevenue += Number(p.amount);
        if (p.payment_purpose === 'subscription') subRevenue += Number(p.amount);
        if (p.payment_purpose === 'boq') boqRevenue += Number(p.amount);

        const dateKey = p.created_at.split('T')[0];
        if (chartMap[dateKey]) {
          chartMap[dateKey].revenue += Number(p.amount);
          if (p.payment_purpose === 'boq') chartMap[dateKey].boqs += 1;
        }

        if (recentPayments.length < 5) {
          recentPayments.push(p);
        }
      });
    }

    const chartData = Object.values(chartMap);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: actualTotalUsers,
        totalProjects: totalProjects || 0,
        totalRevenue: totalRevenue,
        subRevenue: subRevenue,
        boqRevenue: boqRevenue,
        totalUrgentJobs: totalUrgentJobs || 0,
      },
      recentProjects: recentProjectsData || [],
      recentPayments: recentPayments,
      chartData: chartData,
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
