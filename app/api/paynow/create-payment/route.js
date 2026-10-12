import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { userId, userEmail, amount, planType, reference } = await request.json();

    console.log('Create payment request:', { userId, userEmail, amount, planType, reference });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!amount || !planType) {
      return NextResponse.json({ error: 'Amount and plan are required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        currency: 'USD',
        payment_method: planType,
        payment_status: 'pending',
        transaction_reference: reference,
        provider: 'paynow',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save payment record', details: error.message },
        { status: 500 }
      );
    }

    console.log('Payment record created:', data.id);

    return NextResponse.json({
      success: true,
      paymentId: data.id,
      reference: data.transaction_reference,
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
        }
