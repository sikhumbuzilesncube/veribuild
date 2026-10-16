import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Read the authenticated user from an incoming Next.js App Router request.
 *
 * Uses @supabase/ssr's createServerClient, which knows how to read the
 * Supabase session cookie correctly across all supported cookie formats
 * (single, chunked, base64, etc.). This is the standard pattern.
 *
 * Returns the Supabase user object, or null if no valid session is found.
 */
export async function getAuthenticatedUser(request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars missing; cannot authenticate request');
    return null;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') || '';
          if (!cookieHeader) return [];

          return cookieHeader
            .split(';')
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => {
              const eq = entry.indexOf('=');
              const name = eq >= 0 ? entry.slice(0, eq) : entry;
              const value = eq >= 0 ? entry.slice(eq + 1) : '';
              return { name, value: decodeURIComponent(value) };
            });
        },
        setAll() {
          // The server-side routes never need to write cookies back.
          // Session refresh is handled by the browser client.
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.warn('Supabase auth error:', error.message);
      return null;
    }

    return user || null;
  } catch (err) {
    console.warn('Server auth failed:', err.message);
    return null;
  }
}
