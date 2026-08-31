import { NextResponse } from 'next/server';

const PAYNOW_ID = '25439';
const PAYNOW_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';
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

    // Poll URL already contains the full URL to check status
    const response = await fetch(pollUrl);
    const responseText = await response.text();
    console.log('📥 Status response:', responseText);

    // Parse response (format: "status=Paid&reference=...")
    const params = new URLSearchParams(responseText);
    const status = params.get('status');

    return NextResponse.json({
      success: true,
      status: status || 'pending',
      paid: status === 'Paid',
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
      }
