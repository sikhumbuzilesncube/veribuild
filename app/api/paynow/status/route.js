import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '../../../lib/paynow';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const pollUrl = searchParams.get('pollUrl');

    if (!reference && !pollUrl) {
      return NextResponse.json(
        { error: 'Reference or pollUrl is required' },
        { status: 400 }
      );
    }

    let urlToCheck = pollUrl;
    let referenceToUse = reference;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = supabaseUrl && supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey) 
      : null;

    // If only reference provided, look up pollUrl from database
    if (!urlToCheck && reference && supabase) {
      const { data } = await supabase
        .from('payments')
        .select('poll_url, payment_proof_url')
        .eq('transaction_reference', reference)
        .single();

      if (data?.payment_proof_url || data?.poll_url) {
        urlToCheck = data.payment_proof_url || data.poll_url;
      }
    }

    if (!urlToCheck) {
      return NextResponse.json(
        { error: 'Could not find poll URL for this reference' },
        { status: 404 }
      );
    }

    const result = await checkPaymentStatus(urlToCheck);

    // Update database if payment status changed
    if (supabase && referenceToUse && result.paid) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('id, user_id, payment_method, payment_status')
          .eq('transaction_reference', referenceToUse)
          .single();

        if (payment && payment.payment_status !== 'completed') {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              payment_status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('transaction_reference', referenceToUse);

          // Activate subscription
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

          console.log('Payment marked completed and subscription activated');
        }
      } catch (dbError) {
        console.error('DB update error:', dbError.message);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Paynow status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
       }
