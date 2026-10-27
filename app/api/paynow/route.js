import { NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/paynow';
import { getPrice, getPaymentPurpose } from '@/lib/prices';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerEmail, planType, planName, planDuration, userId, projectId, reference, discountCode } = body;

    if (!planType) return NextResponse.json({ error: 'Plan type required' }, { status: 400 });
    if (!customerEmail) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    let amount = getPrice(planType);
    if (amount == null) return NextResponse.json({ error: `Unknown plan type: ${planType}` }, { status: 400 });

    if (discountCode) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: codeData } = await supabase
        .from('discount_codes')
        .select('percentage')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (codeData) {
        amount = amount - (amount * (codeData.percentage / 100));
      }
    }

    const paymentPurpose = getPaymentPurpose(planType);

    const result = await initiatePayment({
      amount: amount,
      customerEmail,
      planType,
      planName: planName || 'Payment',
      planDuration: planDuration || '',
      userId: userId || null,
      projectId: projectId || null,
      paymentPurpose: paymentPurpose,
      reference: reference || null,
    });

    return NextResponse.json({ success: true, redirectUrl: result.redirectUrl, pollUrl: result.pollUrl, reference: result.reference, amount: amount });
  } catch (error) {
    console.error('Paynow route error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate payment' }, { status: 500 });
  }
                                    }
