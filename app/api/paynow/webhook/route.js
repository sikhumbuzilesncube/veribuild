import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parsePlanType, planToDbFields } from '@/lib/subscriptions';
import { getPaymentPurpose } from '@/lib/prices';
import { notifyAdmin } from '@/lib/notify-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function activateSubscription(supabase, payment) {
  const parsed = parsePlanType(payment.payment_method);
  if (!parsed) return;

  const { category, planKey, categoryConfig } = parsed;
  const dbFields = planToDbFields(category, planKey);
  if (!dbFields) return;

  const { data: listingRow } = await supabase
    .from(categoryConfig.table)
    .select('id')
    .eq('user_id', payment.user_id)
    .maybeSingle();

  if (!listingRow) return;

  await supabase
    .from(categoryConfig.table)
    .update(dbFields)
    .eq('id', listingRow.id);
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

    // Prevent duplicate processing if webhook fires twice
    if (payment.payment_status === 'completed') {
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

      // Send admin notification
      const cleanMethod = payment.payment_method.replace(/_/g, ' ').toUpperCase();
      await notifyAdmin(
        `New Payment Received: $${payment.amount}`,
        `A new payment has been successfully processed.\n\nAmount: $${payment.amount} ${payment.currency}\nType: ${cleanMethod}\nPurpose: ${purpose}\nReference: ${payment.transaction_reference}`
      );

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
