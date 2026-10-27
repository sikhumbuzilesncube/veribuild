import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Discount fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    if (data.times_used >= data.max_uses) {
      return NextResponse.json({ error: 'This code has reached its maximum uses' }, { status: 400 });
    }

    return NextResponse.json({ success: true, percentage: data.percentage });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
        }
