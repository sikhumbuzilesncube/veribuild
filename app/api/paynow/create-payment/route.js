import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrice, getPaymentPurpose } from '@/lib/prices';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      userEmail,
      planType,
      reference,
      projectId,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    if (!planType) {
      return NextResponse.json({ error: 'Plan type required' }, { status: 400 });
    }

    // Server-side price enforcement.
    // The amount sent by the client is ignored. The price is looked up
    // from the canonical map based on planType. An unknown plan type is
    // rejected outright — we never charge for a plan we do not recognise.
    const amount = getPrice(planType);
    if (amount == null) {
      return NextResponse.json(
        { error: `Unknown plan type: ${planType}` },
        { status: 400 }
      );
    }

    const paymentPurpose = getPaymentPurpose(planType);

    console.log('Create payment:', {
      userId,
      userEmail,
      planType,
      amount,
      paymentPurpose,
      reference,
      projectId,
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'USD',
        payment_method: planType,
        payment_status: 'pending',
        transaction_reference: reference,
        provider: 'paynow',
        project_id: projectId ? parseInt(projectId, 10) : null,
        payment_purpose: paymentPurpose,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save payment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: data.id,
      reference: data.transaction_reference,
      amount: data.amount,
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
  }
