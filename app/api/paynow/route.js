import { NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/paynow';
import { getPrice, getPaymentPurpose } from '@/lib/prices';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Paynow payment request:', body);

    const {
      customerEmail,
      planType,
      planName,
      planDuration,
      userId,
      projectId,
      reference,
    } = body;

    if (!planType) {
      return NextResponse.json({ error: 'Plan type required' }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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

    const result = await initiatePayment({
      amount: amount,
      customerEmail,
      planType,
      planName: planName || 'Payment',
      planDuration: planDuration || '',
      userId: userId || null,
      projectId: projectId || null,
      paymentPurpose: paymentPurpose,
      reference: reference || null,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      pollUrl: result.pollUrl,
      reference: result.reference,
      amount: amount,
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
