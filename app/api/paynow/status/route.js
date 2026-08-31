import { NextResponse } from 'next/server';

const PAYNOW_STATUS_URL = 'https://www.paynow.co.zw/interface/checktransaction';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pollUrl } = body;

    if (!pollUrl) {
      return NextResponse.json(
        { error: 'pollUrl is required' },
        { status: 400 }
      );
    }

    // The pollUrl is the full URL to check status
    const response = await fetch(pollUrl);
    const responseText = await response.text();
    console.log('📥 Status response:', responseText);

    // Parse response
    if (responseText.startsWith('status=')) {
      const params = new URLSearchParams(responseText);
      const status = params.get('status');
      
      return NextResponse.json({
        success: true,
        status: status,
        paid: status === 'Paid',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unexpected response',
        raw: responseText
      });
    }

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
        }
