import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get ALL environment variables
    const apiKey = process.env.CONTIPAY_API_KEY;
    const secretKey = process.env.CONTIPAY_SECRET_KEY;
    const merchantId = process.env.CONTIPAY_MERCHANT_ID;
    const baseUrl = process.env.CONTIPAY_BASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Check what's actually set
    const envStatus = {
      CONTIPAY_API_KEY: apiKey ? `Set (length: ${apiKey.length})` : 'NOT SET',
      CONTIPAY_SECRET_KEY: secretKey ? `Set (length: ${secretKey.length})` : 'NOT SET',
      CONTIPAY_MERCHANT_ID: merchantId || 'NOT SET',
      CONTIPAY_BASE_URL: baseUrl || 'NOT SET',
      NEXT_PUBLIC_APP_URL: appUrl || 'NOT SET',
    };

    // Use the correct API key
    const correctApiKey = apiKey || 'VjIzb2lIK1o0VjZyRXdPUXZHNHoyZz09';
    const correctMerchantId = merchantId || '952';
    const correctBaseUrl = baseUrl || 'https://api-uat.contipay.net';
    const correctAppUrl = appUrl || 'https://veribuild.gatekeeperai.co.zw';

    const payload = {
      webhookUrl: `${correctAppUrl}/api/contipay/webhook`,
      description: 'VeriBuild - Auth Test',
      amount: 1.00,
      reference: 'AUTH-TEST-' + Date.now(),
      merchantId: parseInt(correctMerchantId),
      currencyCode: 'USD',
      successUrl: `${correctAppUrl}/payment/success`,
      cancelUrl: `${correctAppUrl}/payment/cancel`,
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

    // Try with the correct API key
    const response = await fetch(`${correctBaseUrl}/acquire/payment`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${correctApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'debug',
      environment: envStatus,
      used: {
        apiKeyPreview: correctApiKey.substring(0, 10) + '...' + correctApiKey.substring(correctApiKey.length - 5),
        merchantId: correctMerchantId,
        baseUrl: correctBaseUrl,
        appUrl: correctAppUrl,
      },
      request: {
        payload: payload
      },
      response: {
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
