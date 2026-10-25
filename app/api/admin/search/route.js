import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['gatekeeperzw@gmail.com'];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify admin
    const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Search query too short' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchTerm = `%${query}%`;

    // 1. Search Auth Users (Email or Name)
    // Note: Supabase auth.admin.listUsers doesn't support text search directly, 
    // so we fetch a batch and filter in memory for speed.
    const { data: authUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const matchedUsers = authUsersData?.users?.filter(u => 
      u.email?.toLowerCase().includes(query.toLowerCase()) || 
      u.user_metadata?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      u.user_metadata?.phone?.includes(query)
    ).slice(0, 5) || [];

    // Get their projects and payments
    const userIds = matchedUsers.map(u => u.id);
    
    let projects = [];
    let payments = [];

    if (userIds.length > 0) {
      const { data: projData } = await supabase
        .from('projects')
        .select('id, project_name, created_at, status, total_cost')
        .in('user_id', userIds);
      projects = projData || [];

      const { data: payData } = await supabase
        .from('payments')
        .select('id, amount, payment_method, payment_status, created_at, transaction_reference')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });
      payments = payData || [];
    }

    // 2. Search Projects directly by name
    const { data: nameProjects } = await supabase
      .from('projects')
      .select('id, project_name, created_at, status, total_cost, user_id')
      .ilike('project_name', searchTerm)
      .limit(5);

    return NextResponse.json({
      success: true,
      users: matchedUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || 'No name',
        phone: u.user_metadata?.phone || 'No phone',
        role: u.user_metadata?.user_type || 'client',
        created_at: u.created_at,
      })),
      projects: [...projects, ...(nameProjects || [])],
      payments: payments,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
                                          }
