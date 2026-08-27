import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdfParse from 'pdf-parse';

export async function POST(request) {
  try {
    const { projectId, fileUrl } = await request.json();

    if (!projectId || !fileUrl) {
      return NextResponse.json({ error: 'Missing projectId or fileUrl' }, { status: 400 });
    }

    console.log('📄 Reading plan for project:', projectId);
    console.log('📄 File URL:', fileUrl);

    // Fetch the PDF file from Supabase Storage
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    console.log('📄 Extracted text length:', text.length);
    console.log('📄 First 500 chars:', text.substring(0, 500));

    // Parse the extracted text
    const parsedData = parsePlanText(text);

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
  // 1. EXTRACT DIMENSIONS (e.g., "5.0m x 4.0m")
  // ============================================================
  const dimPatterns = [
    /(\d+\.?\d*)\s*[mM]\s*[xX×]\s*(\d+\.?\d*)\s*[mM]/g,
    /(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[mM]/g,
    /(\d+\.?\d*)\s*by\s*(\d+\.?\d*)\s*[mM]/g,
  ];

  let allDimensions = [];
  for (const pattern of dimPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match.length >= 3) {
        allDimensions.push({ width: parseFloat(match[1]), length: parseFloat(match[2]) });
      }
    }
  }

  // Calculate floor area from dimensions
  if (allDimensions.length > 0) {
    let totalArea = 0;
    for (const dim of allDimensions) {
      totalArea += dim.width * dim.length;
    }
    result.floor_area = Math.round(totalArea * 10) / 10;
    result.rooms = allDimensions.length;

    // Build room labels list
    const labels = [];
    for (const dim of allDimensions) {
      labels.push(`${dim.width}m × ${dim.length}m`);
    }
    result.room_labels = labels.join(', ');
  }

  // ============================================================
  // 2. EXTRACT ROOM NAMES
  // ============================================================
  const roomKeywords = ['lounge', 'kitchen', 'garage', 'bedroom', 'bathroom', 'toilet', 'dining', 'study', 'office', 'store', 'pantry', 'laundry'];
  const foundRooms = [];
  for (const keyword of roomKeywords) {
    const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      foundRooms.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }

  if (foundRooms.length > 0) {
    const existingLabels = result.room_labels ? result.room_labels.split(', ') : [];
    const allLabels = [...existingLabels, ...foundRooms];
    result.room_labels = allLabels.join(', ');
    result.rooms = Math.max(result.rooms, foundRooms.length);
  }

  // ============================================================
  // 3. EXTRACT DOORS
  // ============================================================
  const doorPatterns = [
    /door[s]?\s*[:=]\s*(\d+)/gi,
    /(\d+)\s*door[s]?/gi,
    /door\s*(\d+)/gi,
  ];

  for (const pattern of doorPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const numbers = matches[0].match(/\d+/g);
      if (numbers && numbers.length > 0) {
        result.doors = parseInt(numbers[0]);
        break;
      }
    }
  }

  // ============================================================
  // 4. EXTRACT WINDOWS
  // ============================================================
  const windowPatterns = [
    /window[s]?\s*[:=]\s*(\d+)/gi,
    /(\d+)\s*window[s]?/gi,
    /window\s*(\d+)/gi,
  ];

  for (const pattern of windowPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const numbers = matches[0].match(/\d+/g);
      if (numbers && numbers.length > 0) {
        result.windows = parseInt(numbers[0]);
        break;
      }
    }
  }

  // ============================================================
  // 5. EXTRACT WINDOW DETAILS (custom frames, sizes)
  // ============================================================
  const windowDetailPatterns = [
    /window\s*(?:frame|size)\s*[:=]\s*([^\n]+)/gi,
    /(?:aluminium|timber|steel)\s*window/gi,
    /window\s*(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)/gi,
  ];

  let windowDetails = [];
  for (const pattern of windowDetailPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      windowDetails.push(match[0]);
    }
  }
  result.window_details = windowDetails.join('; ');

  // ============================================================
  // 6. EXTRACT DOOR DETAILS
  // ============================================================
  const doorDetailPatterns = [
    /door\s*(?:frame|size|type)\s*[:=]\s*([^\n]+)/gi,
    /(?:sliding|swing|pocket|french)\s*door/gi,
    /door\s*(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)/gi,
  ];

  let doorDetails = [];
  for (const pattern of doorDetailPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      doorDetails.push(match[0]);
    }
  }
  result.door_details = doorDetails.join('; ');

  // ============================================================
  // 7. EXTRACT NOTES
  // ============================================================
  const notePatterns = [
    /note[s]?\s*[:=]\s*([^\n]+)/gi,
    /remark[s]?\s*[:=]\s*([^\n]+)/gi,
    /specification[s]?\s*[:=]\s*([^\n]+)/gi,
  ];

  let notes = [];
  for (const pattern of notePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) notes.push(match[1].trim());
    }
  }
  result.notes = notes.join('; ');

  // ============================================================
  // 8. DETECT FOUNDATION TYPE FROM NOTES
  // ============================================================
  if (text.match(/strip\s*foundation/i)) {
    result.foundation_type = 'strip';
  } else if (text.match(/raft\s*foundation/i)) {
    result.foundation_type = 'raft';
  } else if (text.match(/piled\s*foundation/i)) {
    result.foundation_type = 'piled';
  }

  // ============================================================
  // 9. DETECT CONCRETE GRADE
  // ============================================================
  const gradeMatch = text.match(/C(\d+)/i);
  if (gradeMatch) {
    result.concrete_grade = `C${gradeMatch[1]}`;
  }

  // ============================================================
  // 10. EXTRACT PLAN SCALE
  // ============================================================
  const scalePatterns = [
    /scale\s*[:=]\s*(\d+):(\d+)/gi,
    /(\d+):(\d+)\s*scale/gi,
  ];

  for (const pattern of scalePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const numbers = matches[0].match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        result.plan_scale = `${numbers[0]}:${numbers[1]}`;
        break;
      }
    }
  }

  // ============================================================
  // 11. ESTIMATE WALL LENGTH FROM FLOOR AREA
  // ============================================================
  if (result.floor_area > 0) {
    const perimeter = 4 * Math.sqrt(result.floor_area);
    result.wall_length = Math.round(perimeter * 1.2 * 10) / 10;
    result.red_wall_length = result.wall_length;
    result.green_concrete_area = result.floor_area;
    result.yellow_timber_length = Math.round(result.floor_area * 0.4 * 10) / 10;
  }

  // ============================================================
  // 12. EXTRACT COLOR-CODED ELEMENTS FROM NOTES
  // ============================================================
  // Check for red walls
  if (text.match(/red\s*(?:wall|brick|masonry)/i)) {
    result.red_wall_length = result.wall_length || 50;
  }

  // Check for green concrete
  if (text.match(/green\s*(?:concrete|slab|floor)/i)) {
    result.green_concrete_area = result.floor_area || 80;
  }

  // Check for brown sewer
  if (text.match(/brown\s*(?:sewer|drain|pipe)/i)) {
    result.brown_sewer_length = Math.round(result.floor_area * 0.15 * 10) / 10;
  }

  // Check for blue water
  if (text.match(/blue\s*(?:water|pipe|plumbing)/i)) {
    result.blue_water_length = Math.round(result.floor_area * 0.2 * 10) / 10;
  }

  // ============================================================
  // 13. DEFAULT VALUES IF NOTHING DETECTED
  // ============================================================
  if (result.rooms === 0) result.rooms = 3;
  if (result.doors === 0) result.doors = 3;
  if (result.windows === 0) result.windows = 2;
  if (result.floor_area === 0) result.floor_area = 80;
  if (result.wall_length === 0) result.wall_length = 50;

  console.log('📊 Parsed plan data:', result);
  return result;
                                }
