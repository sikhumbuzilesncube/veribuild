import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkPaymentStatus } from '../../../lib/paynow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  console.log('=== PAYNOW WEBHOOK RECEIVED ===');

  try {
    const contentType = request.headers.get('content-type') || '';
    let data = {};

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }

    console.log('Webhook body:', JSON.stringify(data));

    const { reference, paynowreference, amount, status, pollurl } = data;

    if (!reference) {
      console.error('No reference in webhook');
      return new NextResponse('ok', { status: 200 });
    }

    let verifiedStatus = status;
    let isPaid = false;

    if (pollurl) {
      try {
        const verification = await checkPaymentStatus(pollurl);
        verifiedStatus = verification.status;
        isPaid = verification.paid;
        console.log('Verified status:', verifiedStatus, 'Paid:', isPaid);
      } catch (err) {
        console.error('Verification failed:', err.message);
        isPaid = String(status).toLowerCase() === 'paid';
      }
    } else {
      isPaid = String(status).toLowerCase() === 'paid';
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured');
      return new NextResponse('ok', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment by transaction_reference
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .single();

    if (findError) {
      console.error('Payment not found:', reference);
      return new NextResponse('ok', { status: 200 });
    }

    if (isPaid) {
      console.log(`Payment ${reference} confirmed as PAID`);

      await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          provider_code: paynowreference || reference,
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_reference', reference);

      if (payment) {
        await activateSubscription({
          userId: payment.user_id,
          planType: payment.payment_method,
          paymentId: payment.id,
        });
      }
    } else {
      console.log(`Payment ${reference} status: ${verifiedStatus}`);

      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_reference', reference);
    }

    return new NextResponse('ok', { status: 200 });

  } catch (error) {
    console.error('Paynow webhook error:', error);
    return new NextResponse('ok', { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Paynow webhook endpoint is active' },
    { status: 200 }
  );
}

async function activateSubscription(subscriptionData) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: subscriptionData.userId,
        subscription_type: subscriptionData.planType,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_id: subscriptionData.paymentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Subscription insert error:', error);
      return;
    }

    console.log('Subscription activated');
  } catch (error) {
    console.error('Subscription activation error:', error);
  }
}
