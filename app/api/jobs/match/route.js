import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    console.log('📊 ===== MATCH API CALLED =====');
    console.log('📊 Project ID:', projectId);

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Project error:', projectError);
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    console.log('📊 Project found:', project.id, project.project_name);

    // Get ALL workers
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .eq('subscription_status', 'active')
      .eq('is_verified', true);

    console.log('📊 Total workers in DB:', allWorkers?.length || 0);

    if (workersError) {
      console.error('❌ Workers error:', workersError);
    }

    if (!allWorkers || allWorkers.length === 0) {
      console.log('❌ No workers found');
      return NextResponse.json({
        success: true,
        project: project,
        required_trades: ['Builder'],
        total_matched: 0,
        recommended: [],
        message: 'No active workers found'
      });
    }

    // Map workers with scores
    const matchedWorkers = allWorkers.map(w => ({
      ...w,
      matched_for: w.trade || 'Builder',
      match_score: calculateMatchScore(w, project)
    }));

    // Sort by match score
    matchedWorkers.sort((a, b) => b.match_score - a.match_score);

    console.log('📊 Matched workers:', matchedWorkers.length);

    return NextResponse.json({
      success: true,
      project: project,
      required_trades: ['Builder'],
      total_matched: matchedWorkers.length,
      recommended: matchedWorkers.slice(0, 20),
    });

  } catch (error) {
    console.error('❌ Job matching error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Job matching failed'
    }, { status: 500 });
  }
}

function calculateMatchScore(worker, project) {
  let score = 50;
  if (worker.rating) score += (worker.rating / 5) * 25;
  if (worker.years_experience) score += Math.min(worker.years_experience * 2, 15);
  if (worker.city_id === project.city_id) score += 10;
  return Math.round(score);
}
