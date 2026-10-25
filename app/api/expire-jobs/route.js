import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const URGENCY_WINDOWS = {
  asap: 48,
  today: 24,
  this_week: 168,
};

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all open jobs
    const { data: openJobs } = await supabase
      .from('job_requests')
      .select('id, urgency, created_at')
      .eq('status', 'open');

    if (!openJobs || openJobs.length === 0) {
      return NextResponse.json({ success: true, expiredCount: 0 });
    }

    const now = new Date().getTime();
    const expiredIds = [];

    openJobs.forEach(job => {
      const hours = URGENCY_WINDOWS[job.urgency] || 24;
      const created = new Date(job.created_at).getTime();
      const cutoff = now - (hours * 60 * 60 * 1000);
      
      if (created < cutoff) {
        expiredIds.push(job.id);
      }
    });

    if (expiredIds.length > 0) {
      await supabase
        .from('job_requests')
        .update({ status: 'expired' })
        .in('id', expiredIds);
    }

    return NextResponse.json({ success: true, expiredCount: expiredIds.length });

  } catch (error) {
    console.error('Expiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  }
