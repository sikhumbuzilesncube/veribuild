import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function GET() {
  const results = {};
  const testData = JSON.stringify({ test: 'hello' });
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY || '0e6a6429cc0445fb8195ffbff0cdaf1c';

  // Method 1: UTF-8 parse full key, no IV
  try {
    const key = CryptoJS.enc.Utf8.parse(encryptionKey);
    const encrypted = CryptoJS.AES.encrypt(testData, key).toString();
    results.method1_utf8_no_iv = {
      success: true,
      preview: encrypted.substring(0, 40),
      length: encrypted.length,
      startsWithSalted: encrypted.startsWith('U2FsdGVkX1')
    };
  } catch (e) {
    results.method1_utf8_no_iv = { success: false, error: e.message };
  }

  // Method 2: Hex parse key (16 bytes), no IV
  try {
    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const encrypted = CryptoJS.AES.encrypt(testData, key).toString();
    results.method2_hex_no_iv = {
      success: true,
      preview: encrypted.substring(0, 40),
      length: encrypted.length,
      startsWithSalted: encrypted.startsWith('U2FsdGVkX1')
    };
  } catch (e) {
    results.method2_hex_no_iv = { success: false, error: e.message };
  }

  // Method 3: Plain string key (not parsed)
  try {
    const encrypted = CryptoJS.AES.encrypt(testData, encryptionKey).toString();
    results.method3_plain_string = {
      success: true,
      preview: encrypted.substring(0, 40),
      length: encrypted.length,
      startsWithSalted: encrypted.startsWith('U2FsdGVkX1')
    };
  } catch (e) {
    results.method3_plain_string = { success: false, error: e.message };
  }

  // Method 4: Base64 decode then UTF-8 parse
  try {
    const decoded = CryptoJS.enc.Base64.parse(encryptionKey);
    const encrypted = CryptoJS.AES.encrypt(testData, decoded).toString();
    results.method4_base64_decode = {
      success: true,
      preview: encrypted.substring(0, 40),
      length: encrypted.length
    };
  } catch (e) {
    results.method4_base64_decode = { success: false, error: e.message };
  }

  // Method 5: With explicit IV from first 16 chars
  try {
    const key = CryptoJS.enc.Utf8.parse(encryptionKey);
    const iv = CryptoJS.enc.Utf8.parse(encryptionKey.substring(0, 16));
    const encrypted = CryptoJS.AES.encrypt(testData, key, { iv: iv }).toString();
    results.method5_utf8_with_iv = {
      success: true,
      preview: encrypted.substring(0, 40),
      length: encrypted.length,
      startsWithSalted: encrypted.startsWith('U2FsdGVkX1')
    };
  } catch (e) {
    results.method5_utf8_with_iv = { success: false, error: e.message };
  }

  return NextResponse.json({
    keyInfo: {
      length: encryptionKey.length,
      hexDecodedLength: encryptionKey.replace(/[^0-9a-f]/gi, '').length / 2,
      asUtf8ByteLength: new TextEncoder().encode(encryptionKey).length
    },
    results
  });
    }
