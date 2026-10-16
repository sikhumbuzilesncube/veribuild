import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Read the authenticated user from an incoming Next.js App Router request.
 *
 * Tries two sources in order:
 *   1. Authorization: Bearer <token>
 *   2. Supabase session cookie (sb-<project-ref>-auth-token, with chunked
 *      fallback for large sessions)
 *
 * Returns the Supabase user object, or null if no valid session is found.
 */
export async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (bearer) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data: { user } } = await client.auth.getUser();
      if (user) return user;
    } catch (err) {
      console.warn('Bearer auth failed:', err.message);
    }
  }

  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const projectRef = (supabaseUrl || '').match(/https?:\/\/([^.]+)\./)?.[1];
    if (!projectRef) return null;

    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = readCookie(cookieHeader, cookieName);

    if (!cookieValue) {
      const chunks = [];
      for (let i = 0; i < 10; i++) {
        const part = readCookie(cookieHeader, `${cookieName}.${i}`);
        if (!part) break;
        chunks.push(part);
      }
      if (chunks.length > 0) {
        return await verifyTokenString(chunks.join(''));
      }
      return null;
    }

    return await verifyTokenString(cookieValue);
  } catch (err) {
    console.warn('Cookie auth failed:', err.message);
    return null;
  }
}

function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((c) => c.trim());
  const target = parts.find((c) => c.startsWith(name + '='));
  if (!target) return null;
  return decodeURIComponent(target.slice(name.length + 1));
}

async function verifyTokenString(rawValue) {
  if (!rawValue) return null;

  let accessToken = null;

  try {
    const parsed = JSON.parse(rawValue);
    accessToken = parsed?.access_token || parsed?.[0]?.access_token || null;
  } catch {
    try {
      const decoded = Buffer.from(rawValue, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      accessToken = parsed?.access_token || parsed?.[0]?.access_token || null;
    } catch {
      return null;
    }
  }

  if (!accessToken) return null;

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user } } = await client.auth.getUser();
    return user || null;
  } catch (err) {
    console.warn('Token verify failed:', err.message);
    return null;
  }
                 }
