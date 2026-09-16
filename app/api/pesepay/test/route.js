import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function GET() {
  try {
    const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c';
    const integrationKey = process.env.PESEPAY_INTEGRATION_KEY || '74362486-c8e7-4bb1-8a9f-c042ff8e4497';
    const baseUrl = process.env.PESEPAY_BASE_URL || 'https://api.test.sandbox.pesepay.com';

    // Test payload
    const testBody = {
      amountDetails: {
        amount: 1,
        currencyCode: 'USD'
      },
      reasonForPayment: 'Test Payment',
      resultUrl: 'https://veribuild.gatekeeperai.co.zw/api/pesepay/webhook',
      returnUrl: 'https://veribuild.gatekeeperai.co.zw/payment/success'
    };

    // Method 1: Current approach - UTF8 parse full key
    const key1 = CryptoJS.enc.Utf8.parse(encryptionKey);
    const iv1 = CryptoJS.enc.Utf8.parse(encryptionKey.substring(0, 16));
    const encrypted1 = CryptoJS.AES.encrypt(
      JSON.stringify(testBody),
      key1,
      { iv: iv1 }
    ).toString();

    // Send to PesePay
    const url = `${baseUrl}/payments-engine/v1/payments/initiate`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encrypted1 })
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    return NextResponse.json({
      status: 'debug',
      config: {
        encryptionKeyLength: encryptionKey.length,
        encryptionKeyFirst16: encryptionKey.substring(0, 16),
        integrationKeyLength: integrationKey.length,
        baseUrl: baseUrl
      },
      request: {
        url: url,
        testBody: testBody,
        encryptedPayloadPreview: encrypted1.substring(0, 50) + '...'
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: responseData
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
