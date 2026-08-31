import { NextResponse } from 'next/server';

const PAYNOW_ID = '25439';
const PAYNOW_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';
const PAYNOW_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description } = body;

    console.log('📊 PayNow request:', { amount, email, phone, description });

    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Amount and email are required'
      });
    }

    // Generate unique reference
    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build PayNow data - CORRECT FORMAT
    const data = {
      id: PAYNOW_ID,
      key: PAYNOW_KEY,
      reference: reference,
      amount: amount,
      email: email,
      phone: phone || '',
      additionalinfo: description || 'VeriBuild Payment',
      returnurl: 'https://veribuild.vercel.app/dashboard',
      statusurl: 'https://veribuild.vercel.app/api/paynow/status'
    };

    console.log('📤 Sending to PayNow:', data);

    // Send as form data (x-www-form-urlencoded)
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    const response = await fetch(PAYNOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('📥 PayNow raw response:', responseText);

    // Parse response
    if (responseText.startsWith('status=')) {
      const params = new URLSearchParams(responseText);
      const status = params.get('status');
      
      if (status === 'Ok') {
        const browserurl = params.get('browserurl');
        const pollurl = params.get('pollurl');
        
        return NextResponse.json({
          success: true,
          redirectUrl: browserurl,
          pollUrl: pollurl,
          reference: reference,
        });
      } else {
        const error = params.get('error') || 'Payment initiation failed';
        return NextResponse.json({
          success: false,
          error: error,
        });
      }
    } else {
      // If response is not in expected format
      return NextResponse.json({
        success: false,
        error: 'Unexpected response from PayNow',
        raw: responseText
      });
    }

  } catch (error) {
    console.error('❌ Payment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment initiation failed',
    });
  }
}
