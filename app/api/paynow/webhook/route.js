import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPaynowHash } from '../../../../lib/paynow-hash';

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

    // Never log the full payload. It contains customer details and the hash.
    // Log only the reference and status for diagnostics.
    const reference = data.reference || data.Reference;
    const status = data.status || data.Status;
    console.log('Webhook reference:', reference || '(missing)');
    console.log('Webhook status:', status || '(missing)');

    if (!reference) {
      // Nothing to do. Return 200 so Paynow does not keep retrying.
      return new NextResponse('ok', { status: 200 });
    }

    // Verify the hash before trusting anything else in the payload.
    const hashOk = verifyPaynowHash(data);
    if (!hashOk) {
      console.warn('Webhook rejected: hash verification failed for reference', reference);
      // Return 200 so Paynow does not retry. Do not touch the database.
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
      console.warn('Webhook: no payment row for reference', reference);
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

      // Create subscription for subscription plans
      const subscriptionPlans = ['hardware', 'construction', 'worker'];
      if (subscriptionPlans.includes(payment.payment_method)) {
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
          });
        }
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
    console.error('Webhook error:', error.message);
    // Always return 200 so Paynow does not retry indefinitely on our bugs.
    return new NextResponse('ok', { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Paynow webhook active' });
                  }
