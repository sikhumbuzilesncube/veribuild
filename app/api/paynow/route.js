import { NextResponse } from 'next/server';

const PAYNOW_ID = '25439';
const PAYNOW_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';
const PAYNOW_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description } = body;

    console.log('📊 PayNow request:', { amount, email, phone, description });

    // Validate
    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Amount and email are required'
      }, { status: 400 });
    }

    // Generate reference
    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build PayNow data
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

    // Send to PayNow
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

    // PayNow returns response as URL-encoded string
    // e.g., "status=Ok&browserurl=https://..."
    // or "status=Err&error=Invalid+reference"
    const params = new URLSearchParams(responseText);
    const status = params.get('status');
    
    if (status === 'Ok') {
      const browserurl = params.get('browserurl');
      const pollurl = params.get('pollurl');
      const reference = params.get('reference');
      
      console.log('✅ Payment initiated:', { browserurl, pollurl, reference });
      
      return NextResponse.json({
        success: true,
        redirectUrl: browserurl,
        pollUrl: pollurl,
        reference: reference,
      });
    } else {
      const error = params.get('error') || 'Payment initiation failed';
      console.log('❌ Payment error:', error);
      
      return NextResponse.json({
        success: false,
        error: error,
      });
    }

  } catch (error) {
    console.error('❌ Payment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment initiation failed',
    }, { status: 500 });
  }
}
