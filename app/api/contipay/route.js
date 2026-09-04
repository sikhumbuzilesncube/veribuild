import { NextResponse } from 'next/server';
import { initiateContiPayPayment } from '@/lib/contipay';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description, projectId, provider, userId } = body;

    console.log('📊 ContiPay initiate request:', { amount, email, phone, description, provider });

    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Amount and email are required'
      }, { status: 400 });
    }

    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const result = await initiateContiPayPayment({
      amount: parseFloat(amount),
      email: email,
      phone: phone || '',
      description: description || 'VeriBuild Payment',
      reference: reference,
      provider: provider || 'ecocash',
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    await supabase
      .from('payments')
      .insert({
        user_id: userId || null,
        project_id: projectId || null,
        amount: parseFloat(amount),
        currency: 'USD',
        payment_method: 'contipay',
        payment_status: 'pending',
        transaction_reference: result.reference,
        provider_reference: result.providerReference,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      paymentId: result.paymentId,
      reference: result.reference,
    });

  } catch (error) {
    console.error('❌ ContiPay initiation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment initiation failed'
    }, { status: 500 });
  }
}
