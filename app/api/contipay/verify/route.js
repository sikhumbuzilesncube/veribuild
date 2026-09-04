import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Query the payment from database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error) {
      // If payment not found, check with ContiPay API directly
      // This is a fallback to verify with ContiPay
      try {
        const contipayVerifyUrl = `https://api.uat.contipay.net/v1/transactions/${transactionId}`;
        const response = await fetch(contipayVerifyUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.CONTIPAY_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to verify with ContiPay');
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (contipayError) {
        console.error('ContiPay verification error:', contipayError);
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
      }
