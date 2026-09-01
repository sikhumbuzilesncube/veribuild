import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId } = body;

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
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Get the room labels to determine required trades
    const roomLabels = project.room_labels || '';
    const trades = [];

    // Determine required trades from rooms
    const tradeMap = {
      'kitchen': 'Plumber',
      'bathroom': 'Plumber',
      'toilet': 'Plumber',
      'lounge': 'Builder',
      'bedroom': 'Builder',
      'garage': 'Builder',
      'study': 'Electrician',
      'office': 'Electrician',
    };

    for (const [room, trade] of Object.entries(tradeMap)) {
      if (roomLabels.toLowerCase().includes(room)) {
        if (!trades.includes(trade)) {
          trades.push(trade);
        }
      }
    }

    // If no specific trades found, default to Builder
    if (trades.length === 0) {
      trades.push('Builder');
    }

    // Find matching workers
    const matchedWorkers = [];
    const cityId = project.city_id || 1;

    for (const trade of trades) {
      const { data: workers, error } = await supabase
        .from('workers')
        .select('*')
        .eq('trade', trade)
        .eq('availability', 'available')
        .eq('subscription_status', 'active')
        .eq('is_verified', true)
        .order('rating', { ascending: false });

      if (!error && workers && workers.length > 0) {
        // Add trade context to each worker
        const workersWithContext = workers.map(w => ({
          ...w,
          matched_for: trade,
          match_score: calculateMatchScore(w, project)
        }));
        matchedWorkers.push(...workersWithContext);
      }
    }

    // Sort by match score
    matchedWorkers.sort((a, b) => b.match_score - a.match_score);

    // Get recommended workers (top 10)
    const recommended = matchedWorkers.slice(0, 10);

    return NextResponse.json({
      success: true,
      project: project,
      required_trades: trades,
      total_matched: matchedWorkers.length,
      recommended: recommended,
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
  let score = 50; // Base score

  // Rating bonus (max 25 points)
  if (worker.rating) {
    score += (worker.rating / 5) * 25;
  }

  // Experience bonus (max 15 points)
  if (worker.years_experience) {
    score += Math.min(worker.years_experience * 2, 15);
  }

  // Location proximity (max 10 points)
  if (worker.city_id === project.city_id) {
    score += 10;
  }

  return Math.round(score);
  }
