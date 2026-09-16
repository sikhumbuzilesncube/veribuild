import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function GET() {
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c';
  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY || '74362486-c8e7-4bb1-8a9f-c042ff8e4497';

  const results = {};
  const url = 'https://api.test.sandbox.pesepay.com/payments-engine/v1/payments/initiate';

  const paymentBody = {
    amountDetails: {
      amount: 1,
      currencyCode: 'USD'
    },
    reasonForPayment: 'Test',
    resultUrl: 'https://veribuild.gatekeeperai.co.zw/api/pesepay/webhook',
    returnUrl: 'https://veribuild.gatekeeperai.co.zw/payment/success'
  };

  // === FORMAT 1: Raw ciphertext (Utf8.parse + custom IV) ===
  // This is what PesePay's CODE example does
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(paymentBody),
      CryptoJS.enc.Utf8.parse(encryptionKey),
      { iv: CryptoJS.enc.Utf8.parse(encryptionKey.substring(0, 16)) }
    ).toString();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encrypted })
    });

    const text = await response.text();

    results.format1_raw_ciphertext = {
      preview: encrypted.substring(0, 40),
      startsWithSalted: encrypted.startsWith('U2FsdGVkX1'),
      length: encrypted.length,
      status: response.status,
      response: text.substring(0, 300)
    };
  } catch (e) {
    results.format1_raw_ciphertext = { error: e.message };
  }

  // === FORMAT 2: Salted format (plain string, no IV) ===
  // This is what PesePay's EXAMPLE PAYLOAD shows
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(paymentBody),
      encryptionKey
    ).toString();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encrypted })
    });

    const text = await response.text();

    results.format2_salted = {
      preview: encrypted.substring(0, 40),
      startsWithSalted: encrypted.startsWith('U2FsdGVkX1'),
      length: encrypted.length,
      status: response.status,
      response: text.substring(0, 300)
    };
  } catch (e) {
    results.format2_salted = { error: e.message };
  }

  // === FORMAT 3: ZWL currency with salted ===
  try {
    const bodyZWL = {
      ...paymentBody,
      amountDetails: { amount: 100, currencyCode: 'ZWL' }
    };
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(bodyZWL),
      encryptionKey
    ).toString();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encrypted })
    });

    const text = await response.text();

    results.format3_zwl_salted = {
      preview: encrypted.substring(0, 40),
      status: response.status,
      response: text.substring(0, 300)
    };
  } catch (e) {
    results.format3_zwl_salted = { error: e.message };
  }

  return NextResponse.json(results);
    }
