import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkPaymentStatus } from '../../../lib/pesepay';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('PesePay webhook received:', body);

    // PesePay sends the reference number in the webhook
    const referenceNumber = body.referenceNumber || body.reference;
    const transactionStatus = body.transactionStatus || body.status;

    if (!referenceNumber) {
      console.error('No reference number in webhook');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verify status with PesePay API
    let verifiedStatus = transactionStatus;
    let amountDetails = null;

    try {
      const statusCheck = await checkPaymentStatus(referenceNumber);
      verifiedStatus = statusCheck.status;
      amountDetails = statusCheck.amountDetails;
    } catch (err) {
      console.error('Status verification failed:', err);
    }

    const isSuccessful = verifiedStatus === 'SUCCESS' || verifiedStatus === 'PAID' || verifiedStatus === 'COMPLETED';

    if (isSuccessful) {
      console.log(`Payment ${referenceNumber} completed`);

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_status: verifiedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', referenceNumber)
        .select()
        .single();

      if (!paymentError && payment) {
        await activateSubscription({
          userId: payment.user_id,
          planType: payment.plan_type,
          transactionId: referenceNumber,
          amount: amountDetails?.amount || payment.amount,
          currency: amountDetails?.currencyCode || payment.currency
        });
      }
    } else if (verifiedStatus === 'FAILED' || verifiedStatus === 'CANCELLED' || verifiedStatus === 'DECLINED') {
      console.log(`Payment ${referenceNumber} failed: ${verifiedStatus}`);

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          transaction_status: verifiedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', referenceNumber);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json(
      { received: true, status: verifiedStatus },
      { status: 200 }
    );

  } catch (error) {
    console.error('PesePay webhook error:', error);
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'PesePay webhook endpoint is active' },
    { status: 200 }
  );
}

async function activateSubscription(subscriptionData) {
  try {
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
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Subscription activation error:', error);
      return;
    }

    const roleMap = {
      hardware: 'hardware_store',
      construction: 'construction_company',
      worker: 'skilled_worker'
    };

    const userRole = roleMap[subscriptionData.planType];
    if (userRole) {
      await supabase
        .from('profiles')
        .update({
          user_type: userRole,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionData.userId);
    }

    console.log('Subscription activated');
  } catch (error) {
    console.error('Subscription error:', error);
  }
}
