import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PAYNOW_ID = '25439';
const PAYNOW_KEY = '6d2661a1-2d18-4b83-8ae5-37dd0860b461';
const PAYNOW_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userType, email, phone, autoRenew } = body;

    console.log('📊 Subscription request:', { userId, userType, email, phone, autoRenew });

    if (!userId || !userType || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const amounts = {
      hardware: 15,
      construction: 15,
      worker: 5,
    };
    const amount = amounts[userType] || 15;

    const reference = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Build PayNow data
    const data = {
      id: PAYNOW_ID,
      key: PAYNOW_KEY,
      reference: reference,
      amount: amount.toString(),
      email: email,
      phone: phone || '',
      additionalinfo: `${userType.charAt(0).toUpperCase() + userType.slice(1)} Subscription`,
      returnurl: 'https://veribuild.vercel.app/dashboard',
      statusurl: 'https://veribuild.vercel.app/api/subscription/status'
    };

    console.log('📤 Sending to PayNow:', data);

    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    const response = await fetch(PAYNOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('📥 PayNow raw response:', responseText);

    // Check if response is empty
    if (!responseText || responseText.trim() === '') {
      console.error('❌ Empty response from PayNow');
      return NextResponse.json({
        success: false,
        error: 'No response from PayNow. Please try again.',
        details: 'Empty response'
      });
    }

    // Parse response
    const params = new URLSearchParams(responseText);
    const status = params.get('status');
    const browserurl = params.get('browserurl');
    const pollurl = params.get('pollurl');

    console.log('📊 Parsed response:', { status, browserurl, pollurl });

    if (status === 'Ok' && browserurl) {
      // Create subscription log
      const { error: logError } = await supabase
        .from('subscription_logs')
        .insert({
          user_id: userId,
          user_type: userType,
          amount: amount,
          payment_status: 'pending',
          transaction_reference: reference,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          status: 'pending',
        });

      if (logError) {
        console.error('Failed to create subscription log:', logError);
      }

      // Update subscription settings
      if (autoRenew !== undefined) {
        const { error: settingsError } = await supabase
          .from('subscription_settings')
          .upsert({
            user_id: userId,
            user_type: userType,
            auto_renew: autoRenew,
            payment_method: 'paynow',
          }, { onConflict: 'user_id' });

        if (settingsError) {
          console.error('Failed to update subscription settings:', settingsError);
        }
      }

      return NextResponse.json({
        success: true,
        redirectUrl: browserurl,
        pollUrl: pollurl,
        reference: reference,
      });
    } else {
      const error = params.get('error') || 'Subscription initiation failed';
      console.error('❌ PayNow error:', error);
      return NextResponse.json({
        success: false,
        error: error,
        details: responseText
      });
    }

  } catch (error) {
    console.error('❌ Subscription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Subscription failed',
    }, { status: 500 });
  }
  }
