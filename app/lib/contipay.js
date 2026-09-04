// ============================================================
// CONTIPAY INTEGRATION - Zimbabwe Payment Gateway
// ============================================================

const CONTIPAY_BASE_URL = 'https://api.uat.contipay.net';
const CONTIPAY_API_KEY = 'VJIZB2LIK1O0VJZYRXDPUXZHNHOYZZ09';
const CONTIPAY_SECRET_KEY = '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';

/**
 * Initialize a payment with ContiPay
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
    nationalId,
    currencyCode = 'USD',
    successUrl = 'https://veribuild.vercel.app/payment/success',
    cancelUrl = 'https://veribuild.vercel.app/dashboard',
    webhookUrl = 'https://veribuild.vercel.app/api/contipay/webhook',
  } = orderData;

  // Encode credentials for Basic Auth
  const credentials = Buffer.from(`${CONTIPAY_API_KEY}:${CONTIPAY_SECRET_KEY}`).toString('base64');

  // Build customer object
  const customer = {
    nationalId: nationalId || '00 1234567 A 00',
    surname: lastName || 'Customer',
    firstName: firstName || 'VeriBuild',
    middleName: '',
    email: email || 'info@veribuild.co.zw',
    cell: phone || '+263700000000',
    countryCode: 'ZW',
  };

  // Build payment payload
  const payload = {
    webhookUrl: webhookUrl,
    description: description || 'VeriBuild Payment',
    amount: parseFloat(amount),
    reference: reference || `VERI-${Date.now()}`,
    merchantId: 25439,
    currencyCode: currencyCode,
    successUrl: successUrl,
    cancelUrl: cancelUrl,
    customer: customer,
  };

  console.log('📤 ContiPay initiate payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${CONTIPAY_BASE_URL}/acquire/payment`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📥 ContiPay initiate response:', JSON.stringify(result, null, 2));

    // Check if payment was initiated successfully
    if (result.statusCode === 0) {
      return {
        success: true,
        redirectUrl: result.redirectUrl || result.paymentUrl,
        paymentId: result.contiPayRef || result.paymentId,
        reference: result.merchantRef || reference,
        status: result.status || 'pending',
        raw: result,
      };
    } else {
      return {
        success: false,
        error: result.message || result.status || 'Payment initiation failed',
        raw: result,
      };
    }
  } catch (error) {
    console.error('❌ ContiPay initiate error:', error);
    return {
      success: false,
      error: error.message || 'Payment initiation failed',
    };
  }
}

/**
 * Check payment status with ContiPay
 */
export async function checkContiPayStatus(merchantRef) {
  const credentials = Buffer.from(`${CONTIPAY_API_KEY}:${CONTIPAY_SECRET_KEY}`).toString('base64');

  try {
    const response = await fetch(
      `${CONTIPAY_BASE_URL}/acquire/payment/status?reference=${merchantRef}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
      }
    );

    const result = await response.json();
    console.log('📥 ContiPay status response:', JSON.stringify(result, null, 2));

    return {
      success: true,
      status: result.status,
      statusCode: result.statusCode,
      amount: result.amount,
      currency: result.currencyCode,
      merchantRef: result.merchantRef,
      contiPayRef: result.contiPayRef,
      provider: result.provider,
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
  return {
    merchantRef: payload.merchantRef,
    contiPayRef: payload.contiPayRef,
    status: payload.status,
    statusCode: payload.statusCode,
    amount: payload.amount,
    currency: payload.currencyCode,
    provider: payload.providerName || payload.providedName,
    providerCode: payload.providedCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    message: payload.message,
    methodCode: payload.methodCode,
    correlation: payload.correlation,
    isPaid: payload.statusCode === 1,
  };
    }
