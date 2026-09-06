/**
 * ContiPay Payment Integration
 * For VeriBuild - A Product of GateKeeperAI
 */

const CONTIPAY_CONFIG = {
  baseUrl: process.env.CONTIPAY_BASE_URL || 'https://api-uat.contipay.net',
  merchantId: process.env.CONTIPAY_MERCHANT_ID || '952',
  apiKey: process.env.CONTIPAY_API_KEY || 'VjIzb2lIK1o0VjZyRXdPUXZHNHoyZz09',
  secretKey: process.env.CONTIPAY_SECRET_KEY || '764cc5e8-3d34-45ea-b9f0-66df7fff19fe',
};

export async function initiatePayment(paymentData) {
  try {
    if (!paymentData.amount || !paymentData.customerEmail) {
      throw new Error('Amount and customer email are required');
    }

    const reference = generateReference();

    // Build the URL correctly - WITHOUT trailing slash
    const baseUrl = CONTIPAY_CONFIG.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/acquire/payment`;

    const payload = {
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/contipay/webhook`,
      description: `VeriBuild - ${paymentData.planName} Subscription - #${reference}`,
      amount: parseFloat(paymentData.amount),
      reference: reference,
      merchantId: parseInt(CONTIPAY_CONFIG.merchantId),
      currencyCode: paymentData.currency || 'USD',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?reference=${reference}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?reference=${reference}`,
      customers: {
        nationalId: paymentData.nationalId || '00 1234567 A 00',
        surname: paymentData.customerLastName || 'User',
        firstName: paymentData.customerFirstName || 'Customer',
        middleName: paymentData.customerMiddleName || '',
        email: paymentData.customerEmail,
        cell: paymentData.customerPhone || '+2637000000000',
        countryCode: 'ZH'
      }
    };

    console.log('ContiPay URL:', url);
    console.log('ContiPay Request:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${CONTIPAY_CONFIG.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('ContiPay Response:', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Payment initiation failed');
    }

    await storePaymentRecord({
      transactionId: data.contiPayRef || reference,
      reference: reference,
      amount: payload.amount,
      currency: payload.currencyCode,
      planType: paymentData.planType,
      planName: paymentData.planName,
      userId: paymentData.userId,
      customerEmail: paymentData.customerEmail,
      status: 'pending'
    });

    return {
      success: true,
      transactionId: data.contiPayRef || reference,
      reference: reference,
      redirectUrl: data.redirectUrl,
      status: data.status,
      statusCode: data.statusCode,
      message: data.message
    };

  } catch (error) {
    console.error('ContiPay Error:', error);
    throw error;
  }
}

function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VB-${timestamp}-${random}`.toUpperCase();
}

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
  generateReference
};
