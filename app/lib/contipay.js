/**
 * ContiPay Payment Integration Library - UAT Version
 * For VeriBuild - Zimbabwe Construction Platform
 */

// Configuration
const CONTIPAY_CONFIG = {
  apiKey: process.env.CONTIPAY_API_KEY,
  secretKey: process.env.CONTIPAY_SECRET_KEY,
  merchantId: process.env.CONTIPAY_MERCHANT_ID,
  baseUrl: process.env.CONTIPAY_BASE_URL || 'https://api.uat.contipay.net',
};

/**
 * Initialize a payment transaction with ContiPay
 */
export async function initiatePayment(paymentData) {
  try {
    // Validate required fields
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    // Generate a unique transaction reference
    const transactionRef = generateTransactionRef();

    // Prepare payment payload for ContiPay UAT
    const payload = {
      merchant_id: CONTIPAY_CONFIG.merchantId,
      transaction_reference: transactionRef,
      amount: parseFloat(paymentData.amount).toFixed(2),
      currency: paymentData.currency || 'USD',
      customer_email: paymentData.customerEmail,
      customer_first_name: paymentData.customerFirstName || 'Customer',
      customer_last_name: paymentData.customerLastName || 'User',
      customer_phone: paymentData.customerPhone || '',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.vercel.app'}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.vercel.app'}/payment/cancel`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.vercel.app'}/api/contipay/webhook`,
      metadata: {
        plan_type: paymentData.planType,
        plan_name: paymentData.planName,
        plan_duration: paymentData.planDuration,
        user_id: paymentData.userId,
        source: 'veribuild'
      },
      items: [
        {
          name: `${paymentData.planName} - ${paymentData.planDuration}`,
          description: `VeriBuild ${paymentData.planName} subscription plan`,
          quantity: 1,
          price: parseFloat(paymentData.amount).toFixed(2)
        }
      ]
    };

    console.log('ContiPay Payment Payload:', JSON.stringify(payload, null, 2));

    // Make the API call to ContiPay UAT
    const response = await fetch(`${CONTIPAY_CONFIG.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONTIPAY_CONFIG.apiKey}`,
        'X-Merchant-ID': CONTIPAY_CONFIG.merchantId
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('ContiPay Response:', data);

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid payment request. Please check the information provided.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please contact support.');
      } else if (response.status === 422) {
        throw new Error(data.message || 'Validation error. Please check your payment details.');
      } else {
        throw new Error(data.message || data.error || 'Payment initiation failed');
      }
    }

    // Store payment record in database (async, don't wait for it)
    storePaymentRecord({
      transactionId: data.transaction_id || transactionRef,
      amount: payload.amount,
      currency: payload.currency,
      planType: paymentData.planType,
      planName: paymentData.planName,
      userId: paymentData.userId,
      customerEmail: paymentData.customerEmail,
      status: 'pending'
    }).catch(err => console.error('Error storing payment record:', err));

    return {
      success: true,
      transactionId: data.transaction_id || transactionRef,
      paymentUrl: data.payment_url || data.redirect_url,
      redirect_url: data.payment_url || data.redirect_url,
      status: data.status || 'pending',
      reference: data.reference || transactionRef
    };

  } catch (error) {
    console.error('ContiPay Initiation Error:', error);
    throw error;
  }
}

/**
 * Generate a unique transaction reference
 */
function generateTransactionRef() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = 'VB';
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

/**
 * Store payment record in database (placeholder - implement your actual storage)
 */
async function storePaymentRecord(paymentData) {
  try {
    // Try to use Supabase if available
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error } = await supabase
        .from('payments')
        .insert({
          transaction_id: paymentData.transactionId,
          user_id: paymentData.userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          plan_type: paymentData.planType,
          plan_name: paymentData.planName,
          customer_email: paymentData.customerEmail,
          status: paymentData.status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing payment record:', error);
      } else {
        console.log('Payment record stored successfully');
      }
    }
  } catch (error) {
    console.error('Database storage error:', error);
  }
}

export default {
  initiatePayment
};
