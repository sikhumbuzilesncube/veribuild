import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '../../../lib/paynow';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const pollUrl = searchParams.get('pollUrl');

    if (!reference && !pollUrl) {
      return NextResponse.json(
        { error: 'Reference or pollUrl is required' },
        { status: 400 }
      );
    }

    let urlToCheck = pollUrl;

    // If only reference provided, look up pollUrl from database
    if (!urlToCheck && reference) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data } = await supabase
          .from('payments')
          .select('poll_url')
          .eq('reference', reference)
          .single();

        if (data?.poll_url) {
          urlToCheck = data.poll_url;
        }
      }
    }

    if (!urlToCheck) {
      return NextResponse.json(
        { error: 'Could not find poll URL for this reference' },
        { status: 404 }
      );
    }

    const result = await checkPaymentStatus(urlToCheck);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Paynow status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
      }
