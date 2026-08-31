// ============================================================
// PAYNOW INTEGRATION - Zimbabwe Payment Gateway
// ============================================================

const PAYNOW_INTEGRATION_ID = '25439';
const PAYNOW_INTEGRATION_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';
const PAYNOW_API_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

export async function initiatePayNowPayment(orderData) {
  const {
    reference,
    amount,
    email,
    phone,
    description
  } = orderData;

  // Build the data for PayNow
  const data = {
    id: PAYNOW_INTEGRATION_ID,
    key: PAYNOW_INTEGRATION_KEY,
    reference: reference || `VERIBUILD-${Date.now()}`,
    amount: amount.toFixed(2),
    email: email || 'info@veribuild.co.zw',
    phone: phone || '',
    additionalinfo: description || 'VeriBuild Payment',
    returnurl: 'https://veribuild.vercel.app/payment/success',
    statusurl: 'https://veribuild.vercel.app/api/paynow/status'
  };

  // Build form data
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }

  try {
    const response = await fetch(PAYNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    console.log('PayNow response:', result);

    if (result.status === 'Ok') {
      return {
        success: true,
        redirectUrl: result.browserurl,
        pollUrl: result.pollurl,
        reference: result.reference,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Payment initiation failed',
      };
    }
  } catch (error) {
    console.error('PayNow error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function checkPaymentStatus(pollUrl) {
  try {
    const response = await fetch(pollUrl);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Status check error:', error);
    return { status: 'error' };
  }
                  }
