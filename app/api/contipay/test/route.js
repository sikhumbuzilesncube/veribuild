import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const authKey = process.env.CONTIPAY_API_KEY || 'VjIzb2lIK1o0VjZyRXdPUXZHNHoyZz09';
    const authSecret = process.env.CONTIPAY_SECRET_KEY || '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';
    const merchantId = process.env.CONTIPAY_MERCHANT_ID || '952';
    const baseUrl = process.env.CONTIPAY_BASE_URL || 'https://api-uat.contipay.net';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.gatekeeperai.co.zw';

    // Build the correct auth header
    const credentials = `${authKey}:${authSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    const authHeader = `Basic ${encodedCredentials}`;

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/acquire/payment`;

    const payload = {
      webhookUrl: `${appUrl}/api/contipay/webhook`,
      description: 'VeriBuild - Auth Test',
      amount: 1.00,
      reference: 'AUTH-TEST-' + Date.now(),
      merchantId: parseInt(merchantId),
      currencyCode: 'USD',
      successUrl: `${appUrl}/payment/success`,
      cancelUrl: `${appUrl}/payment/cancel`,
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

    console.log('Testing URL:', url);
    console.log('Auth Header (first 30 chars):', authHeader.substring(0, 30) + '...');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'test',
      config: {
        merchantId: merchantId,
        baseUrl: cleanBaseUrl,
        fullUrl: url,
        appUrl: appUrl,
        authHeaderPreview: authHeader.substring(0, 30) + '...'
      },
      response: {
        status: response.status,
        success: response.ok,
        data: data
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
      }
