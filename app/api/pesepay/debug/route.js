import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      PESEPAY_INTEGRATION_KEY: process.env.PESEPAY_INTEGRATION_KEY 
        ? `Set (length: ${process.env.PESEPAY_INTEGRATION_KEY.length})` 
        : 'NOT SET',
      PESEPAY_ENCRYPTION_KEY: process.env.PESEPAY_ENCRYPTION_KEY 
        ? `Set (length: ${process.env.PESEPAY_ENCRYPTION_KEY.length})` 
        : 'NOT SET',
      PESEPAY_BASE_URL: process.env.PESEPAY_BASE_URL || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    },
    cryptoTest: null,
    fetchTest: null,
  };

  // Test 1: Can we import crypto-js?
  try {
    const CryptoJS = (await import('crypto-js')).default;
    diagnostics.cryptoTest = {
      imported: true,
      hasAES: typeof CryptoJS.AES === 'object',
      hasEnc: typeof CryptoJS.enc === 'object',
    };
  } catch (error) {
    diagnostics.cryptoTest = {
      imported: false,
      error: error.message,
    };
  }

  // Test 2: Can we encrypt a simple string?
  try {
    const CryptoJS = (await import('crypto-js')).default;
    const key = CryptoJS.enc.Utf8.parse(process.env.PESEPAY_ENCRYPTION_KEY || 'test');
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify({ test: true }), key).toString();
    diagnostics.encryptTest = {
      success: true,
      preview: encrypted.substring(0, 30) + '...',
      length: encrypted.length,
    };
  } catch (error) {
    diagnostics.encryptTest = {
      success: false,
      error: error.message,
    };
  }

  // Test 3: Can we reach PesePay at all?
  try {
    const response = await fetch('https://api.test.sandbox.pesepay.com/payments-engine/v1/payments/initiate', {
      method: 'POST',
      headers: {
        'authorization': process.env.PESEPAY_INTEGRATION_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: 'test' }),
    });
    const text = await response.text();
    diagnostics.fetchTest = {
      status: response.status,
      responsePreview: text.substring(0, 200),
    };
  } catch (error) {
    diagnostics.fetchTest = {
      error: error.message,
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
      }
