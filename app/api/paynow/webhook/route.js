import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Paynow sends POST notifications here when a payment completes.
 * Handles both form-urlencoded and JSON payloads.
 */
export async function POST(request) {
  console.log('=== PAYNOW WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Content-Type:', request.headers.get('content-type'));

  try {
    const contentType = request.headers.get('content-type') || '';
    let data = {};

    // Parse request body — Paynow sends form-urlencoded, but we handle both
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }

    // Log EVERYTHING for debugging
    console.log('Webhook body:', JSON.stringify(data, null, 2));
    console.log('All fields received:', Object.keys(data));

    // Extract fields (Paynow can use different case conventions)
    const reference = data.reference || data.Reference || data.merchantref || data.merchantReference;
    const paynowRef = data.paynowreference || data.paynowReference || data.PaynowReference;
    const amount = data.amount || data.Amount;
    const status = data.status || data.Status;
    const pollUrl = data.pollurl || data.pollUrl || data.PollUrl;

    console.log('Extracted fields:', {
      reference,
      paynowRef,
      amount,
      status,
      pollUrl,
    });

    if (!reference) {
      console.error('❌ No reference in webhook body');
      return new NextResponse('ok', { status: 200 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase not configured');
      return new NextResponse('ok', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment record by reference
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .single();

    if (findError || !payment) {
      console.error('❌ Payment not found for reference:', reference);
      return new NextResponse('ok', { status: 200 });
    }

    console.log('✅ Payment found:', payment.id, 'current status:', payment.payment_status);

    // Determine if payment was successful
    const statusLower = String(status || '').toLowerCase();
    const isPaid = statusLower === 'paid' || statusLower === 'completed' || statusLower === 'ok';

    if (isPaid) {
      console.log('💰 Payment confirmed as PAID');

      // Update payment status to completed
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          provider_code: paynowRef || null,
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('❌ Error updating payment:', updateError);
      } else {
        console.log('✅ Payment updated to completed');
      }

      // Create subscription (only if it doesn't already exist)
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('payment_id', payment.id)
        .maybeSingle();

      if (existingSub) {
        console.log('ℹ️ Subscription already exists for this payment');
      } else {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: payment.user_id,
            subscription_type: payment.payment_method,
            status: 'active',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            payment_id: payment.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (subError) {
          console.error('❌ Subscription insert error:', subError);
        } else {
          console.log('✅ Subscription activated for user:', payment.user_id);
        }
      }
    } else if (statusLower === 'cancelled' || statusLower === 'failed' || statusLower === 'declined') {
      console.log('❌ Payment status:', status);

      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    } else {
      console.log('ℹ️ Payment status:', status, '— no action taken');
    }

    // Always return 200 OK — Paynow expects this
    return new NextResponse('ok', { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    console.error('Stack:', error.stack);
    // Still return 200 to prevent retries
    return new NextResponse('ok', { status: 200 });
  }
}

/**
 * Health check — can be accessed via browser to verify the endpoint is active
 */
export async function GET() {
  return NextResponse.json(
    { message: 'Paynow webhook endpoint is active' },
    { status: 200 }
  );
        }
