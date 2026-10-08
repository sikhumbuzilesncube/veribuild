/**
 * Paynow Payment Integration
 * For VeriBuild - A Product of GateKeeperAI
 */

let Paynow;
try {
  Paynow = require('paynow').Paynow;
} catch (e) {
  const paynowModule = require('paynow');
  Paynow = paynowModule.Paynow || paynowModule.default?.Paynow || paynowModule;
}

const PAYNOW_CONFIG = {
  integrationId: process.env.PAYNOW_INTEGRATION_ID || '25439',
  integrationKey: process.env.PAYNOW_INTEGRATION_KEY || '6d2661a1-2d18-4b83-8ae5-37dd0860b461',
  resultUrl: process.env.PAYNOW_RESULT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/paynow/webhook`,
  returnUrl: process.env.PAYNOW_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
};

function getPaynowInstance() {
  const paynow = new Paynow(PAYNOW_CONFIG.integrationId, PAYNOW_CONFIG.integrationKey);
  paynow.resultUrl = PAYNOW_CONFIG.resultUrl;
  paynow.returnUrl = PAYNOW_CONFIG.returnUrl;
  return paynow;
}

function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VB-${timestamp}-${random}`.toUpperCase();
}

/**
 * Initiate a payment with Paynow
 * Supports both web redirect and mobile push
 */
export async function initiatePayment(paymentData) {
  console.log('=== PAYNOW INITIATE START ===');

  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    const reference = generateReference();
    console.log('Reference:', reference);
    console.log('Method:', paymentData.paymentMethod);

    const paynow = getPaynowInstance();
    const payment = paynow.createPayment(reference, paymentData.customerEmail);

    payment.add(
      `${paymentData.planName} - ${paymentData.planDuration} Subscription`,
      parseFloat(paymentData.amount)
    );

    let response;
    let isMobile = false;

    // Mobile methods: EcoCash, OneMoney, InnBucks
    const mobileMethods = ['ecocash', 'onemoney', 'innbucks', 'telecash'];
    const method = (paymentData.paymentMethod || '').toLowerCase();

    if (mobileMethods.includes(method)) {
      if (!paymentData.customerPhone) {
        throw new Error('Phone number is required for mobile payments');
      }
      console.log('Using sendMobile for', method, 'phone:', paymentData.customerPhone);
      response = await paynow.sendMobile(payment, paymentData.customerPhone, method);
      isMobile = true;
    } else {
      console.log('Using web redirect (send)');
      response = await paynow.send(payment);
      isMobile = false;
    }

    console.log('Paynow response success:', response.success);
    console.log('Paynow response error:', response.error);

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
          user_id: paymentData.userId || null,
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

    console.log('=== PAYNOW INITIATE SUCCESS ===');

    return {
      success: true,
      reference: reference,
      redirectUrl: response.redirectUrl,
      pollUrl: response.pollUrl,
      instructions: response.instructions,
      isMobile: isMobile,
    };

  } catch (error) {
    console.error('=== PAYNOW INITIATE ERROR ===');
    console.error('Error:', error.message);
    throw error;
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(pollUrl) {
  try {
    if (!pollUrl) throw new Error('Poll URL is required');

    const paynow = getPaynowInstance();
    const status = await paynow.pollTransaction(pollUrl);

    console.log('Paynow status:', JSON.stringify(status));

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

export default {
  initiatePayment,
  checkPaymentStatus,
  generateReference,
};
