import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CONTIPAY_API_KEY || 'VjIzb21IK1o0VjZyRXdPUXZHNoYzZ09';
    const merchantId = process.env.CONTIPAY_MERCHANT_ID || '25439';
    const baseUrl = process.env.CONTIPAY_BASE_URL || 'https://api-uat.contipay.net';

    // Test with the actual credentials
    const testPayload = {
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/contipay/webhook`,
      description: 'VeriBuild - Auth Test',
      amount: 1.00,
      reference: 'AUTH-TEST',
      merchantId: parseInt(merchantId),
      currencyCode: 'USD',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      customers: {
        nationalId: '00 1234567 A 00',
        surname: 'Test',
        firstName: 'Auth',
        middleName: '',
        email: 'test@example.com',
        cell: '+2637000000000',
        countryCode: 'ZH'
      }
    };

    const response = await fetch(`${baseUrl}/acquire/payment`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'ok',
      config: {
        apiKey: `Set (length: ${apiKey.length})`,
        merchantId: merchantId,
        baseUrl: baseUrl,
        apiKeyPreview: apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5)
      },
      authTest: {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        data: data
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
