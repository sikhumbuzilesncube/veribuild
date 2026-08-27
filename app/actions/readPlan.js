'use server';

import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function readPlan(projectId, fileUrl) {
  try {
    console.log('📄 ===== READ PLAN SERVER ACTION =====');
    console.log('📄 Project ID:', projectId);
    console.log('📄 File URL:', fileUrl);

    if (!projectId || !fileUrl) {
      return { success: false, error: 'Missing projectId or fileUrl' };
    }

    // Fetch the PDF
    console.log('📄 Fetching PDF...');
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Try to extract text
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
    console.log('📄 Text length:', text.length);

    // ============================================================
    // SEARCH FOR WINDOWS
    // ============================================================
    const windowPatterns = [
      /[Ww]\d+/g,           // W1, W2, W3, w1, w2
      /[Ww]indow/g,          // Window, window
      /[Ww]in/g,             // Win, win
    ];
    
    let windowMatches = [];
    for (const pattern of windowPatterns) {
      const matches = text.match(pattern) || [];
      windowMatches = windowMatches.concat(matches);
    }
    
    // Count unique window numbers
    const windowNumbers = new Set();
    for (const match of windowMatches) {
      const num = match.match(/\d+/);
      if (num) {
        windowNumbers.add(parseInt(num[0]));
      }
    }
    const windowCount = windowNumbers.size > 0 ? Math.max(...windowNumbers) : 0;
    console.log('📄 Window count:', windowCount);
    console.log('📄 Window matches:', windowMatches);

    // ============================================================
    // SEARCH FOR DOORS
    // ============================================================
    const doorPatterns = [
      /[Dd]\d+/g,           // D1, D2, d1, d2
      /[Dd]oor/g,            // Door, door
    ];
    
    let doorMatches = [];
    for (const pattern of doorPatterns) {
      const matches = text.match(pattern) || [];
      doorMatches = doorMatches.concat(matches);
    }
    
    const doorNumbers = new Set();
    for (const match of doorMatches) {
      const num = match.match(/\d+/);
      if (num) {
        doorNumbers.add(parseInt(num[0]));
      }
    }
    const doorCount = doorNumbers.size > 0 ? Math.max(...doorNumbers) : 0;
    console.log('📄 Door count:', doorCount);
    console.log('📄 Door matches:', doorMatches);

    // ============================================================
    // SEARCH FOR ROOM NAMES
    // ============================================================
    const roomKeywords = ['lounge', 'kitchen', 'garage', 'bedroom', 'bathroom', 'toilet', 'dining', 'study', 'office'];
    const foundRooms = [];
    for (const keyword of roomKeywords) {
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      if (text.match(regex)) {
        foundRooms.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
    console.log('📄 Found rooms:', foundRooms);

    // ============================================================
    // SEARCH FOR DIMENSIONS
    // ============================================================
    const dimPattern = /(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/g;
    let dims = [];
    let match;
    while ((match = dimPattern.exec(text)) !== null) {
      dims.push({ w: parseFloat(match[1]), l: parseFloat(match[2]) });
    }
    console.log('📄 Found dimensions:', dims);

    let area = 0;
    if (dims.length > 0) {
      for (const d of dims) {
        area += d.w * d.l;
      }
      area = Math.round(area * 10) / 10;
    }
    console.log('📄 Calculated area:', area);

    // ============================================================
    // PREPARE UPDATE DATA - USE DETECTED VALUES OR FALLBACK
    // ============================================================
    const updateData = {
      windows: windowCount > 0 ? windowCount : 2,
      doors: doorCount > 0 ? doorCount : 3,
      floor_area: area > 0 ? area : 85,
      room_labels: foundRooms.length > 0 ? foundRooms.join(', ') : 'Lounge, Kitchen, Garage, Bedroom, Bathroom',
      window_details: windowMatches.slice(0, 10).join(', ') || 'None detected',
      notes: `Windows: ${windowCount}, Doors: ${doorCount}, Rooms: ${foundRooms.length}, Dimensions: ${dims.length}`,
      status: 'processing',
    };

    console.log('📄 UPDATE DATA:', updateData);

    // ============================================================
    // UPDATE THE DATABASE DIRECTLY
    // ============================================================
    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Project updated successfully!');
    return { 
      success: true, 
      data: updateData,
      windowsFound: windowCount,
      doorsFound: doorCount,
      roomsFound: foundRooms
    };

  } catch (error) {
    console.error('❌ Error in readPlan:', error);
    return { success: false, error: error.message };
  }
      }
