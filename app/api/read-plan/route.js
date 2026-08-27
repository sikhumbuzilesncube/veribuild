import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    console.log('📄 ===== READ PLAN API CALLED =====');
    
    const { projectId, fileUrl } = await request.json();
    console.log('📄 Project ID:', projectId);
    console.log('📄 File URL:', fileUrl);

    if (!projectId || !fileUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing projectId or fileUrl',
        fallback: true 
      });
    }

    // Fetch the PDF
    console.log('📄 Fetching PDF...');
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      console.error('❌ Fetch failed:', response.status);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch PDF: ${response.status}`,
        fallback: true 
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    console.log('📄 PDF fetched, size:', pdfBuffer.length);

    // Extract text from PDF
    console.log('📄 Extracting text...');
    let text = '';
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(pdfBuffer);
      text = data.text;
      console.log('📄 Extracted text length:', text.length);
      console.log('📄 First 300 chars:', text.substring(0, 300));
    } catch (parseError) {
      console.error('❌ PDF parse error:', parseError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Could not parse PDF',
        fallback: true 
      });
    }

    if (!text || text.length < 10) {
      console.log('📄 No text extracted');
      return NextResponse.json({ 
        success: false, 
        error: 'No text found in PDF',
        fallback: true 
      });
    }

    // ============================================================
    // COUNT WINDOWS
    // ============================================================
    // Look for patterns like "W1", "W2", "W3", "window", "WIN", etc.
    const windowPatterns = [
      /\bW\d+\b/gi,           // W1, W2, W3, etc.
      /window/gi,              // window, Windows
      /\bWIN\d+\b/gi,          // WIN1, WIN2, etc.
    ];
    
    let windowMatches = [];
    for (const pattern of windowPatterns) {
      const matches = text.match(pattern) || [];
      windowMatches = windowMatches.concat(matches);
    }
    
    // Count unique window numbers
    const uniqueWindows = new Set();
    for (const match of windowMatches) {
      const num = match.match(/\d+/);
      if (num) {
        uniqueWindows.add(parseInt(num[0]));
      } else {
        // If no number, count as 1
        uniqueWindows.add('_count');
      }
    }
    // Remove the '_count' placeholder if it exists
    const windowCount = uniqueWindows.has('_count') ? 
      windowMatches.length : 
      uniqueWindows.size;

    console.log('📄 Window patterns found:', windowMatches);
    console.log('📄 Unique windows count:', windowCount);

    // ============================================================
    // COUNT DOORS
    // ============================================================
    const doorPatterns = [
      /\bD\d+\b/gi,           // D1, D2, D3, etc.
      /door/gi,                // door, Doors
      /\bDOOR\d+\b/gi,         // DOOR1, DOOR2, etc.
    ];
    
    let doorMatches = [];
    for (const pattern of doorPatterns) {
      const matches = text.match(pattern) || [];
      doorMatches = doorMatches.concat(matches);
    }
    
    const uniqueDoors = new Set();
    for (const match of doorMatches) {
      const num = match.match(/\d+/);
      if (num) {
        uniqueDoors.add(parseInt(num[0]));
      } else {
        uniqueDoors.add('_count');
      }
    }
    const doorCount = uniqueDoors.has('_count') ? 
      doorMatches.length : 
      uniqueDoors.size;

    console.log('📄 Door patterns found:', doorMatches);
    console.log('📄 Unique doors count:', doorCount);

    // ============================================================
    // FIND ROOM NAMES
    // ============================================================
    const roomKeywords = [
      'lounge', 'kitchen', 'garage', 'bedroom', 'bathroom', 
      'toilet', 'dining', 'study', 'office', 'store', 'pantry',
      'laundry', 'porch', 'veranda', 'patio', 'living', 'family'
    ];
    
    const foundRooms = [];
    for (const keyword of roomKeywords) {
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      if (text.match(regex)) {
        foundRooms.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
    console.log('📄 Found rooms:', foundRooms);

    // ============================================================
    // FIND DIMENSIONS
    // ============================================================
    const dimPattern = /(\d+\.?\d*)\s*[mM]\s*[xX×]\s*(\d+\.?\d*)\s*[mM]/g;
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
    // FIND FOUNDATION NOTES
    // ============================================================
    let foundationType = 'strip';
    if (text.match(/raft/i)) foundationType = 'raft';
    else if (text.match(/piled/i)) foundationType = 'piled';
    else if (text.match(/pad/i)) foundationType = 'pad';
    console.log('📄 Foundation type:', foundationType);

    // ============================================================
    // PREPARE UPDATE DATA
    // ============================================================
    const updateData = {
      windows: windowCount > 0 ? windowCount : 2,
      doors: doorCount > 0 ? doorCount : 3,
      room_labels: foundRooms.length > 0 ? foundRooms.join(', ') : '',
      floor_area: area > 0 ? area : 0,
      wall_length: area > 0 ? Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10 : 0,
      window_details: text.substring(0, 500),
      notes: text.substring(0, 1000),
      foundation_type: foundationType,
      status: 'processing',
    };

    console.log('📄 UPDATE DATA:', updateData);

    // Update the project
    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update project',
        fallback: true 
      });
    }

    console.log('✅ Project updated successfully!');
    return NextResponse.json({
      success: true,
      data: updateData,
      message: 'Plan read successfully',
      windowsFound: windowCount,
      doorsFound: doorCount,
      roomsFound: foundRooms
    });

  } catch (error) {
    console.error('❌ Error in read-plan API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      fallback: true 
    });
  }
        }
