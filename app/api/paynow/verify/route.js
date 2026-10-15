import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { checkPaymentStatus } from '../../../lib/paynow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Read the authenticated user from the request cookies.
 *
 * We use @supabase/ssr's createServerClient so the session is read from the
 * request's cookies, which is how Next.js App Router server routes see the
 * logged-in user. If @supabase/ssr is not installed, we fall back to reading
 * the Authorization header (used by some client calls) and treat a missing
 * session as unauthenticated.
 */
async function getAuthenticatedUser(request) {
  // Preferred path: cookie-based session via @supabase/ssr
  try {
    const { createServerClient: makeClient } = await import('@supabase/ssr');

    const supabaseAuth = makeClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get(name) {
          // Read from request cookies
          const cookieHeader = request.headers.get('cookie') || '';
          const match = cookieHeader
            .split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith(name + '='));
          if (!match) return undefined;
          return decodeURIComponent(match.slice(name.length + 1));
        },
        set() {
          // verify route does not set cookies
        },
        remove() {
          // verify route does not remove cookies
        },
      },
    });

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) return user;
  } catch (err) {
    // @supabase/ssr may not be installed. Fall through to header check.
  }

  // Fallback: Authorization: Bearer <access_token>
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (bearer) {
    try {
      const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data: { user } } = await tempClient.auth.getUser();
      if (user) return user;
    } catch {
      // fall through to null
    }
  }

  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    // Require an authenticated user before doing anything else.
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find payment in DB
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Ownership check. Only the user who created the payment can verify it.
    // Even if the reference leaks, another user cannot flip its state.
    if (payment.user_id && payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Already completed — return early
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

    // Pending — poll Paynow
    if (payment.payment_proof_url) {
      try {
        const statusResult = await checkPaymentStatus(payment.payment_proof_url);

        const isPaid =
          statusResult.paid === true ||
          String(statusResult.status || '').toLowerCase() === 'paid';

        if (isPaid) {
          // Update payment to completed
          await supabase
            .from('payments')
            .update({
              payment_status: 'completed',
              webhook_received: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          // Create subscription if plan_type is a subscription
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
