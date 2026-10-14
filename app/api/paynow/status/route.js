import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find payment by reference
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json({ 
        error: 'Payment not found',
        reference,
      }, { status: 404 });
    }

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
    });

  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
        }
