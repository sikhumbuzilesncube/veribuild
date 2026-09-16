/**
 * PesePay Payment Integration
 * For VeriBuild - A Product of GateKeeperAI
 */

import CryptoJS from 'crypto-js';

const PESEPAY_CONFIG = {
  baseUrl: process.env.PESEPAY_BASE_URL || 'https://api.test.sandbox.pesepay.com',
  integrationKey: process.env.PESEPAY_INTEGRATION_KEY || '74362486-c8e7-4bb1-8a9f-c042ff8e4497',
  encryptionKey: process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c',
};

function encryptPayload(data) {
  const key = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey);
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    key
  ).toString();
  return encrypted;
}

function decryptPayload(encryptedString) {
  if (!encryptedString) {
    throw new Error('No encrypted string provided for decryption');
  }
  
  const key = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey);
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedString, key);
  const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
  
  if (!decryptedString) {
    throw new Error('Decryption failed - empty result. Check encryption key.');
  }
  
  try {
    return JSON.parse(decryptedString);
  } catch (e) {
    throw new Error('Decryption returned invalid JSON: ' + decryptedString.substring(0, 100));
  }
}

function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VB-${timestamp}-${random}`.toUpperCase();
}

export async function initiatePayment(paymentData) {
  try {
    console.log('=== PESEPAY INITIATE START ===');
    console.log('Payment data received:', JSON.stringify(paymentData, null, 2));
    
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

    console.log('Payment body (plain):', JSON.stringify(paymentBody, null, 2));

    const encryptedPayload = encryptPayload(paymentBody);
    console.log('Encrypted payload preview:', encryptedPayload.substring(0, 50) + '...');
    console.log('Encrypted payload length:', encryptedPayload.length);

    const finalPayload = { payload: encryptedPayload };

    console.log('Sending request to:', url);
    console.log('Integration key preview:', PESEPAY_CONFIG.integrationKey.substring(0, 15) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': PESEPAY_CONFIG.integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalPayload)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const responseText = await response.text();
    console.log('Raw response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from PesePay: ' + responseText.substring(0, 200));
    }

    console.log('Parsed response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || data.error || `Payment initiation failed (${response.status})`);
    }

    // Check if payload exists in response
    if (!data.payload) {
      console.error('No payload field in response!');
      console.error('Response data:', data);
      throw new Error('PesePay response missing payload. Response: ' + JSON.stringify(data));
    }

    console.log('Response has payload, decrypting...');

    const transaction = decryptPayload(data.payload);
    console.log('Decrypted transaction:', JSON.stringify(transaction, null, 2));

    // Store payment record
    try {
      await storePaymentRecord({
        transactionId: transaction.referenceNumber,
        reference: reference,
        amount: paymentBody.amountDetails.amount,
        currency: paymentBody.amountDetails.currencyCode,
        planType: paymentData.planType,
        planName: paymentData.planName,
        userId: paymentData.userId,
        customerEmail: paymentData.customerEmail,
        status: 'pending',
        pollUrl: transaction.pollUrl
      });
    } catch (dbError) {
      console.error('Database storage error (non-blocking):', dbError);
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
    console.error('Stack:', error.stack);
    throw error;
  }
}

export async function checkPaymentStatus(referenceNumber) {
  try {
    if (!referenceNumber) {
      throw new Error('Reference number is required');
    }

    const cleanBaseUrl = PESEPAY_CONFIG.baseUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/payments-engine/v1/payments/check-payment?referenceNumber=${encodeURIComponent(referenceNumber)}`;

    console.log('Checking payment status:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'authorization': PESEPAY_CONFIG.integrationKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('PesePay Status Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || data.error || `Status check failed (${response.status})`);
    }

    if (!data.payload) {
      throw new Error('PesePay status response missing payload');
    }

    const transaction = decryptPayload(data.payload);
    console.log('PesePay Status (decrypted):', JSON.stringify(transaction, null, 2));

    return {
      success: true,
      referenceNumber: transaction.referenceNumber,
      status: transaction.transactionStatus,
      statusCode: transaction.transactionStatusCode,
      statusDescription: transaction.transactionStatusDescription,
      amountDetails: transaction.amountDetails,
      dateOfTransaction: transaction.dateOfTransaction
    };

  } catch (error) {
    console.error('PesePay Status Error:', error);
    throw error;
  }
}

async function storePaymentRecord(paymentData) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error } = await supabase
        .from('payments')
        .insert({
          transaction_id: paymentData.transactionId,
          reference: paymentData.reference,
          user_id: paymentData.userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          plan_type: paymentData.planType,
          plan_name: paymentData.planName,
          customer_email: paymentData.customerEmail,
          status: paymentData.status || 'pending',
          poll_url: paymentData.pollUrl,
          payment_gateway: 'pesepay',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing payment record:', error);
      } else {
        console.log('Payment record stored in database');
      }
    }
  } catch (error) {
    console.error('Database storage error:', error);
  }
}

export default {
  initiatePayment,
  checkPaymentStatus,
  generateReference
};
