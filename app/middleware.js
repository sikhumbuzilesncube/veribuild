import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Only protect admin routes
  if (pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check if user is admin
      if (user.email !== 'admin@gatekeeperai.co.zw') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
