/**
 * PesePay Payment Integration - DEBUG VERSION
 */

import CryptoJS from 'crypto-js';

const PESEPAY_CONFIG = {
  baseUrl: process.env.PESEPAY_BASE_URL || 'https://api.test.sandbox.pesepay.com',
  integrationKey: process.env.PESEPAY_INTEGRATION_KEY || '74362486-c8e7-4bb1-8a9f-c042ff8e4497',
  encryptionKey: process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c',
};

function encryptPayload(data) {
  const key = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey);
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

function decryptPayload(encryptedString) {
  if (!encryptedString) throw new Error('No payload to decrypt');
  const key = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey);
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedString, key);
  const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
  if (!decryptedString) throw new Error('Empty decryption result');
  return JSON.parse(decryptedString);
}

function generateReference() {
  return `VB-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
}

export async function initiatePayment(paymentData) {
  const debug = { steps: [] };

  try {
    debug.steps.push({ step: 'start', data: paymentData });

    const reference = generateReference();
    const cleanBaseUrl = PESEPAY_CONFIG.baseUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/payments-engine/v1/payments/initiate`;

    const paymentBody = {
      amountDetails: {
        amount: parseFloat(paymentData.amount),
        currencyCode: paymentData.currency || 'USD'
      },
      reasonForPayment: `VeriBuild - ${paymentData.planName} Subscription - #${reference}`,
      resultUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pesepay/webhook`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?reference=${reference}`
    };

    debug.steps.push({ step: 'paymentBody', data: paymentBody });

    const encryptedPayload = encryptPayload(paymentBody);
    debug.steps.push({ 
      step: 'encrypted', 
      preview: encryptedPayload.substring(0, 50),
      length: encryptedPayload.length
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': PESEPAY_CONFIG.integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encryptedPayload })
    });

    debug.steps.push({ 
      step: 'response', 
      status: response.status, 
      statusText: response.statusText 
    });

    const responseText = await response.text();
    debug.steps.push({ 
      step: 'responseText', 
      preview: responseText.substring(0, 500),
      length: responseText.length
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON from PesePay: ' + responseText.substring(0, 200));
    }

    debug.steps.push({ step: 'parsedData', data: data });

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    if (!data.payload) {
      debug.steps.push({ step: 'no-payload', data: data });
      throw new Error('No payload in response. Full response: ' + JSON.stringify(data));
    }

    // Try to decrypt
    let transaction;
    try {
      transaction = decryptPayload(data.payload);
      debug.steps.push({ step: 'decrypted', data: transaction });
    } catch (decryptError) {
      debug.steps.push({ 
        step: 'decrypt-failed', 
        error: decryptError.message,
        payloadPreview: data.payload.substring(0, 100)
      });
      // Return debug info instead of throwing
      return {
        success: false,
        debug: true,
        message: 'Decryption failed: ' + decryptError.message,
        debugInfo: debug
      };
    }

    return {
      success: true,
      transactionId: transaction.referenceNumber,
      reference: reference,
      redirectUrl: transaction.redirectUrl,
      pollUrl: transaction.pollUrl,
      status: transaction.transactionStatus,
      debugInfo: debug
    };

  } catch (error) {
    debug.steps.push({ step: 'error', message: error.message });
    return {
      success: false,
      debug: true,
      message: error.message,
      debugInfo: debug
    };
  }
}

export async function checkPaymentStatus(referenceNumber) {
  try {
    const cleanBaseUrl = PESEPAY_CONFIG.baseUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/payments-engine/v1/payments/check-payment?referenceNumber=${encodeURIComponent(referenceNumber)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'authorization': PESEPAY_CONFIG.integrationKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok || !data.payload) {
      throw new Error(data.message || 'Status check failed');
    }

    return decryptPayload(data.payload);

  } catch (error) {
    console.error('PesePay Status Error:', error);
    throw error;
  }
}

async function storePaymentRecord(paymentData) {
  // Skip for now during debugging
  console.log('Would store payment record:', paymentData);
}

export default {
  initiatePayment,
  checkPaymentStatus,
  generateReference
};
