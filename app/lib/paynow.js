/**
 * Paynow Payment Integration
 * For VeriBuild - A Product of GateKeeperAI
 * Using SDK integration (ID: 25438) with full webhook support
 */

let Paynow;
try {
  Paynow = require('paynow').Paynow;
} catch (e) {
  const paynowModule = require('paynow');
  Paynow = paynowModule.Paynow || paynowModule.default?.Paynow || paynowModule;
}

const PAYNOW_CONFIG = {
  integrationId: process.env.PAYNOW_SDK_INTEGRATION_ID || '25438',
  integrationKey: process.env.PAYNOW_SDK_INTEGRATION_KEY || process.env.PAYNOW_INTEGRATION_KEY || '',
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
 * Initiate a payment with Paynow via SDK
 */
export async function initiatePayment(paymentData) {
  console.log('=== PAYNOW INITIATE START ===');

  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    const reference = generateReference();
    console.log('Reference:', reference);
    console.log('Integration ID:', PAYNOW_CONFIG.integrationId);

    const paynow = getPaynowInstance();
    const payment = paynow.createPayment(reference, paymentData.customerEmail);

    payment.add(
      `${paymentData.planName} - ${paymentData.planDuration} Subscription`,
      parseFloat(paymentData.amount)
    );

    let response;
    let isMobile = false;

    const mobileMethods = ['ecocash', 'onemoney'];
    const method = (paymentData.paymentMethod || '').toLowerCase();

    if (mobileMethods.includes(method) && paymentData.customerPhone) {
      console.log('Attempting sendMobile for', method);

      try {
        response = await paynow.sendMobile(payment, paymentData.customerPhone, method);

        if (response.success) {
          isMobile = true;
          console.log('sendMobile SUCCESS');
        } else {
          console.log('sendMobile FAILED:', response.error);
          console.log('Falling back to redirect flow...');
          const fallbackPayment = paynow.createPayment(reference, paymentData.customerEmail);
          fallbackPayment.add(
            `${paymentData.planName} - ${paymentData.planDuration} Subscription`,
            parseFloat(paymentData.amount)
          );
          response = await paynow.send(fallbackPayment);
          isMobile = false;
        }
      } catch (mobileError) {
        console.error('sendMobile threw error:', mobileError.message);
        console.log('Falling back to redirect flow...');
        const fallbackPayment = paynow.createPayment(reference, paymentData.customerEmail);
        fallbackPayment.add(
          `${paymentData.planName} - ${paymentData.planDuration} Subscription`,
          parseFloat(paymentData.amount)
        );
        response = await paynow.send(fallbackPayment);
        isMobile = false;
      }
    } else {
      console.log('Using web redirect (send)');
      response = await paynow.send(payment);
      isMobile = false;
    }

    console.log('Final response success:', response.success);
    console.log('Redirect URL:', response.redirectUrl);
    console.log('Poll URL:', response.pollUrl);
    console.log('isMobile:', isMobile);

    if (!response.success) {
      throw new Error(response.error || 'Paynow rejected the payment request');
    }

    // Store payment record in DB via service role
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: existing } = await supabase
          .from('payments')
          .select('id')
          .eq('transaction_reference', reference)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('payments')
            .update({
              payment_proof_url: response.pollUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          console.log('Updated existing payment record with poll URL');
        } else {
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
          console.log('Created new payment record');
        }
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
 * Check payment status using poll URL
 * FIXED: Paynow SDK returns 'status' field (string), NOT 'paid' (boolean)
 */
export async function checkPaymentStatus(pollUrl) {
  try {
    if (!pollUrl) throw new Error('Poll URL is required');

    const paynow = getPaynowInstance();
    const status = await paynow.pollTransaction(pollUrl);

    console.log('Paynow status raw:', JSON.stringify(status));

    // Normalize the paid flag — SDK returns 'status' as string
    const statusValue = String(status.status || '').toLowerCase();
    const isPaid = 
      statusValue === 'paid' ||
      statusValue === 'completed' ||
      statusValue === 'successful' ||
      status.paid === true ||
      status.paid === 'true';

    console.log('Normalized paid:', isPaid, '(raw status:', statusValue, ')');

    return {
      success: true,
      paid: isPaid,
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
