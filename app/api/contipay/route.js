import { NextResponse } from 'next/server';

const CONTIPAY_API_KEY = 'VjIzb2lIK1o0VjZyRXdPUXZHNHoyZz09';
const CONTIPAY_SECRET_KEY = '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';
const CONTIPAY_MERCHANT_ID = 952;
const CONTIPAY_BASE_URL = 'https://api.uat.contipay.net';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description, firstName, lastName } = body;

    console.log('📊 ContiPay request:', { amount, email, phone, firstName, lastName });

    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Amount and email are required'
      }, { status: 400 });
    }

    // Encode credentials for Basic Auth
    const credentials = Buffer.from(`${CONTIPAY_API_KEY}:${CONTIPAY_SECRET_KEY}`).toString('base64');

    const reference = `VERI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build customer object
    const customer = {
      nationalId: '00 1234567 A 00',
      surname: lastName || 'Customer',
      firstName: firstName || 'VeriBuild',
      middleName: '',
      email: email,
      cell: phone || '+263700000000',
      countryCode: 'ZW',
    };

    // Build payment payload
    const payload = {
      webhookUrl: 'https://veribuild.vercel.app/api/contipay/webhook',
      description: description || 'VeriBuild Payment',
      amount: parseFloat(amount),
      reference: reference,
      merchantId: CONTIPAY_MERCHANT_ID,
      currencyCode: 'USD',
      successUrl: 'https://veribuild.vercel.app/payment/success',
      cancelUrl: 'https://veribuild.vercel.app/dashboard',
      customer: customer,
    };

    console.log('📤 Sending to ContiPay:', JSON.stringify(payload, null, 2));

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
    console.log('📥 ContiPay response:', JSON.stringify(result, null, 2));

    // Check if payment was initiated successfully
    if (result.statusCode === 0 || result.status === 'pending') {
      return NextResponse.json({
        success: true,
        redirectUrl: result.redirectUrl || result.paymentUrl,
        paymentId: result.contiPayRef || result.paymentId,
        reference: result.merchantRef || reference,
        status: result.status || 'pending',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message || result.status || 'Payment initiation failed',
        details: result,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ ContiPay error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment initiation failed'
    }, { status: 500 });
  }
        }
