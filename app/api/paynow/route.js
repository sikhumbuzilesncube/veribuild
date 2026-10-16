import { NextResponse } from 'next/server';
import { initiatePayment } from '../../lib/paynow';
import { getAuthenticatedUser } from '../../../lib/server-auth';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      customerEmail,
      planType,
      planName,
      planDuration,
    } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Prefer the authenticated user's email over whatever the client sent.
    const resolvedEmail = user.email || customerEmail;
    if (!resolvedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await initiatePayment({
      amount: parseFloat(amount),
      customerEmail: resolvedEmail,
      planType: planType || 'payment',
      planName: planName || 'Payment',
      planDuration: planDuration || '',
      // Use the authenticated user id, not the client-supplied value.
      userId: user.id,
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
