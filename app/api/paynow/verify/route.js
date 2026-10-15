import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkPaymentStatus } from '../../../lib/paynow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeRef(ref) {
  if (!ref) return '';
  return String(ref)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .toUpperCase();
}

export async function GET(request) {
  console.log('=== PAYNOW VERIFY START ===');

  try {
    const { searchParams } = new URL(request.url);
    const rawReference = searchParams.get('reference');

    if (!rawReference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const reference = normalizeRef(rawReference);
    console.log('Looking up:', reference);

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Find payment in our DB
    let payment = null;
    let strategy = 'none';

    const { data: exact } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (exact) {
      payment = exact;
      strategy = 'exact';
    }

    if (!payment) {
      const { data: ilike } = await supabase
        .from('payments')
        .select('*')
        .ilike('transaction_reference', reference)
        .maybeSingle();

      if (ilike) {
        payment = ilike;
        strategy = 'ilike';
      }
    }

    if (!payment) {
      return NextResponse.json({
        error: 'Payment not found',
        searchedFor: reference,
        strategiesTried: ['exact', 'ilike'],
      }, { status: 404 });
    }

    console.log('Payment found via strategy:', strategy, '- DB status:', payment.payment_status);

    // Step 2: If already completed, return immediately
    if (payment.payment_status === 'completed') {
      return NextResponse.json({
        success: true,
        matchStrategy: strategy,
        reference: payment.transaction_reference,
        status: 'completed',
        amount: payment.amount,
        currency: payment.currency,
        method: payment.payment_method,
        user_id: payment.user_id,
        webhook_received: payment.webhook_received,
        verified_via: 'database',
        created_at: payment.created_at,
      });
    }

    // Step 3: If pending and has poll URL, poll Paynow
    if (payment.payment_proof_url) {
      console.log('Polling Paynow:', payment.payment_proof_url);
      
      try {
        const statusResult = await checkPaymentStatus(payment.payment_proof_url);
        console.log('Paynow poll result:', JSON.stringify(statusResult));

        // FIXED: Check both 'paid' boolean and 'status' string
        const isPaid = 
          statusResult.paid === true ||
          String(statusResult.status || '').toLowerCase() === 'paid' ||
          String(statusResult.status || '').toLowerCase() === 'completed';

        if (isPaid) {
          console.log('💰 Payment is PAID — updating DB');

          await supabase
            .from('payments')
            .update({
              payment_status: 'completed',
              webhook_received: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          // Create subscription if not exists
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

            console.log('✅ Subscription created');
          }

          return NextResponse.json({
            success: true,
            matchStrategy: strategy,
            reference: payment.transaction_reference,
            status: 'completed',
            paid: true,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.payment_method,
            user_id: payment.user_id,
            webhook_received: true,
            verified_via: 'paynow_poll',
            message: 'Payment verified and activated',
          });
        } else {
          console.log('Payment status from Paynow:', statusResult.status);
          
          return NextResponse.json({
            success: true,
            matchStrategy: strategy,
            reference: payment.transaction_reference,
            status: statusResult.status || 'pending',
            paid: false,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.payment_method,
            user_id: payment.user_id,
            verified_via: 'paynow_poll',
            message: 'Payment not yet confirmed by Paynow',
          });
        }
      } catch (pollError) {
        console.error('Poll error:', pollError.message);
        
        return NextResponse.json({
          success: false,
          matchStrategy: strategy,
          reference: payment.transaction_reference,
          status: 'pending',
          paid: false,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.payment_method,
          user_id: payment.user_id,
          verified_via: 'database_only',
          poll_error: pollError.message,
        });
      }
    }

    // No poll URL
    return NextResponse.json({
      success: true,
      matchStrategy: strategy,
      reference: payment.transaction_reference,
      status: payment.payment_status,
      paid: payment.payment_status === 'completed',
      amount: payment.amount,
      currency: payment.currency,
      method: payment.payment_method,
      user_id: payment.user_id,
      webhook_received: payment.webhook_received,
      verified_via: 'database_only',
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
      }
