import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../lib/server-auth';
import { checkPaymentStatus } from '../../../lib/paynow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (payment.user_id && payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
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

        return NextResponse.json({
          success: true,
          reference: payment.transaction_reference,
          status: statusResult.status || 'pending',
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
