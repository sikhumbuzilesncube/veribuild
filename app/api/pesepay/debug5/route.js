import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function GET() {
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c';
  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY || '74362486-c8e7-4bb1-8a9f-c042ff8e4497';

  const results = {};
  const url = 'https://api.test.sandbox.pesepay.com/payments-engine/v1/payments/initiate';

  // === THE EXACT PESEPAY EXAMPLE CODE ===
  const paymentBody = {
    amountDetails: {
      amount: 100,
      currencyCode: 'ZWL'    // ← Using ZWL exactly as in their example
    },
    reasonForPayment: 'Online payment for Camera',
    resultUrl: 'https://veribuild.gatekeeperai.co.zw/api/pesepay/webhook',
    returnUrl: 'https://veribuild.gatekeeperai.co.zw/payment/success'
  };

  try {
    // EXACTLY as PesePay docs show:
    const encryptedJson = CryptoJS.AES.encrypt(
      JSON.stringify(paymentBody),
      CryptoJS.enc.Utf8.parse(encryptionKey),
      {
        iv: CryptoJS.enc.Utf8.parse(encryptionKey.substring(0, 16))
      }
    ).toString();

    results.encryption = {
      preview: encryptedJson.substring(0, 40),
      length: encryptedJson.length,
      startsWithSalted: encryptedJson.startsWith('U2FsdGVkX1'),
      // Also test decrypting it back locally to prove it's valid
      localDecryptTest: (() => {
        try {
          const decrypted = CryptoJS.AES.decrypt(
            encryptedJson,
            CryptoJS.enc.Utf8.parse(encryptionKey),
            { iv: CryptoJS.enc.Utf8.parse(encryptionKey.substring(0, 16)) }
          ).toString(CryptoJS.enc.Utf8);
          return decrypted.substring(0, 50);
        } catch (e) {
          return 'LOCAL DECRYPT FAILED: ' + e.message;
        }
      })()
    };

    // Now send to PesePay
    console.log('Sending to PesePay:', encryptedJson.substring(0, 40));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encryptedJson })
    });

    const responseText = await response.text();
    
    results.pesePayResponse = {
      status: response.status,
      response: responseText.substring(0, 400)
    };

  } catch (error) {
    results.error = {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    };
  }

  return NextResponse.json(results);
      }
