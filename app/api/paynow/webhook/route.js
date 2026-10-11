import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Normalize a reference string — remove hidden characters, trim, uppercase
 */
function normalizeRef(ref) {
  if (!ref) return '';
  return String(ref)
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/[\r\n\t]/g, '')                // whitespace chars
    .trim()
    .toUpperCase();
}

export async function POST(request) {
  console.log('=== PAYNOW WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Content-Type:', request.headers.get('content-type'));

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

    console.log('Raw webhook body:', JSON.stringify(data, null, 2));

    const rawReference = data.reference || data.Reference || data.merchantref;
    const reference = normalizeRef(rawReference);
    const paynowRef = data.paynowreference || data.paynowReference;
    const amount = data.amount || data.Amount;
    const status = data.status || data.Status;
    const pollUrl = data.pollurl || data.pollUrl;

    console.log('Normalized reference:', JSON.stringify(reference));
    console.log('Raw reference:', JSON.stringify(rawReference));
    console.log('Status:', status);

    if (!reference) {
      console.error('❌ No reference in webhook');
      return new NextResponse('ok', { status: 200 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase not configured');
      return new NextResponse('ok', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try multiple matching strategies
    let payment = null;
    let matchStrategy = 'none';

    // Strategy 1: exact match
    const { data: exactMatch } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', reference)
      .maybeSingle();

    if (exactMatch) {
      payment = exactMatch;
      matchStrategy = 'exact';
    }

    // Strategy 2: ilike match
    if (!payment) {
      const { data: ilikeMatch } = await supabase
        .from('payments')
        .select('*')
        .ilike('transaction_reference', reference)
        .maybeSingle();

      if (ilikeMatch) {
        payment = ilikeMatch;
        matchStrategy = 'ilike';
      }
    }

    // Strategy 3: contains match
    if (!payment) {
      const { data: containsMatch } = await supabase
        .from('payments')
        .select('*')
        .ilike('transaction_reference', `%${reference}%`)
        .maybeSingle();

      if (containsMatch) {
        payment = containsMatch;
        matchStrategy = 'contains';
      }
    }

    if (!payment) {
      console.error('❌ Payment not found for reference:', reference);
      return new NextResponse('ok', { status: 200 });
    }

    console.log('✅ Payment found via strategy:', matchStrategy);
    console.log('   Payment ID:', payment.id);
    console.log('   Current status:', payment.payment_status);

    // Determine paid status
    const statusLower = String(status || '').toLowerCase();
    const isPaid = ['paid', 'completed', 'ok', 'success'].includes(statusLower);

    if (isPaid) {
      console.log('💰 Payment confirmed as PAID');

      // Update payment
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          provider_code: paynowRef || null,
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('❌ Update error:', updateError);
      } else {
        console.log('✅ Payment updated to completed');
      }

      // Check if subscription exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('payment_id', payment.id)
        .maybeSingle();

      if (existingSub) {
        console.log('ℹ️ Subscription already exists');
      } else {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: payment.user_id,
            subscription_type: payment.payment_method,
            status: 'active',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            payment_id: payment.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (subError) {
          console.error('❌ Subscription error:', subError);
        } else {
          console.log('✅ Subscription activated for user:', payment.user_id);
        }
      }
    } else if (['cancelled', 'failed', 'declined'].includes(statusLower)) {
      console.log('❌ Payment failed:', status);

      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          webhook_received: true,
          webhook_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    } else {
      console.log('ℹ️ Status not actionable:', status);
    }

    return new NextResponse('ok', { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    return new NextResponse('ok', { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Paynow webhook endpoint is active' },
    { status: 200 }
  );
    }
