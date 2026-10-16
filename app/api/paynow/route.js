import { NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/paynow';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Paynow payment request:', body);

    const {
      amount,
      customerEmail,
      planType,
      planName,
      planDuration,
      userId,
    } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await initiatePayment({
      amount: parseFloat(amount),
      customerEmail,
      planType: planType || 'payment',
      planName: planName || 'Payment',
      planDuration: planDuration || '',
      userId: userId || null,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      pollUrl: result.pollUrl,
      reference: result.reference,
    });

  } catch (error) {
    console.error('Paynow route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Paynow API endpoint' });
                                }
