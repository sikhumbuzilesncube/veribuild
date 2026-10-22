import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, context, level } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Use the service role to bypass RLS for inserting logs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the user if they are logged in
    let userId = null;
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    await supabase.from('system_logs').insert({
      level: level || 'error',
      message: message,
      context: context || {},
      user_id: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  }
