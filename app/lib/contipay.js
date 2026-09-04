/**
 * ContiPay Payment Integration Library
 * Version: 1.0.0
 * For VeriBuild - Zimbabwe Construction Platform
 */

const crypto = require('crypto');

// Configuration
const CONTIPAY_CONFIG = {
  apiKey: process.env.CONTIPAY_API_KEY,
  secretKey: process.env.CONTIPAY_SECRET_KEY,
  merchantId: process.env.CONTIPAY_MERCHANT_ID,
  baseUrl: process.env.CONTIPAY_BASE_URL || 'https://api.uat.contipay.net',
  version: 'v1'
};

/**
 * Initialize a payment transaction with ContiPay
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Amount in USD
 * @param {string} paymentData.currency - Currency (USD, ZWL, etc.)
 * @param {string} paymentData.customerEmail - Customer's email
 * @param {string} paymentData.customerFirstName - Customer's first name
 * @param {string} paymentData.customerLastName - Customer's last name
 * @param {string} paymentData.planType - Type of plan (hardware, construction, worker)
 * @param {string} paymentData.planName - Name of the plan
 * @param {string} paymentData.planDuration - Duration of the plan
 * @param {string} paymentData.userId - User ID in your system
 * @returns {Promise<Object>} Payment response with redirect URL
 */
export async function initiatePayment(paymentData) {
  try {
    // Validate required fields
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Missing required payment fields');
    }

    // Generate a unique transaction reference
    const transactionRef = generateTransactionRef();

    // Prepare payment payload for ContiPay
    const payload = {
      merchantId: CONTIPAY_CONFIG.merchantId,
      transactionReference: transactionRef,
      amount: parseFloat(paymentData.amount).toFixed(2),
      currency: paymentData.currency || 'USD',
      customerEmail: paymentData.customerEmail,
      customerFirstName: paymentData.customerFirstName || 'Customer',
      customerLastName: paymentData.customerLastName || 'User',
      customerPhone: paymentData.customerPhone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.vercel.app'}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.vercel.app'}/payment/cancel`,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://veribuild.vercel.app'}/api/contipay/webhook`,
      metadata: {
        planType: paymentData.planType,
        planName: paymentData.planName,
        planDuration: paymentData.planDuration,
        userId: paymentData.userId,
        source: 'veribuild'
      },
      // Optional: Add items for the invoice
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

    // Make the API call to ContiPay
    const response = await fetch(`${CONTIPAY_CONFIG.baseUrl}/${CONTIPAY_CONFIG.version}/payments/initiate`, {
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
      throw new Error(data.message || data.error || 'Payment initiation failed');
    }

    // Store payment record in database
    await storePaymentRecord({
      transactionId: data.transactionId || transactionRef,
      amount: payload.amount,
      currency: payload.currency,
      planType: paymentData.planType,
      planName: paymentData.planName,
      userId: paymentData.userId,
      customerEmail: paymentData.customerEmail,
      status: 'pending'
    });

    return {
      success: true,
      transactionId: data.transactionId || transactionRef,
      paymentUrl: data.paymentUrl || data.redirectUrl,
      redirect_url: data.paymentUrl || data.redirectUrl,
      status: data.status || 'pending'
    };

  } catch (error) {
    console.error('ContiPay Initiation Error:', error);
    throw error;
  }
}

/**
 * Verify a payment transaction with ContiPay
 * @param {string} transactionId - The transaction ID to verify
 * @returns {Promise<Object>} Payment verification response
 */
export async function verifyPayment(transactionId) {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    console.log('Verifying transaction:', transactionId);

    const response = await fetch(`${CONTIPAY_CONFIG.baseUrl}/${CONTIPAY_CONFIG.version}/payments/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONTIPAY_CONFIG.apiKey}`,
        'X-Merchant-ID': CONTIPAY_CONFIG.merchantId
      }
    });

    const data = await response.json();
    console.log('Verification Response:', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Payment verification failed');
    }

    // Update payment status in database
    await updatePaymentStatus(transactionId, data.status || 'completed');

    return {
      success: true,
      transactionId: transactionId,
      status: data.status || 'completed',
      amount: data.amount,
      currency: data.currency,
      customerEmail: data.customerEmail,
      paymentMethod: data.paymentMethod,
      verified: data.status === 'completed' || data.status === 'successful'
    };

  } catch (error) {
    console.error('ContiPay Verification Error:', error);
    throw error;
  }
}

/**
 * Handle ContiPay webhook
 * @param {Object} webhookData - The webhook payload from ContiPay
 * @param {string} signature - The webhook signature for verification
 * @returns {Promise<Object>} Webhook processing result
 */
