import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/paynow';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reference, pollUrl } = body;

    if (!reference || !pollUrl) {
      return NextResponse.json(
        { error: 'Reference and pollUrl are required' },
        { status: 400 }
      );
    }

    // Check payment status from PayNow
    const result = await checkPaymentStatus(pollUrl);
    console.log('Payment status result:', result);

    // Update payment record in database
    const paymentStatus = result.status === 'Paid' ? 'completed' : 'pending';
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_reference', reference);

    if (updateError) {
      console.error('Failed to update payment status:', updateError);
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      data: result,
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
            }
