import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pollUrl, reference } = body;

    if (!pollUrl) {
      return NextResponse.json(
        { error: 'pollUrl is required' },
        { status: 400 }
      );
    }

    // Check payment status from PayNow
    const response = await fetch(pollUrl);
    const responseText = await response.text();
    console.log('📥 Subscription status response:', responseText);

    const params = new URLSearchParams(responseText);
    const status = params.get('status');
    const paid = status === 'Paid';

    // Update subscription log
    if (reference) {
      const { error: updateError } = await supabase
        .from('subscription_logs')
        .update({
          payment_status: paid ? 'completed' : 'failed',
          status: paid ? 'active' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_reference', reference);

      if (updateError) {
        console.error('Failed to update subscription log:', updateError);
      }

      // If paid, update the user's subscription
      if (paid) {
        const { data: logData, error: logError } = await supabase
          .from('subscription_logs')
          .select('user_id, user_type, period_end')
          .eq('transaction_reference', reference)
          .single();

        if (logError) {
          console.error('Failed to fetch subscription log:', logError);
        } else if (logData) {
          const { user_id, user_type, period_end } = logData;

          // Determine the table to update
          const tables = {
            hardware: 'hardware_stores',
            construction: 'construction_companies',
            worker: 'workers',
          };
          const table = tables[user_type];

          if (table) {
            const { error: updateUserError } = await supabase
              .from(table)
              .update({
                subscription_status: 'active',
                subscription_expiry: period_end,
              })
              .eq('user_id', user_id);

            if (updateUserError) {
              console.error(`Failed to update ${table}:`, updateUserError);
            } else {
              console.log(`✅ ${user_type} subscription renewed until ${period_end}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      paid: paid,
      status: status || 'pending',
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
      }
