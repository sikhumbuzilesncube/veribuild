import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Diagnostic info
  const diag = {
    supabaseUrl: url ? `${url.substring(0, 30)}...` : 'MISSING',
    serviceKeySet: !!serviceKey,
    serviceKeyLength: serviceKey?.length || 0,
    serviceKeyPrefix: serviceKey?.substring(0, 30) || 'NONE',
    serviceKeyIsJWT: serviceKey?.startsWith('eyJ') || false,
  };

  if (!url || !serviceKey) {
    return NextResponse.json({
      ...diag,
      error: 'Missing env vars',
    });
  }

  try {
    const supabase = createClient(url, serviceKey);

    // Try to find the specific payment
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_reference', 'VB-MV3RZ0WU-J9FY0D')
      .maybeSingle();

    // Try to list any payments
    const { data: all, error: listError, count } = await supabase
      .from('payments')
      .select('id, transaction_reference', { count: 'exact' })
      .limit(5);

    return NextResponse.json({
      ...diag,
      findQuery: {
        success: !!payment,
        error: findError?.message || null,
        found: payment ? {
          id: payment.id,
          ref: payment.transaction_reference,
          status: payment.payment_status,
        } : null,
      },
      listQuery: {
        count: count,
        error: listError?.message || null,
        preview: all || [],
      },
    });
  } catch (err) {
    return NextResponse.json({
      ...diag,
      fatalError: err.message,
    });
  }
      }
