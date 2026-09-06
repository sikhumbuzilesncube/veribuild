import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log('Webhook received:', payload);

    const {
      contiPayRef,
      merchantRef,
      amount,
      currencyCode,
      statusCode,
      status,
      message,
      firstName,
      lastName,
      email,
      providerCode,
      providerName,
      correlator
    } = payload;

    const isSuccessful = statusCode === 1 || status === 'paid' || message === 'COMPLETED';

    if (isSuccessful) {
      console.log(`Payment ${merchantRef} completed`);

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: contiPayRef,
          provider_code: providerCode,
          provider_name: providerName,
          correlator: correlator,
          updated_at: new Date().toISOString()
        })
        .eq('reference', merchantRef)
        .select()
        .single();

      if (!paymentError && payment) {
        await activateSubscription({
          userId: payment.user_id,
          planType: payment.plan_type,
          transactionId: contiPayRef,
          amount: amount,
          currency: currencyCode
        });
      }
    } else {
      console.log(`Payment ${merchantRef} failed: ${message}`);

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          status_message: message,
          updated_at: new Date().toISOString()
        })
        .eq('reference', merchantRef);
    }

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  }
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
