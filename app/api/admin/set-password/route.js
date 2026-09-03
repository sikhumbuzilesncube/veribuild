import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, secret } = body;

    // Simple secret to protect this endpoint
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

    // Update user password via Supabase Auth Admin
    const { data, error } = await supabase.auth.admin.updateUserById(
      (await supabase.from('users').select('id').eq('email', email).single()).data.id,
      { password: password }
    );

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

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
