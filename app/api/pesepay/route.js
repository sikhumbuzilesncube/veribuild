import { NextResponse } from 'next/server';
import { initiatePayment } from '../../lib/pesepay';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('PesePay payment request received:', body);

    const { 
      amount, 
      customerEmail, 
      customerFirstName, 
      customerLastName,
      planType, 
      planName, 
      planDuration, 
      userId 
    } = body;

    // Validate required fields
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
      status: result.status
    });

  } catch (error) {
    console.error('PesePay payment error:', error);
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
        }
