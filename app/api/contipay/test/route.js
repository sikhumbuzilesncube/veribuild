import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CONTIPAY_API_KEY || 'VjIzb21IK1o0VjZyRxDpUXZNH0yZz09';
    const merchantId = process.env.CONTIPAY_MERCHANT_ID || '25439';
    const baseUrl = process.env.CONTIPAY_BASE_URL || 'https://api-uat.contipay.net';
    const secretKey = process.env.CONTIPAY_SECRET_KEY || '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';

    // Try to decode the API key
    let decodedKey = '';
    try {
      decodedKey = Buffer.from(apiKey, 'base64').toString('utf-8');
    } catch (e) {
      decodedKey = 'Failed to decode';
    }

    // Test different auth formats
    const authFormats = [
      { name: 'Format 1: Basic + API Key', auth: `Basic ${apiKey}` },
      { name: 'Format 2: API Key only', auth: apiKey },
      { name: 'Format 3: Basic + decoded key', auth: `Basic ${decodedKey}` },
      { name: 'Format 4: Basic + (API Key: secret)', auth: `Basic ${Buffer.from(apiKey + ':' + secretKey).toString('base64')}` },
    ];

    const results = [];

    for (const format of authFormats) {
      try {
        const response = await fetch(`${baseUrl}/acquire/payment`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': format.auth
          },
          body: JSON.stringify({
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
          })
        });

        const data = await response.json();
        results.push({
          format: format.name,
          status: response.status,
          success: response.ok,
          data: data
        });
      } catch (error) {
        results.push({
          format: format.name,
          status: 'Error',
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      status: 'debug',
      config: {
        apiKey: `Set (length: ${apiKey.length})`,
        apiKeyPreview: apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5),
        decodedApiKey: decodedKey,
        merchantId: merchantId,
        baseUrl: baseUrl
      },
      results: results
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
            }
