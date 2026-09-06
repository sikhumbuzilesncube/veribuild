import { NextResponse } from 'next/server';
import { initiatePayment } from '../../lib/contipay';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received payment request:', body);

    // Validate required fields
    const { amount, customerEmail, customerFirstName, customerLastName, planType, planName, planDuration, userId } = body;

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

    // Ensure amount is a valid number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Prepare payment data with all required fields
    const paymentData = {
      amount: parsedAmount,
      currency: body.currency || 'USD',
      customerEmail: customerEmail,
      customerFirstName: customerFirstName || 'Customer',
      customerLastName: customerLastName || 'User',
      customerPhone: body.customerPhone || '',
      planType: planType || 'hardware',
      planName: planName || 'Hardware Store',
      planDuration: planDuration || 'monthly',
      userId: userId || 'guest-user'
    };

    console.log('Initiating payment with data:', paymentData);

    // Call ContiPay initiation
    const result = await initiatePayment(paymentData);
    
    console.log('Payment initiated successfully:', result);

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      redirect_url: result.paymentUrl,
      transactionId: result.transactionId,
      status: result.status
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    
    // Return a more detailed error message
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate payment',
        details: error.details || 'Please try again or contact support'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
         }
