import { NextResponse } from 'next/server';
import { initiatePayment } from '../../lib/paynow';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Paynow payment request received:', body);

    const { 
      amount, 
      customerEmail, 
      planType, 
      planName, 
      planDuration, 
      userId 
    } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const result = await initiatePayment({
      amount: parsedAmount,
      customerEmail,
      planType: planType || 'hardware',
      planName: planName || 'Hardware Store',
      planDuration: planDuration || 'monthly',
      userId: userId || 'guest-user',
    });

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      pollUrl: result.pollUrl,
      reference: result.reference,
    });

  } catch (error) {
    console.error('Paynow payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Paynow API endpoint. Use POST to initiate payment.',
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
  }
