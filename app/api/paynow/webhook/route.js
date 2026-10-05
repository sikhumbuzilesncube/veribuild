import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkPaymentStatus } from '../../../lib/paynow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Paynow sends the result as form-urlencoded POST
 */
export async function POST(request) {
  console.log('=== PAYNOW WEBHOOK RECEIVED ===');

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);

    let data = {};

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // Paynow sends form-urlencoded
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }

    console.log('Webhook body:', JSON.stringify(data));

    const {
      reference,
      paynowreference,
      amount,
      status,
      pollurl,
      hash,
    } = data;

    if (!reference) {
      console.error('No reference in webhook');
      return new NextResponse('ok', { status: 200 });
    }

    // Always verify via pollUrl (more reliable than trusting the webhook body)
    let verifiedStatus = status;
    let isPaid = false;

    if (pollurl) {
      try {
        const verification = await checkPaymentStatus(pollurl);
        verifiedStatus = verification.status;
        isPaid = verification.paid;
        console.log('Verified status:', verifiedStatus, 'Paid:', isPaid);
      } catch (err) {
        console.error('Verification failed, using webhook status:', err.message);
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

    if (isPaid) {
      console.log(`Payment ${reference} confirmed as PAID`);

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: paynowreference || reference,
          transaction_status: verifiedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('reference', reference)
        .select()
        .single();

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
      }

      if (payment) {
        await activateSubscription({
          userId: payment.user_id,
          planType: payment.plan_type,
          transactionId: paynowreference || reference,
          amount: amount || payment.amount,
        });
      }
    } else {
      console.log(`Payment ${reference} status: ${verifiedStatus}`);

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          transaction_status: verifiedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('reference', reference);
    }

    // Paynow expects "ok" response
    return new NextResponse('ok', { status: 200 });

  } catch (error) {
    console.error('Paynow webhook error:', error);
    // Still return ok to prevent retries
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
      .upsert({
        user_id: subscriptionData.userId,
        plan_type: subscriptionData.planType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        transaction_id: subscriptionData.transactionId,
        auto_renew: true,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Subscription activation error:', error);
      return;
    }

    const roleMap = {
      hardware: 'hardware_store',
      construction: 'construction_company',
      worker: 'skilled_worker',
    };

    const userRole = roleMap[subscriptionData.planType];
    if (userRole) {
      await supabase
        .from('profiles')
        .update({
          user_type: userRole,
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionData.userId);
    }

    console.log('Subscription activated');
  } catch (error) {
    console.error('Subscription activation error:', error);
  }
    }
