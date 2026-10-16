import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../../lib/server-auth';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, planType, reference } = body;

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
        // Use the authenticated user id, not the client-supplied value.
        user_id: user.id,
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
