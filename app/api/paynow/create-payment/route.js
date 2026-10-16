import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      userEmail,
      amount,
      planType,
      reference,
      projectId,
      paymentPurpose,
    } = body;

    console.log('Create payment:', {
      userId,
      userEmail,
      amount,
      planType,
      reference,
      projectId,
      paymentPurpose,
    });

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    if (!amount || !planType) {
      return NextResponse.json({ error: 'Amount and plan required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
        project_id: projectId ? parseInt(projectId, 10) : null,
        payment_purpose: paymentPurpose || null,
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
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
}
