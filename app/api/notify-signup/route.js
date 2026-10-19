import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/notify-admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, fullName, userType } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await notifyAdmin(
      `New Sign Up: ${fullName || email}`,
      `A new user has registered on the platform.\n\nName: ${fullName || 'N/A'}\nEmail: ${email}\nRole: ${userType || 'N/A'}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup notify error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
