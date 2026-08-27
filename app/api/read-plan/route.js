import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdfParse from 'pdf-parse';

export async function POST(request) {
  try {
    const { projectId, fileUrl } = await request.json();

    if (!projectId || !fileUrl) {
      return NextResponse.json({ error: 'Missing projectId or fileUrl' }, { status: 400 });
    }

    console.log('📄 ===== READING PLAN =====');
    console.log('📄 Project ID:', projectId);
    console.log('📄 File URL:', fileUrl);

    // Fetch the PDF file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    console.log('📄 Extracted text length:', text.length);
    console.log('📄 === FIRST 1000 CHARACTERS ===');
    console.log(text.substring(0, 1000));
    console.log('📄 === LAST 500 CHARACTERS ===');
    console.log(text.substring(text.length - 500));

    // Parse the extracted text
    const parsedData = parsePlanText(text);
    
    console.log('📄 === PARSED DATA ===');
    console.log('Floor Area:', parsedData.floor_area);
    console.log('Rooms:', parsedData.rooms);
    console.log('Room Labels:', parsedData.room_labels);
    console.log('Doors:', parsedData.doors);
    console.log('Windows:', parsedData.windows);
    console.log('Window Details:', parsedData.window_details);
    console.log('Door Details:', parsedData.door_details);
    console.log('Notes:', parsedData.notes);
    console.log('Red Walls:', parsedData.red_wall_length);
    console.log('Green Concrete:', parsedData.green_concrete_area);
    console.log('Yellow Timber:', parsedData.yellow_timber_length);
    console.log('Brown Sewer:', parsedData.brown_sewer_length);
    console.log('Blue Water:', parsedData.blue_water_length);

    // Update the project with parsed data
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        floor_area: parsedData.floor_area || 0,
        rooms: parsedData.rooms || 0,
        room_labels: parsedData.room_labels || '',
        wall_length: parsedData.wall_length || 0,
        wall_height: parsedData.wall_height || 2.7,
        doors: parsedData.doors || 0,
        windows: parsedData.windows || 0,
        window_details: parsedData.window_details || '',
        door_details: parsedData.door_details || '',
        notes: parsedData.notes || '',
        red_wall_length: parsedData.red_wall_length || 0,
        green_concrete_area: parsedData.green_concrete_area || 0,
        yellow_timber_length: parsedData.yellow_timber_length || 0,
        brown_sewer_length: parsedData.brown_sewer_length || 0,
        blue_water_length: parsedData.blue_water_length || 0,
        foundation_type: parsedData.foundation_type || 'strip',
        foundation_depth: parsedData.foundation_depth || 0.6,
        foundation_width: parsedData.foundation_width || 0.4,
        slab_type: parsedData.slab_type || 'ground',
        slab_thickness: parsedData.slab_thickness || 0.15,
        concrete_grade: parsedData.concrete_grade || 'C20',
        plan_scale: parsedData.plan_scale || '1:100',
        status: 'processing',
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    console.log('✅ Plan data extracted and saved!');

    return NextResponse.json({
      success: true,
      data: parsedData,
      message: 'Plan read successfully'
    });

  } catch (error) {
    console.error('❌ Plan reading error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// PARSE PLAN TEXT - Extract building information
// ============================================================
function parsePlanText(text) {
  const result = {
    floor_area: 0,
    rooms: 0,
    room_labels: '',
    wall_length: 0,
    wall_height: 2.7,
    doors: 0,
    windows: 0,
    window_details: '',
    door_details: '',
    notes: '',
    red_wall_length: 0,
    green_concrete_area: 0,
    yellow_timber_length: 0,
    brown_sewer_length: 0,
    blue_water_length: 0,
    foundation_type: 'strip',
    foundation_depth: 0.6,
    foundation_width: 0.4,
    slab_type: 'ground',
    slab_thickness: 0.15,
    concrete_grade: 'C20',
    plan_scale: '1:100',
  };

  // ============================================================
  // 1. EXTRACT ALL NUMBERS (for window counts, etc.)
  // ============================================================
  const allNumbers = text.match(/\d+/g) || [];
  console.log('📊 All numbers found:', allNumbers);

  // ============================================================
  // 2. FIND WINDOW-RELATED TEXT
  // ============================================================
  const windowRegex = /window[s]?\s*[:=]?\s*(\d+)/gi;
  let windowMatches = [];
  let match;
  while ((match = windowRegex.exec(text)) !== null) {
    windowMatches.push(match);
  }
  console.log('📊 Window regex matches:', windowMatches);

  // Look for "14 windows" or similar
  const windowCountPatterns = [
    /(\d+)\s*window[s]?/gi,
    /window[s]?\s*(\d+)/gi,
    /(\d+)\s*no\.?\s*window/gi,
  ];

  for (const pattern of windowCountPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      if (m[1]) {
        const count = parseInt(m[1]);
        if (count > result.windows) {
          result.windows = count;
          console.log('📊 Found window count:', count);
        }
      }
    }
  }

  // ============================================================
  // 3. FIND CUSTOM WINDOW DETAILS
  // ============================================================
  const customWindowPatterns = [
    /window\s*(?:frame|size|type)\s*[:=]\s*([^\n]+)/gi,
    /(?:aluminium|timber|steel|custom)\s*window/gi,
    /window\s*(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)/gi,
  ];

  let customWindows = [];
  for (const pattern of customWindowPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      customWindows.push(m[0]);
    }
  }
  result.window_details = customWindows.join('; ');
  console.log('📊 Custom window details:', result.window_details);

  // ============================================================
  // 4. FIND DOOR-RELATED TEXT
  // ============================================================
  const doorCountPatterns = [
    /(\d+)\s*door[s]?/gi,
    /door[s]?\s*(\d+)/gi,
    /(\d+)\s*no\.?\s*door/gi,
  ];

  for (const pattern of doorCountPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      if (m[1]) {
        const count = parseInt(m[1]);
        if (count > result.doors) {
          result.doors = count;
          console.log('📊 Found door count:', count);
        }
      }
    }
  }

  // ============================================================
  // 5. FIND ROOM NAMES
  // ============================================================
  const roomKeywords = ['lounge', 'kitchen', 'garage', 'bedroom', 'bathroom', 'toilet', 'dining', 'study', 'office', 'store', 'pantry', 'laundry', 'porch', 'veranda', 'patio'];
  const foundRooms = [];
  for (const keyword of roomKeywords) {
    const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      foundRooms.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  
  if (foundRooms.length > 0) {
    result.room_labels = foundRooms.join(', ');
    result.rooms = Math.max(result.rooms, foundRooms.length);
    console.log('📊 Found rooms:', foundRooms);
  }

  // ============================================================
  // 6. FIND DIMENSIONS
  // ============================================================
  const dimPatterns = [
    /(\d+\.?\d*)\s*[mM]\s*[xX×]\s*(\d+\.?\d*)\s*[mM]/g,
    /(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[mM]/g,
    /(\d+\.?\d*)\s*by\s*(\d+\.?\d*)\s*[mM]/g,
  ];

  let allDimensions = [];
  for (const pattern of dimPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      if (m.length >= 3) {
        allDimensions.push({ width: parseFloat(m[1]), length: parseFloat(m[2]) });
      }
    }
  }

  if (allDimensions.length > 0) {
    let totalArea = 0;
    for (const dim of allDimensions) {
      totalArea += dim.width * dim.length;
    }
    result.floor_area = Math.round(totalArea * 10) / 10;
    console.log('📊 Floor area from dimensions:', result.floor_area);
  }

  // ============================================================
  // 7. FIND NOTES
  // ============================================================
  const notePatterns = [
    /note[s]?\s*[:=]\s*([^\n]+)/gi,
    /remark[s]?\s*[:=]\s*([^\n]+)/gi,
    /specification[s]?\s*[:=]\s*([^\n]+)/gi,
  ];

  let notes = [];
  for (const pattern of notePatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      if (m[1]) notes.push(m[1].trim());
    }
  }
  result.notes = notes.join('; ');
  console.log('📊 Found notes:', result.notes);

  // ============================================================
  // 8. DEFAULT VALUES IF NOTHING DETECTED
  // ============================================================
  if (result.rooms === 0) result.rooms = 3;
  if (result.doors === 0) result.doors = 3;
  if (result.windows === 0) result.windows = 2;
  if (result.floor_area === 0) result.floor_area = 80;
  if (result.wall_length === 0) result.wall_length = 50;
  if (result.red_wall_length === 0) result.red_wall_length = result.wall_length;
  if (result.green_concrete_area === 0) result.green_concrete_area = result.floor_area;
  if (result.yellow_timber_length === 0) result.yellow_timber_length = Math.round(result.floor_area * 0.4 * 10) / 10;

  console.log('📊 FINAL PARSED DATA:', result);
  return result;
      }
