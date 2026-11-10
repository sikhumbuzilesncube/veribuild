import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['gatekeeperzw@gmail.com'];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await authClient.auth.getUser(token);

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { codeId } = await request.json();
    if (!codeId) return NextResponse.json({ error: 'Code ID required' }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Set the code to inactive
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: false })
      .eq('id', codeId);

    if (error) {
      console.error('Failed to disable code:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
                                  }
