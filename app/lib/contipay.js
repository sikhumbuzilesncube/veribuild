// ============================================================
// CONTIPAY INTEGRATION - Zimbabwe Payment Gateway
// ============================================================

const CONTIPAY_API_KEY = 'VJIZB2LIK1O0VJZYRXDPUXZHNHOYZZ09';
const CONTIPAY_SECRET_KEY = '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';
const CONTIPAY_BASE_URL = 'https://sandbox.contipay.co.zw/api/v1';

export async function initiateContiPayPayment(orderData) {
  const {
    amount,
    email,
    phone,
    description,
    reference,
    currency = 'USD',
    provider = 'ecocash',
  } = orderData;

  const payload = {
    amount: amount.toString(),
    currency: currency,
    provider: provider,
    merchantRef: reference || `VERI-${Date.now()}`,
    customerEmail: email,
    customerPhone: phone || '',
    description: description || 'VeriBuild Payment',
    returnUrl: 'https://veribuild.vercel.app/payment/success',
    webhookUrl: 'https://veribuild.vercel.app/api/contipay/webhook',
  };

  try {
    const response = await fetch(`${CONTIPAY_BASE_URL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONTIPAY_API_KEY,
        'x-secret-key': CONTIPAY_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📊 ContiPay initiate response:', result);

    if (result.status === 'success' || result.status === 'pending') {
      return {
        success: true,
        redirectUrl: result.data?.redirectUrl || result.data?.paymentUrl,
        paymentId: result.data?.paymentId || result.data?.id,
        reference: result.data?.merchantRef || reference,
        providerReference: result.data?.providerReference,
        status: result.status,
      };
    } else {
      return {
        success: false,
        error: result.message || 'Payment initiation failed',
        details: result,
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

export async function checkContiPayStatus(paymentId, merchantRef) {
  try {
    let url = `${CONTIPAY_BASE_URL}/payment/status`;
    const params = new URLSearchParams();
    
    if (paymentId) {
      params.append('paymentId', paymentId);
    } else if (merchantRef) {
      params.append('merchantRef', merchantRef);
    } else {
      return { success: false, error: 'paymentId or merchantRef required' };
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'x-api-key': CONTIPAY_API_KEY,
        'x-secret-key': CONTIPAY_SECRET_KEY,
      },
    });

    const result = await response.json();
    console.log('📊 ContiPay status response:', result);

    if (result.status === 'success') {
      return {
        success: true,
        status: result.data?.status,
        amount: result.data?.amount,
        currency: result.data?.currency,
        provider: result.data?.provider,
        providerReference: result.data?.providerReference,
        settledAmount: result.data?.settledAmount,
        fee: result.data?.fee,
      };
    } else {
      return {
        success: false,
        error: result.message || 'Status check failed',
        status: result.status,
      };
    }
  } catch (error) {
    console.error('❌ ContiPay status error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function parseContiPayWebhook(payload) {
  return {
    paymentId: payload.paymentId || payload.id,
    merchantRef: payload.merchantRef || payload.reference,
    status: payload.status,
    amount: payload.amount,
    currency: payload.currency,
    provider: payload.provider,
    providerReference: payload.providerReference,
    settledAmount: payload.settledAmount,
    fee: payload.fee,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
        }
