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

    // Build the request
    const data = {
      id: PAYNOW_ID,
      key: PAYNOW_KEY,
      reference: reference,
      amount: amount.toString(),
      email: email,
      phone: phone || '',
      additionalinfo: description || 'VeriBuild Payment',
      returnurl: 'https://veribuild.vercel.app/dashboard',
      statusurl: 'https://veribuild.vercel.app/api/paynow/status'
    };

    console.log('📤 Sending to PayNow:', data);

    // Send as URLSearchParams
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(PAYNOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('📥 PayNow raw response:', responseText);

    // Check if response is empty
    if (!responseText || responseText.trim() === '') {
      console.error('❌ Empty response from PayNow');
      return NextResponse.json({
        success: false,
        error: 'No response from PayNow. Please try again.',
        details: 'Empty response'
      });
    }

    // Try to parse as URL-encoded
    try {
      const params = new URLSearchParams(responseText);
      const status = params.get('status');
      
      console.log('📊 Status:', status);

      if (status === 'Ok') {
        const browserurl = params.get('browserurl');
        const pollurl = params.get('pollurl');
        
        if (!browserurl) {
          console.error('❌ No browserurl in response');
          return NextResponse.json({
            success: false,
            error: 'Invalid PayNow response: missing redirect URL',
            details: responseText
          });
        }

        return NextResponse.json({
          success: true,
          redirectUrl: browserurl,
          pollUrl: pollurl,
          reference: reference,
        });
      } else {
        const error = params.get('error') || 'Payment initiation failed';
        console.error('❌ PayNow error:', error);
        return NextResponse.json({
          success: false,
          error: error,
          details: responseText
        });
      }
    } catch (parseError) {
      console.error('❌ Parse error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Could not parse PayNow response',
        raw: responseText
      });
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error: ' + error.message,
    }, { status: 500 });
  }
}
