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

export async function initiatePayment(paymentData) {
  console.log('=== PAYNOW INITIATE START ===');

  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    // Use the reference supplied by the caller if present, so the DB row
    // created by /api/paynow/create-payment and the Paynow transaction share
    // the same reference. Fall back to a generated one only if none given.
    const reference = paymentData.reference
      ? String(paymentData.reference).toUpperCase()
      : generateReference();
    console.log('Reference:', reference);

    const paynow = getPaynowInstance();
    const payment = paynow.createPayment(reference, paymentData.customerEmail);

    // Description shown to the user on Paynow
    payment.add(
      `${paymentData.planName} - ${paymentData.planDuration}`,
      parseFloat(paymentData.amount)
    );

    const response = await paynow.send(payment);

    console.log('Redirect URL:', response.redirectUrl);
    console.log('Poll URL:', response.pollUrl);

    if (!response.success) {
      throw new Error(response.error || 'Paynow rejected the payment');
    }

    // Store payment record (fallback path only)
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('transaction_reference', reference)
        .maybeSingle();

      if (existing) {
        // Row exists (created by /api/paynow/create-payment). Attach the poll
        // URL so verification can query Paynow later.
        await supabase
          .from('payments')
          .update({
            payment_proof_url: response.pollUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Fallback: caller did not pre-create the row. Insert one now, with
        // the same columns the create-payment route uses.
        await supabase.from('payments').insert({
          user_id: paymentData.userId || null,
          amount: parseFloat(paymentData.amount),
          currency: 'USD',
          payment_method: paymentData.planType,
          payment_status: 'pending',
          transaction_reference: reference,
          payment_proof_url: response.pollUrl,
          provider: 'paynow',
          project_id: paymentData.projectId ? parseInt(paymentData.projectId, 10) : null,
          payment_purpose: paymentData.paymentPurpose || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (dbError) {
      console.error('DB error (non-blocking):', dbError.message);
    }

    return {
      success: true,
      reference: reference,
      redirectUrl: response.redirectUrl,
      pollUrl: response.pollUrl,
    };

  } catch (error) {
    console.error('Paynow initiate error:', error.message);
    throw error;
  }
}

export async function checkPaymentStatus(pollUrl) {
  try {
    if (!pollUrl) throw new Error('Poll URL is required');

    const paynow = getPaynowInstance();
    const status = await paynow.pollTransaction(pollUrl);

    const statusValue = String(status.status || '').toLowerCase();
    const isPaid =
      statusValue === 'paid' ||
      statusValue === 'completed' ||
      statusValue === 'successful' ||
      status.paid === true ||
      status.paid === 'true';

    return {
      success: true,
      paid: isPaid,
      status: status.status || 'Unknown',
      reference: status.reference || null,
      pollUrl: pollUrl,
    };

  } catch (error) {
    console.error('Paynow status error:', error);
    throw error;
  }
}

export default {
  initiatePayment,
  checkPaymentStatus,
  generateReference,
};
