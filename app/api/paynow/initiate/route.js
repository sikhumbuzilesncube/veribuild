import { NextResponse } from 'next/server';
import { initiatePayNowPayment } from '@/app/lib/paynow';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      email, 
      phone, 
      description, 
      projectId, 
      paymentType,
      userId 
    } = body;

    // Validate
    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Amount and email are required' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Initiate PayNow payment
    const result = await initiatePayNowPayment({
      reference,
      amount,
      email,
      phone: phone || '',
      description: description || `VeriBuild Payment - ${reference}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      pollUrl: result.pollUrl,
      reference: result.reference,
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Payment initiation failed' },
      { status: 500 }
    );
  }
      }
