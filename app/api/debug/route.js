import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const diag = {
    supabaseUrl: url ? `${url.substring(0, 30)}...` : 'MISSING',
    serviceKeySet: !!serviceKey,
    serviceKeyLength: serviceKey?.length || 0,
    serviceKeyIsJWT: serviceKey?.startsWith('eyJ') || false,
  };

  if (!url || !serviceKey) {
    return NextResponse.json({ ...diag, error: 'Missing env vars' });
  }

  try {
    const supabase = createClient(url, serviceKey);

    // Get ALL payments with char codes
    const { data: allPayments, error: allErr } = await supabase
      .from('payments')
      .select('id, transaction_reference, payment_status')
      .order('id', { ascending: false })
      .limit(20);

    // Character analysis
    const charAnalysis = (allPayments || []).map(p => ({
      id: p.id,
      ref: p.transaction_reference,
      status: p.payment_status,
      length: p.transaction_reference?.length,
      charCodes: p.transaction_reference
        ? p.transaction_reference.split('').map(c => c.charCodeAt(0))
        : null,
      hasLeadingSpace: p.transaction_reference?.startsWith(' '),
      hasTrailingSpace: p.transaction_reference?.endsWith(' '),
      cleanedRef: p.transaction_reference?.trim().toUpperCase(),
    }));

    // Try finding the specific one with different methods
    const targetRef = 'VB-MV3RZ0WU-J9FY0D';

    const { data: exact } = await supabase
      .from('payments')
      .select('id, transaction_reference')
      .eq('transaction_reference', targetRef)
      .maybeSingle();

    const { data: trimmed } = await supabase
      .from('payments')
      .select('id, transaction_reference')
      .eq('transaction_reference', targetRef.trim())
      .maybeSingle();

    const { data: ilike } = await supabase
      .from('payments')
      .select('id, transaction_reference')
      .ilike('transaction_reference', `%${targetRef}%`)
      .maybeSingle();

    return NextResponse.json({
      ...diag,
      targetRef,
      targetRefCharCodes: targetRef.split('').map(c => c.charCodeAt(0)),
      queryResults: {
        exactMatch: { found: !!exact, data: exact },
        trimmedMatch: { found: !!trimmed, data: trimmed },
        ilikeMatch: { found: !!ilike, data: ilike },
      },
      allPayments: charAnalysis,
      allErr: allErr?.message || null,
    });
  } catch (err) {
    return NextResponse.json({ ...diag, fatalError: err.message });
  }
      }