export async function handleWebhook(webhookData, signature) {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(webhookData, signature)) {
      throw new Error('Invalid webhook signature');
    }

    console.log('Processing webhook:', webhookData);

    const { 
      transactionId, 
      status, 
      amount, 
      currency, 
      customerEmail,
      metadata,
      paymentMethod
    } = webhookData;

    // Validate required fields
    if (!transactionId || !status) {
      throw new Error('Missing required webhook fields');
    }

    // Process based on status
    if (status === 'completed' || status === 'successful') {
      // Update payment record
      await updatePaymentStatus(transactionId, 'completed', {
        paymentMethod: paymentMethod,
        amount: amount,
        currency: currency
      });

      // Activate subscription
      if (metadata) {
        await activateSubscription({
          userId: metadata.userId,
          planType: metadata.planType,
          planName: metadata.planName,
          transactionId: transactionId,
          amount: amount,
          currency: currency
        });
      }

      return {
        success: true,
        message: 'Payment completed and subscription activated',
        transactionId: transactionId,
        status: 'completed'
      };

    } else if (status === 'failed' || status === 'cancelled') {
      // Update payment record as failed
      await updatePaymentStatus(transactionId, 'failed');
      
      return {
        success: true,
        message: 'Payment failed or cancelled',
        transactionId: transactionId,
        status: 'failed'
      };
    }

    return {
      success: true,
      message: 'Webhook processed',
      transactionId: transactionId,
      status: status
    };

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    throw error;
  }
}

/**
 * Generate a unique transaction reference
 * @returns {string} Unique transaction reference
 */
function generateTransactionRef() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = 'VB';
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

/**
 * Verify webhook signature
 * @param {Object} payload - The webhook payload
 * @param {string} signature - The signature to verify
 * @returns {boolean} Whether the signature is valid
 */
export function verifyWebhookSignature(payload, signature) {
  try {
    // If ContiPay provides a specific signature method, implement it here
    // For now, we'll use a simple HMAC verification
    const expectedSignature = crypto
      .createHmac('sha256', CONTIPAY_CONFIG.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Store payment record in database
 * @param {Object} paymentData - Payment data to store
 * @returns {Promise<void>}
 */
async function storePaymentRecord(paymentData) {
  try {
    // This is a placeholder - implement your actual database storage
    // Using Supabase or your preferred database
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
      // Don't throw - we don't want to fail the payment if DB storage fails
      // But log it for monitoring
    }

  } catch (error) {
    console.error('Database storage error:', error);
    // Log but don't throw
  }
}

/**
 * Update payment status in database
 * @param {string} transactionId - The transaction ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<void>}
 */
async function updatePaymentStatus(transactionId, status, additionalData = {}) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData = {
      status: status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('transaction_id', transactionId);

    if (error) {
      console.error('Error updating payment status:', error);
    }

  } catch (error) {
    console.error('Database update error:', error);
  }
}

/**
 * Activate user subscription
 * @param {Object} subscriptionData - Subscription details
 * @returns {Promise<void>}
 */
async function activateSubscription(subscriptionData) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days subscription

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: subscriptionData.userId,
        plan_type: subscriptionData.planType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        transaction_id: subscriptionData.transactionId,
        auto_renew: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error activating subscription:', error);
    }

    // Update user profile with the new role
    const roleMap = {
      hardware: 'hardware_store',
      construction: 'construction_company',
      worker: 'skilled_worker'
    };

    const userRole = roleMap[subscriptionData.planType];
    if (userRole) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          user_type: userRole,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionData.userId);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      }
    }

  } catch (error) {
    console.error('Subscription activation error:', error);
  }
}

/**
 * Get payment status from ContiPay
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<Object>} Payment status
 */
export async function getPaymentStatus(transactionId) {
  try {
    const response = await fetch(`${CONTIPAY_CONFIG.baseUrl}/${CONTIPAY_CONFIG.version}/payments/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONTIPAY_CONFIG.apiKey}`,
        'X-Merchant-ID': CONTIPAY_CONFIG.merchantId
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment status');
    }

    return {
      success: true,
      transactionId: transactionId,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      customerEmail: data.customerEmail,
      paymentMethod: data.paymentMethod,
      timestamp: data.timestamp
    };

  } catch (error) {
    console.error('Get payment status error:', error);
    throw error;
  }
}

/**
 * Refund a payment
 * @param {string} transactionId - The transaction ID to refund
 * @param {number} amount - Amount to refund (optional, full refund if not specified)
 * @param {string} reason - Reason for refund
 * @returns {Promise<Object>} Refund response
 */
export async function refundPayment(transactionId, amount = null, reason = '') {
  try {
    const payload = {
      transactionId: transactionId,
      reason: reason || 'Customer requested refund'
    };

    if (amount) {
      payload.amount = parseFloat(amount).toFixed(2);
    }

    const response = await fetch(`${CONTIPAY_CONFIG.baseUrl}/${CONTIPAY_CONFIG.version}/payments/${transactionId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONTIPAY_CONFIG.apiKey}`,
        'X-Merchant-ID': CONTIPAY_CONFIG.merchantId
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Refund failed');
    }

    return {
      success: true,
      transactionId: transactionId,
      refundId: data.refundId,
      amount: data.amount,
      status: data.status
    };

  } catch (error) {
    console.error('Refund error:', error);
    throw error;
  }
}

// Export all functions
export default {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  verifyWebhookSignature,
  getPaymentStatus,
  refundPayment,
  generateTransactionRef
};
