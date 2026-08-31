import { NextResponse } from 'next/server';

const PAYNOW_INTEGRATION_ID = '25439';
const PAYNOW_INTEGRATION_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';
const PAYNOW_API_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description } = body;

    // Validate
    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Amount and email are required' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build the data for PayNow
    const data = {
      id: PAYNOW_INTEGRATION_ID,
      key: PAYNOW_INTEGRATION_KEY,
      reference: reference,
      amount: amount.toFixed(2),
      email: email,
      phone: phone || '',
      additionalinfo: description || 'VeriBuild Payment',
      returnurl: 'https://veribuild.vercel.app/payment/success',
      statusurl: 'https://veribuild.vercel.app/api/paynow/status'
    };

    // Build form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    const response = await fetch(PAYNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    console.log('PayNow response:', result);

    if (result.status === 'Ok') {
      return NextResponse.json({
        success: true,
        redirectUrl: result.browserurl,
        pollUrl: result.pollurl,
        reference: result.reference,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Payment initiation failed',
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Payment initiation failed' },
      { status: 500 }
    );
  }
      }
