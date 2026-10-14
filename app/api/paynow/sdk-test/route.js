import { NextResponse } from 'next/server';

let Paynow;
try {
  Paynow = require('paynow').Paynow;
} catch (e) {
  const paynowModule = require('paynow');
  Paynow = paynowModule.Paynow || paynowModule.default?.Paynow || paynowModule;
}

export async function GET() {
  try {
    const integrationId = process.env.PAYNOW_INTEGRATION_ID || '25439';
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || '';

    console.log('SDK Test — Integration ID:', integrationId);
    console.log('SDK Test — Key length:', integrationKey.length);

    const paynow = new Paynow(integrationId, integrationKey);
    paynow.resultUrl = 'https://veribuild.gatekeeperai.co.zw/api/paynow/webhook';
    paynow.returnUrl = 'https://veribuild.gatekeeperai.co.zw/payment/success';

    const reference = 'SDK-TEST-' + Date.now();
    const payment = paynow.createPayment(reference, 'test@example.com');
    payment.add('SDK Test Payment', 1.00);

    console.log('Calling paynow.send()...');
    const response = await paynow.send(payment);

    console.log('SDK Response:', JSON.stringify({
      success: response.success,
      hasRedirect: !!response.redirectUrl,
      hasPoll: !!response.pollUrl,
      error: response.error,
    }));

    return NextResponse.json({
      integrationId,
      integrationKeyLength: integrationKey.length,
      reference,
      success: response.success,
      redirectUrl: response.redirectUrl || null,
      pollUrl: response.pollUrl || null,
      error: response.error || null,
      instructions: response.instructions || null,
    });

  } catch (error) {
    console.error('SDK Test error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
    }, { status: 500 });
  }
      }
