import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['gatekeeperzw@gmail.com'];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function isAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return false;
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user } } = await authClient.auth.getUser(token);
  return user && ADMIN_EMAILS.includes(user.email);
}

export async function GET(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Fetch codes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ codes: data });
}

export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { code, percentage, maxUses } = body;
    
    if (!code || !percentage) {
      return NextResponse.json({ error: 'Code and percentage required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: code.toUpperCase().trim(),
        percentage: parseInt(percentage),
        max_uses: parseInt(maxUses) || 100,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Insert code error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, code: data });
  } catch (error) {
    console.error('Create code error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
  }
