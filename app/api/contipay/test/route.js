import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if ContiPay credentials are configured
    const apiKey = process.env.CONTIPAY_API_KEY;
    const secretKey = process.env.CONTIPAY_SECRET_KEY;
    const merchantId = process.env.CONTIPAY_MERCHANT_ID;
    const baseUrl = process.env.CONTIPAY_BASE_URL;

    return NextResponse.json({
      status: 'ok',
      config: {
        apiKey: apiKey ? 'Set' : 'Not Set',
        secretKey: secretKey ? 'Set' : 'Not Set',
        merchantId: merchantId || 'Not Set',
        baseUrl: baseUrl || 'Not Set'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}
