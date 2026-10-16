import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parsePlanType, planToDbFields } from '@/lib/subscriptions';
import { getPaymentPurpose } from '@/lib/prices';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Activate a subscription for the paying user.
 *
 * Looks up the listing row for the user (construction_companies, architects,
 * workers, or hardware_stores), then writes the plan fields.
 *
 * Idempotent: if the listing already has the same tier and status, it does
 * nothing. Safe to call multiple times for the same payment.
 */
async function activateSubscription(supabase, payment) {
  const parsed = parsePlanType(payment.payment_method);
  if (!parsed) {
    console.warn('Webhook: cannot parse plan type', payment.payment_method);
    return;
  }

  const { category, planKey, categoryConfig } = parsed;
  const dbFields = planToDbFields(category, planKey);
  if (!dbFields) {
    console.warn('Webhook: no db fields for plan', category, planKey);
    return;
  }

  const table = categoryConfig.table;

  const { data: listingRow } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', payment.user_id)
    .maybeSingle();

  if (!listingRow) {
    console.warn('Webhook: no listing row for user', payment.user_id, 'in', table);
    return;
  }

  const { error: updateError } = await supabase
    .from(table)
    .update(dbFields)
    .eq('id', listingRow.id);

  if (updateError) {
    console.error('Webhook: failed to update listing row', updateError);
    return;
  }

  console.log('Webhook: subscription activated for', category, planKey, 'user', payment.user_id);
}

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

    const reference = data.reference || data.Reference;
    const status = data.status || data.Status;

    if (!reference) {
      return new NextResponse('ok', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const statusLower = String(status || '').toLowerCase();
    const isPaid = ['paid', 'completed', 'ok'].includes(statusLower);

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (!payment) {
      return new NextResponse('ok', { status: 200 });
    }

    if (isPaid) {
      await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      const purpose = payment.payment_purpose || getPaymentPurpose(payment.payment_method);

      if (purpose === 'subscription') {
        // 1. Create the subscriptions row (once)
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

        // 2. Update the listing row
        await activateSubscription(supabase, payment);
      }
    } else if (['cancelled', 'failed', 'declined'].includes(statusLower)) {
      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    }

    return new NextResponse('ok', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('ok', { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Paynow webhook active' });
}
