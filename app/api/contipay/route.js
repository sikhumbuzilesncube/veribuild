import { NextResponse } from 'next/server';
import { initiatePayment } from '../../lib/contipay';

export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Payment request received:', body);

    const { 
      amount, 
      customerEmail, 
      customerFirstName, 
      customerLastName,
      customerPhone,
      nationalId,
      planType, 
      planName, 
      planDuration, 
      userId 
    } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const paymentData = {
      amount: parsedAmount,
      currency: body.currency || 'USD',
      customerEmail: customerEmail,
      customerFirstName: customerFirstName || 'Customer',
      customerLastName: customerLastName || 'User',
      customerPhone: customerPhone || '+2637000000000',
      nationalId: nationalId || '00 1234567 A 00',
      planType: planType || 'hardware',
      planName: planName || 'Hardware Store',
      planDuration: planDuration || 'monthly',
      userId: userId || 'guest-user'
    };

    const result = await initiatePayment(paymentData);
    
    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      transactionId: result.transactionId,
      reference: result.reference,
      status: result.status,
      message: result.message
    });

  } catch (error) {
    console.error('Payment error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate payment'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    }
  });
  }
