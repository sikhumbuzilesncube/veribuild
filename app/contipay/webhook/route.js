import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);

    // Verify the webhook signature (if ContiPay provides one)
    // This is a security measure to ensure the request is from ContiPay
    // Add signature verification here if ContiPay supports it

    const { 
      transaction_id, 
      status, 
      amount, 
      currency, 
      customer_email,
      metadata 
    } = body;

    // Validate required fields
    if (!transaction_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process based on status
    if (status === 'completed' || status === 'successful') {
      // Update payment record in database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transaction_id,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transaction_id)
        .select()
        .single();

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        return NextResponse.json(
          { error: 'Failed to update payment' },
          { status: 500 }
        );
      }

      // Activate user subscription
      if (payment) {
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: payment.user_id,
            plan_type: payment.plan_type,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            transaction_id: transaction_id,
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) {
          console.error('Error activating subscription:', subscriptionError);
          // We'll continue even if subscription activation fails
          // The admin can manually activate later
        }

        // Update user role based on plan type
        const roleMap = {
          hardware: 'hardware_store',
          construction: 'construction_company',
          worker: 'skilled_worker'
        };

        const newRole = roleMap[payment.plan_type];
        if (newRole) {
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ 
              user_type: newRole,
              is_verified: true 
            })
            .eq('id', payment.user_id);

          if (roleError) {
            console.error('Error updating user role:', roleError);
          }
        }
      }
    } else if (status === 'failed' || status === 'cancelled') {
      // Update payment record as failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transaction_id);
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify webhook endpoint
export async function GET(request) {
  return NextResponse.json(
    { message: 'Webhook endpoint is active' },
    { status: 200 }
  );
        }
