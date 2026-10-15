import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let Paynow;
try {
  Paynow = require('paynow').Paynow;
} catch (e) {
  const paynowModule = require('paynow');
  Paynow = paynowModule.Paynow || paynowModule.default?.Paynow || paynowModule;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' });
    }

    if (!payment.payment_proof_url) {
      return NextResponse.json({ 
        error: 'No poll URL in payment record',
        payment: {
          id: payment.id,
          reference: payment.transaction_reference,
        }
      });
    }

    // Call Paynow directly and dump the raw response
    const paynow = new Paynow(
      process.env.PAYNOW_SDK_INTEGRATION_ID || '25438',
      process.env.PAYNOW_SDK_INTEGRATION_KEY || ''
    );

    console.log('Polling URL:', payment.payment_proof_url);
    const rawStatus = await paynow.pollTransaction(payment.payment_proof_url);

    // Dump EVERYTHING
    return NextResponse.json({
      pollUrl: payment.payment_proof_url,
      rawResponse: rawStatus,
      rawResponseJSON: JSON.stringify(rawStatus),
      typeOfPaid: typeof rawStatus.paid,
      valueOfPaid: rawStatus.paid,
      typeOfStatus: typeof rawStatus.status,
      valueOfStatus: rawStatus.status,
      allKeys: Object.keys(rawStatus),
      allValues: Object.values(rawStatus),
    });

  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
    }, { status: 500 });
  }
      }
