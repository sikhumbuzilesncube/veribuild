import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, secret } = body;

    const ADMIN_SECRET = 'VeriBuild2026@Admin';

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    if (!email || !password || password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Email and password (min 8 chars) required'
      });
    }

    // First, get the user from auth.users
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (authError || !authUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found in auth.users'
      });
    }

    // Update password using Supabase Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: password }
    );

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    // Make sure public.users has the admin role
    await supabase
      .from('users')
      .update({ user_type: 'admin' })
      .eq('id', authUser.id);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
        }
