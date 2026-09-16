/**
 * PesePay Payment Integration
 * For VeriBuild - A Product of GateKeeperAI
 * 
 * IMPORTANT: PesePay expects OpenSSL-compatible salted encryption.
 * Do NOT use CryptoJS.enc.Utf8.parse() — pass the key as a plain string.
 */

import CryptoJS from 'crypto-js';

const PESEPAY_CONFIG = {
  baseUrl: process.env.PESEPAY_BASE_URL || 'https://api.test.sandbox.pesepay.com',
  integrationKey: process.env.PESEPAY_INTEGRATION_KEY || '74362486-c8e7-4bb1-8a9f-c042ff8e4497',
  encryptionKey: process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c',
};

/**
 * Encrypt a payload using CryptoJS OpenSSL salted format
 * Pass the key as a PLAIN STRING — this is critical!
 */
function encryptPayload(data) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    PESEPAY_CONFIG.encryptionKey  // ← Plain string, NOT Utf8.parse()
  ).toString();
  return encrypted;
}

/**
 * Decrypt a payload using CryptoJS OpenSSL salted format
 */
function decryptPayload(encryptedString) {
  if (!encryptedString) throw new Error('No payload to decrypt');
  
  const decryptedBytes = CryptoJS.AES.decrypt(
    encryptedString,
    PESEPAY_CONFIG.encryptionKey  // ← Plain string
  );
  
  const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
  
  if (!decryptedString) {
    throw new Error('Decryption failed - empty result');
  }
  
  return JSON.parse(decryptedString);
}

function generateReference() {
  return `VB-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
}

export async function initiatePayment(paymentData) {
  console.log('=== PESEPAY INITIATE START ===');
  
  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

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

    console.log('Payment body:', JSON.stringify(paymentBody));

    const encryptedPayload = encryptPayload(paymentBody);
    console.log('Encrypted preview:', encryptedPayload.substring(0, 40));
    console.log('Starts with salted:', encryptedPayload.startsWith('U2FsdGVkX1'));

    console.log('Calling PesePay at:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': PESEPAY_CONFIG.integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload: encryptedPayload })
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON from PesePay: ' + responseText.substring(0, 200));
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    if (!data.payload) {
      throw new Error('No payload in response: ' + JSON.stringify(data));
    }

    console.log('Decrypting response...');
    const transaction = decryptPayload(data.payload);
    console.log('Decrypted transaction:', JSON.stringify(transaction));

    // Store record
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from('payments').insert({
          transaction_id: transaction.referenceNumber,
          reference: reference,
          user_id: paymentData.userId,
          amount: paymentBody.amountDetails.amount,
          currency: paymentBody.amountDetails.currencyCode,
          plan_type: paymentData.planType,
          plan_name: paymentData.planName,
          customer_email: paymentData.customerEmail,
          status: 'pending',
          poll_url: transaction.pollUrl,
          payment_gateway: 'pesepay',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.error('DB storage error (non-blocking):', dbError.message);
    }

    console.log('=== PESEPAY INITIATE SUCCESS ===');

    return {
      success: true,
      transactionId: transaction.referenceNumber,
      reference: reference,
      redirectUrl: transaction.redirectUrl,
      pollUrl: transaction.pollUrl,
      status: transaction.transactionStatus,
      statusCode: transaction.transactionStatusCode
    };

  } catch (error) {
    console.error('=== PESEPAY INITIATE ERROR ===');
    console.error('Error:', error.message);
    throw error;
  }
}

export async function checkPaymentStatus(referenceNumber) {
  try {
    if (!referenceNumber) throw new Error('Reference number required');

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

export default {
  initiatePayment,
  checkPaymentStatus,
  generateReference
};
