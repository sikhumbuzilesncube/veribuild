import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkPaymentStatus } from '../../../lib/paynow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Read the authenticated user from the request.
 *
 * Strategy:
 * 1. Look for the Authorization: Bearer <token> header. If present, use it.
 * 2. Look for the Supabase session cookie sb-<ref>-auth-token. Parse and
 *    extract access_token, then verify with Supabase.
 *
 * We do not use @supabase/ssr because we do not need its full features here
 * and avoiding the dependency keeps the build simple.
 */
async function getAuthenticatedUser(request) {
  // 1. Authorization header
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

  // 2. Supabase session cookie
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const projectRef = (supabaseUrl || '').match(/https?:\/\/([^.]+)\./)?.[1];
    if (!projectRef) return null;

    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = readCookie(cookieHeader, cookieName);

    if (!cookieValue) {
      // Try the chunked variant: sb-<ref>-auth-token.0, .1, etc.
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

  // The cookie value is usually JSON with an access_token field. It may also
  // be base64-encoded JSON. Try both.
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.user_id && payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payment.payment_status === 'completed') {
      return NextResponse.json({
        success: true,
        reference: payment.transaction_reference,
        status: 'completed',
        amount: payment.amount,
        method: payment.payment_method,
        user_id: payment.user_id,
      });
    }

    if (payment.payment_proof_url) {
      try {
        const statusResult = await checkPaymentStatus(payment.payment_proof_url);

        const isPaid =
          statusResult.paid === true ||
          String(statusResult.status || '').toLowerCase() === 'paid';

        if (isPaid) {
          await supabase
            .from('payments')
            .update({
              payment_status: 'completed',
              webhook_received: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          const subscriptionPlans = ['hardware', 'construction', 'worker'];
          if (subscriptionPlans.includes(payment.payment_method)) {
            const { data: existingSub } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('payment_id', payment.id)
              .maybeSingle();

            if (!existingSub) {
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 30);

              await supabase.from('subscriptions').insert({
                user_id: payment.user_id,
                subscription_type: payment.payment_method,
                status: 'active',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                payment_id: payment.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }

          return NextResponse.json({
            success: true,
            reference: payment.transaction_reference,
            status: 'completed',
            paid: true,
            amount: payment.amount,
            method: payment.payment_method,
            user_id: payment.user_id,
          });
        }

        return NextResponse.json({
          success: true,
          reference: payment.transaction_reference,
          status: statusResult.status || 'pending',
          paid: false,
          amount: payment.amount,
          method: payment.payment_method,
        });

      } catch (pollError) {
        console.error('Poll error:', pollError);
        return NextResponse.json({
          success: false,
          reference: payment.transaction_reference,
          status: 'pending',
          poll_error: pollError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      reference: payment.transaction_reference,
      status: payment.payment_status,
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
