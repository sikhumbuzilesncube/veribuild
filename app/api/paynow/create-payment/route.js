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

    // Safely parse projectId. If it's missing or not a number, set to null.
    let parsedProjectId = null;
    if (projectId != null && projectId !== '') {
      const num = parseInt(projectId, 10);
      if (!isNaN(num)) parsedProjectId = num;
    }

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
        project_id: parsedProjectId,
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
