import { NextResponse } from 'next/server';

const CONTIPAY_API_KEY = 'VJIZB2LIK1O0VJZYRXDPUXZHNHOYZZ09';
const CONTIPAY_SECRET_KEY = '764cc5e8-3d34-45ea-b9f0-66df7fff19fe';
const CONTIPAY_BASE_URL = 'https://api.uat.contipay.net';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, email, phone, description, firstName, lastName } = body;

    console.log('📊 ContiPay request:', { amount, email, phone });

    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Amount and email are required'
      }, { status: 400 });
    }

    const credentials = Buffer.from(`${CONTIPAY_API_KEY}:${CONTIPAY_SECRET_KEY}`).toString('base64');

    const reference = `VERI-${Date.now()}`;

    const payload = {
      webhookUrl: 'https://veribuild.vercel.app/api/contipay/webhook',
      description: description || 'VeriBuild Payment',
      amount: parseFloat(amount),
      reference: reference,
      merchantId: 25439,
      currencyCode: 'USD',
      successUrl: 'https://veribuild.vercel.app/payment/success',
      cancelUrl: 'https://veribuild.vercel.app/dashboard',
      customer: {
        nationalId: '00 1234567 A 00',
        surname: lastName || 'Customer',
        firstName: firstName || 'VeriBuild',
        middleName: '',
        email: email,
        cell: phone || '+263700000000',
        countryCode: 'ZW',
      },
    };

    console.log('📤 Sending to ContiPay:', JSON.stringify(payload));

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
    console.log('📥 ContiPay response:', JSON.stringify(result));

    if (result.statusCode === 0) {
      return NextResponse.json({
        success: true,
        redirectUrl: result.redirectUrl || result.paymentUrl,
        paymentId: result.contiPayRef,
        reference: reference,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message || 'Payment initiation failed'
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
