import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Manual verification endpoint.
 * Can be used to check payment status from the browser or after redirect.
 * 
 * Usage: GET /api/paynow/verify?reference=VB-XXXXX
 */
export async function GET(request) {
  console.log('=== PAYNOW MANUAL VERIFICATION ===');

  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    console.log('Verifying reference:', reference);

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the payment
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found', reference },
        { status: 404 }
      );
    }

    console.log('Payment found:', payment.id, payment.payment_status);

    // If payment is pending, we might want to check with Paynow directly
    // For now, just return the current status
    return NextResponse.json({
      success: true,
      reference: payment.transaction_reference,
      status: payment.payment_status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.payment_method,
      user_id: payment.user_id,
      webhook_received: payment.webhook_received,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
      }
