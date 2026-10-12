import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  console.log('=== CREATE PAYMENT START ===');
  console.log('Supabase URL set:', !!supabaseUrl);
  console.log('Service Key set:', !!supabaseServiceKey);
  console.log('Service Key length:', supabaseServiceKey?.length || 0);

  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));

    const { userId, userEmail, amount, planType, reference } = body;

    if (!userId) {
      console.error('Missing userId');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!amount || !planType) {
      console.error('Missing amount or planType');
      return NextResponse.json({ error: 'Amount and plan are required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase env vars');
      return NextResponse.json({ 
        error: 'Server not configured',
        details: {
          urlSet: !!supabaseUrl,
          keySet: !!supabaseServiceKey,
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const insertData = {
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'USD',
      payment_method: planType,
      payment_status: 'pending',
      transaction_reference: reference,
      provider: 'paynow',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Insert data:', JSON.stringify(insertData));

    const { data, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Insert error code:', error.code);
      console.error('Insert error message:', error.message);
      console.error('Insert error details:', error.details);
      console.error('Insert error hint:', error.hint);
      
      return NextResponse.json(
        { 
          error: 'Failed to save payment record', 
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
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
    console.error('Create payment error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
                               }
