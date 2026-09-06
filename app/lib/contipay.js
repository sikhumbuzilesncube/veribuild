// ============================================================
// CONTIPAY INTEGRATION - Zimbabwe Payment Gateway
// Based on official ContiPay examples
// ============================================================

const CONTIPAY_API_KEY = 'VjIzb2lIK1o0VjZyRXdPUXZHNHoyZz09';
const CONTIPAY_SECRET_KEY = '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';
const CONTIPAY_MERCHANT_ID = 952;
const CONTIPAY_BASE_URL = 'https://api-uat.contipay.net';
const CONTIPAY_WEBHOOK_TOKEN = 'veribuild_webhook_2026';

/**
 * Generate authorization header with timestamp
 */
function generateAuth() {
  const timestamp = Math.floor(Date.now() / 1000);
  const authString = `${CONTIPAY_API_KEY}${CONTIPAY_SECRET_KEY}${timestamp}`;
  const authorization = Buffer.from(authString).toString('base64');
  return { timestamp, authorization };
}

/**
 * Initiate payment with ContiPay (Redirect method)
 */
export async function initiateContiPayPayment(orderData) {
  const {
    amount,
    email,
    phone,
    description,
    reference,
    firstName,
    lastName,
    currencyCode = 'USD',
    successUrl = 'https://veribuild.vercel.app/payment/success',
    cancelUrl = 'https://veribuild.vercel.app/dashboard',
    webhookUrl = 'https://veribuild.vercel.app/api/contipay/webhook',
  } = orderData;

  const { timestamp, authorization } = generateAuth();

  // Build the request payload
  const payload = {
    timestamp: timestamp,
    returnUrl: webhookUrl,
    request: {
      center: "1",
      amount: parseFloat(amount),
      type: "charge",
      reference: reference || `VERI-${Date.now()}`,
      description: description || 'VeriBuild Payment',
      currency: currencyCode,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    }
  };

  // Add customer details to request
  if (email || phone || firstName || lastName) {
    payload.request.customer = {};
    if (email) payload.request.customer.email = email;
    if (phone) payload.request.customer.cell = phone;
    if (firstName) payload.request.customer.firstName = firstName;
    if (lastName) payload.request.customer.surname = lastName;
  }

  console.log('📤 ContiPay payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${CONTIPAY_BASE_URL}/request/payment/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📥 ContiPay response:', JSON.stringify(result, null, 2));

    // Check if payment was initiated successfully (code: 0 = success)
    if (result.code === 0 && result.url) {
      return {
        success: true,
        redirectUrl: result.url,
        paymentId: result.reference || result.contiPayRef,
        reference: result.reference || reference,
        status: 'pending',
        raw: result,
      };
    } else {
      return {
        success: false,
        error: result.message || 'Payment initiation failed',
        code: result.code,
        raw: result,
      };
    }
  } catch (error) {
    console.error('❌ ContiPay error:', error);
    return {
      success: false,
      error: error.message || 'Payment initiation failed',
    };
  }
}

/**
 * Check payment status with ContiPay
 */
export async function checkContiPayStatus(reference) {
  const { timestamp, authorization } = generateAuth();

  try {
    const payload = {
      timestamp: timestamp,
      reference: reference,
    };

    const response = await fetch(`${CONTIPAY_BASE_URL}/request/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📥 ContiPay status response:', JSON.stringify(result, null, 2));

    // Status codes: 0=Pending, 1=Paid, 2=Refunded, 3=Error, 4=Declined, 5=Confirmed, 6=Queued, 7=Approved
    const statusMap = {
      0: 'pending',
      1: 'completed',
      2: 'refunded',
      3: 'error',
      4: 'declined',
      5: 'completed',
      6: 'pending',
      7: 'approved',
    };

    return {
      success: true,
      status: statusMap[result.statusCode] || 'unknown',
      statusCode: result.statusCode,
      amount: result.amount,
      currency: result.currency,
      reference: result.reference,
      contiPayRef: result.contiPayRef,
      provider: result.providerName,
      providerCode: result.providerCode,
      raw: result,
    };
  } catch (error) {
    console.error('❌ ContiPay status error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse webhook payload
 */
export function parseContiPayWebhook(payload) {
  // Status codes: 0=Pending, 1=Paid, 2=Refunded, 3=Error, 4=Declined, 5=Confirmed, 6=Queued, 7=Approved
  const statusMap = {
    0: 'pending',
    1: 'paid',
    2: 'refunded',
    3: 'error',
    4: 'declined',
    5: 'confirmed',
    6: 'queued',
    7: 'approved',
  };

  return {
    reference: payload.reference || payload.merchantRef,
    contiPayRef: payload.contiPayRef,
    status: statusMap[payload.statusCode] || 'unknown',
    statusCode: payload.statusCode,
    amount: payload.amount,
    currency: payload.currencyCode || payload.currency,
    provider: payload.providerName || payload.provider,
    providerCode: payload.providerCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    message: payload.message,
    methodCode: payload.methodCode,
    correlation: payload.correlation,
    isPaid: payload.statusCode === 1,
    isPending: payload.statusCode === 0 || payload.statusCode === 6,
    isDeclined: payload.statusCode === 4,
  };
}

/**
 * Verify webhook bearer token
 */
export function verifyWebhookToken(authorizationHeader) {
  if (!authorizationHeader) return false;
  
  const expectedToken = CONTIPAY_WEBHOOK_TOKEN;
  const supplied = authorizationHeader.replace('Bearer ', '');
  
  return supplied === expectedToken;
}

/**
 * Get status display name
 */
export function getStatusDisplay(statusCode) {
  const statusMap = {
    0: 'Pending',
    1: '✅ Paid',
    2: 'Refunded',
    3: 'Error',
    4: '❌ Declined',
    5: 'Confirmed',
    6: 'Queued',
    7: 'Approved',
  };
  return statusMap[statusCode] || 'Unknown';
}
