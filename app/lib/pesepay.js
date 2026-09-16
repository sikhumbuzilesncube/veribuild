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

/**
 * Encrypt a payload using AES-256-CBC
 */
function encryptPayload(data) {
  const key = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey);
  const iv = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey.substring(0, 16));
  
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    key,
    { iv: iv }
  ).toString();
  
  return encrypted;
}

/**
 * Decrypt a payload using AES-256-CBC
 */
function decryptPayload(encryptedString) {
  const key = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey);
  const iv = CryptoJS.enc.Utf8.parse(PESEPAY_CONFIG.encryptionKey.substring(0, 16));
  
  const decryptedBytes = CryptoJS.AES.decrypt(
    encryptedString,
    key,
    { iv: iv }
  );
  
  const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
  
  if (!decryptedString) {
    throw new Error('Decryption failed - empty result');
  }
  
  return JSON.parse(decryptedString);
}

/**
 * Generate a unique reference number
 */
function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VB-${timestamp}-${random}`.toUpperCase();
}

/**
 * Initiate a payment with PesePay
 */
export async function initiatePayment(paymentData) {
  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    const reference = generateReference();
    const cleanBaseUrl = PESEPAY_CONFIG.baseUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/payments-engine/v1/payments/initiate`;

    // Build the payment body (plain text, will be encrypted)
    const paymentBody = {
      amountDetails: {
        amount: parseFloat(paymentData.amount),
        currencyCode: paymentData.currency || 'USD'
      },
      reasonForPayment: `VeriBuild - ${paymentData.planName} Subscription - #${reference}`,
      resultUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pesepay/webhook`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?reference=${reference}`
    };

    console.log('PesePay Payment Body (plain):', JSON.stringify(paymentBody, null, 2));

    // Encrypt the payload
    const encryptedPayload = encryptPayload(paymentBody);
    const finalPayload = { payload: encryptedPayload };

    console.log('PesePay URL:', url);

    // Send request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': PESEPAY_CONFIG.integrationKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalPayload)
    });

    const data = await response.json();
    console.log('PesePay Response (encrypted):', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Payment initiation failed (${response.status})`);
    }

    // Decrypt the response
    const transaction = decryptPayload(data.payload);
    console.log('PesePay Response (decrypted):', JSON.stringify(transaction, null, 2));

    // Store payment record
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
    console.error('PesePay Error:', error);
    throw error;
  }
}

/**
 * Check payment status with PesePay
 */
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
    console.log('PesePay Status Response (encrypted):', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Status check failed (${response.status})`);
    }

    // Decrypt the response
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

/**
 * Store payment record in Supabase
 */
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
