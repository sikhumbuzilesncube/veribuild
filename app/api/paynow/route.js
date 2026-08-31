import { NextResponse } from 'next/server';
import { Paynow } from 'paynow';

const PAYNOW_ID = '25439';
const PAYNOW_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description } = body;

    console.log('📊 PayNow request:', { amount, email, phone, description });

    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Amount and email are required'
      }, { status: 400 });
    }

    // Create PayNow instance
    const paynow = new Paynow(PAYNOW_ID, PAYNOW_KEY);

    // Set return and result URLs
    paynow.returnUrl = 'https://veribuild.vercel.app/dashboard';
    paynow.resultUrl = 'https://veribuild.vercel.app/api/paynow/status';

    // Create a new payment
    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const payment = paynow.createPayment(`VeriBuild Payment - ${reference}`);

    // Add item (the amount)
    payment.add(description || 'VeriBuild Payment', parseFloat(amount));

    // Send payment to PayNow
    const response = await paynow.send(payment);

    console.log('📥 PayNow response:', response);

    if (response && response.success) {
      return NextResponse.json({
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        reference: reference,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response?.error || 'Payment initiation failed',
      });
    }

  } catch (error) {
    console.error('❌ Payment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment initiation failed',
    }, { status: 500 });
  }
}
