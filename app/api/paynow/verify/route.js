import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkPaymentStatus } from '@/lib/paynow';
import { parsePlanType, planToDbFields } from '@/lib/subscriptions';
import { getPaymentPurpose } from '@/lib/prices';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Same as the webhook's activateSubscription. Duplicated here so verify can
 * complete a payment even if the webhook has not fired yet (e.g. on local
 * development or when Paynow's callback is delayed).
 */
async function activateSubscription(supabase, payment) {
  const parsed = parsePlanType(payment.payment_method);
  if (!parsed) {
    console.warn('Verify: cannot parse plan type', payment.payment_method);
    return;
  }

  const { category, planKey, categoryConfig } = parsed;
  const dbFields = planToDbFields(category, planKey);
  if (!dbFields) {
    console.warn('Verify: no db fields for plan', category, planKey);
    return;
  }

  const table = categoryConfig.table;

  const { data: listingRow } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', payment.user_id)
    .maybeSingle();

  if (!listingRow) {
    console.warn('Verify: no listing row for user', payment.user_id, 'in', table);
    return;
  }

  const { error: updateError } = await supabase
    .from(table)
    .update(dbFields)
    .eq('id', listingRow.id);

  if (updateError) {
    console.error('Verify: failed to update listing row', updateError);
    return;
  }

  console.log('Verify: subscription activated for', category, planKey, 'user', payment.user_id);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
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

          const purpose = payment.payment_purpose || getPaymentPurpose(payment.payment_method);

          if (purpose === 'subscription') {
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
                amount: payment.amount,
                currency: payment.currency || 'USD',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: 'active',
                payment_id: payment.id,
              });
            }

            await activateSubscription(supabase, payment);
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

        // Paynow returned a non-paid status (pending, cancelled, etc).
        // Normalise it so the success page can decide what to render.
        const returned = String(statusResult.status || 'pending').toLowerCase();
        return NextResponse.json({
          success: true,
          reference: payment.transaction_reference,
          status: returned,
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
