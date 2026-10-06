/**
 * Paynow Payment Integration
 * For VeriBuild - A Product of GateKeeperAI
 */

import { Paynow } from 'paynow';

const PAYNOW_CONFIG = {
  integrationId: process.env.PAYNOW_INTEGRATION_ID || '25439',
  integrationKey: process.env.PAYNOW_INTEGRATION_KEY || '6d2661a1-2d18-4b83-8ae5-37dd0860b461',
  resultUrl: process.env.PAYNOW_RESULT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/paynow/webhook`,
  returnUrl: process.env.PAYNOW_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
};

/**
 * Get a configured Paynow instance
 */
function getPaynowInstance() {
  const paynow = new Paynow(PAYNOW_CONFIG.integrationId, PAYNOW_CONFIG.integrationKey);
  paynow.resultUrl = PAYNOW_CONFIG.resultUrl;
  paynow.returnUrl = PAYNOW_CONFIG.returnUrl;
  return paynow;
}

/**
 * Generate a unique reference
 */
function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VB-${timestamp}-${random}`.toUpperCase();
}

/**
 * Initiate a web-based payment with Paynow
 */
export async function initiatePayment(paymentData) {
  console.log('=== PAYNOW INITIATE START ===');
  
  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    const reference = generateReference();
    console.log('Reference:', reference);

    const paynow = getPaynowInstance();

    // Create payment with unique reference and customer email
    const payment = paynow.createPayment(reference, paymentData.customerEmail);

    // Add the subscription item
    payment.add(
      `${paymentData.planName} - ${paymentData.planDuration} Subscription`,
      parseFloat(paymentData.amount)
    );

    console.log('Sending payment request to Paynow...');

    // Send payment to Paynow
    const response = await paynow.send(payment);

    console.log('Paynow response success:', response.success);
    console.log('Paynow response error:', response.error);
    console.log('Paynow redirectUrl:', response.redirectUrl);
    console.log('Paynow pollUrl:', response.pollUrl);

    if (!response.success) {
      throw new Error(response.error || 'Paynow rejected the payment request');
    }

 // Store payment record
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('payments').insert({
      user_id: paymentData.userId === 'test-user-123' ? null : paymentData.userId,
      amount: parseFloat(paymentData.amount),
      currency: 'USD',
      payment_method: paymentData.planType,
      payment_status: 'pending',
      transaction_reference: reference,
      payment_proof_url: response.pollUrl,
      provider: 'paynow',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Payment record stored in database');
  }
} catch (dbError) {
  console.error('DB storage error (non-blocking):', dbError.message);
      }   

/**
 * Check payment status with Paynow
 */
export async function checkPaymentStatus(pollUrl) {
  try {
    if (!pollUrl) throw new Error('Poll URL is required');

    const paynow = getPaynowInstance();
    const status = await paynow.pollTransaction(pollUrl);

    console.log('Paynow status check:', JSON.stringify(status));

    return {
      success: true,
      paid: status.paid || false,
      status: status.status || 'Unknown',
      reference: status.reference || null,
      paynowReference: status.paynowReference || null,
      amount: status.amount || null,
      pollUrl: pollUrl,
    };

  } catch (error) {
    console.error('Paynow Status Error:', error);
    throw error;
  }
}

/**
 * Verify webhook hash
 */
export function verifyWebhookHash(data) {
  try {
    const paynow = getPaynowInstance();
    return paynow.verifyHash(data) === true;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}

export default {
  initiatePayment,
  checkPaymentStatus,
  verifyWebhookHash,
  generateReference,
};
