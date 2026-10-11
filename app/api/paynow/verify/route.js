import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeRef(ref) {
  if (!ref) return '';
  return String(ref)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .toUpperCase();
}

export async function GET(request) {
  console.log('=== PAYNOW VERIFY ===');

  try {
    const { searchParams } = new URL(request.url);
    const rawReference = searchParams.get('reference');

    if (!rawReference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const reference = normalizeRef(rawReference);
    console.log('Looking up:', JSON.stringify(reference));

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try multiple strategies
    let payment = null;
    let strategy = 'none';

    // 1. Exact
    const { data: exact } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (exact) {
      payment = exact;
      strategy = 'exact';
    }

    // 2. ilike
    if (!payment) {
      const { data: ilike } = await supabase
        .from('payments')
        .select('*')
        .ilike('transaction_reference', reference)
        .maybeSingle();

      if (ilike) {
        payment = ilike;
        strategy = 'ilike';
      }
    }

    // 3. contains
    if (!payment) {
      const { data: contains } = await supabase
        .from('payments')
        .select('*')
        .ilike('transaction_reference', `%${reference}%`)
        .maybeSingle();

      if (contains) {
        payment = contains;
        strategy = 'contains';
      }
    }

    if (!payment) {
      return NextResponse.json({
        error: 'Payment not found',
        searchedFor: reference,
        strategiesTried: ['exact', 'ilike', 'contains'],
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      matchStrategy: strategy,
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
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
