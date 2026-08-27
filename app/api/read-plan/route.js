import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    console.log('📄 ===== READ PLAN API CALLED =====');
    
    const { projectId, fileUrl } = await request.json();
    console.log('📄 Project ID:', projectId);
    console.log('📄 File URL:', fileUrl);

    if (!projectId || !fileUrl) {
      return NextResponse.json({ error: 'Missing projectId or fileUrl' }, { status: 400 });
    }

    // Fetch the PDF with timeout
    console.log('📄 Fetching PDF...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(fileUrl, { signal: controller.signal });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', fetchError.message);
      // Continue without PDF reading - user can manually enter data
      return NextResponse.json({ 
        success: false, 
        error: 'Could not fetch PDF',
        fallback: true 
      });
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ Fetch failed with status:', response.status);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch PDF: ${response.status}`,
        fallback: true 
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    console.log('📄 PDF fetched, size:', pdfBuffer.length);

    // Try to extract text from PDF
    console.log('📄 Extracting text from PDF...');
    let text = '';
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(pdfBuffer);
      text = data.text;
      console.log('📄 Extracted text length:', text.length);
    } catch (parseError) {
      console.error('❌ PDF parse error:', parseError.message);
      // Continue without PDF reading
      return NextResponse.json({ 
        success: false, 
        error: 'Could not parse PDF',
        fallback: true 
      });
    }

    // If text is empty, return fallback
    if (!text || text.length < 10) {
      console.log('📄 No text extracted from PDF');
      return NextResponse.json({ 
        success: false, 
        error: 'No text found in PDF',
        fallback: true 
      });
    }

    // Count windows
    let windowCount = 0;
    const windowMatches = text.match(/window/gi);
    if (windowMatches) {
      windowCount = windowMatches.length;
    }
    console.log('📄 Window count from text:', windowCount);

    // Count doors
    let doorCount = 0;
    const doorMatches = text.match(/door/gi);
    if (doorMatches) {
      doorCount = doorMatches.length;
    }
    console.log('📄 Door count from text:', doorCount);

    // Find room names
    const roomKeywords = ['lounge', 'kitchen', 'garage', 'bedroom', 'bathroom', 'toilet', 'dining', 'study', 'office'];
    const foundRooms = [];
    for (const keyword of roomKeywords) {
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      if (text.match(regex)) {
        foundRooms.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
    console.log('📄 Found rooms:', foundRooms);

    // Find dimensions
    const dimPattern = /(\d+\.?\d*)\s*[mM]\s*[xX×]\s*(\d+\.?\d*)\s*[mM]/g;
    let dims = [];
    let match;
    while ((match = dimPattern.exec(text)) !== null) {
      dims.push({ w: parseFloat(match[1]), l: parseFloat(match[2]) });
    }
    console.log('📄 Found dimensions:', dims);

    // Calculate area from dimensions
    let area = 0;
    if (dims.length > 0) {
      for (const d of dims) {
        area += d.w * d.l;
      }
      area = Math.round(area * 10) / 10;
    }
    console.log('📄 Calculated area:', area);

    // Prepare update data
    const updateData = {
      windows: windowCount > 0 ? Math.min(windowCount, 20) : 2,
      doors: doorCount > 0 ? Math.min(doorCount, 20) : 3,
      room_labels: foundRooms.length > 0 ? foundRooms.join(', ') : 'Lounge, Kitchen, Garage, Bedroom, Bathroom',
      floor_area: area > 0 ? area : 85,
      wall_length: area > 0 ? Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10 : 63,
      window_details: text.substring(0, 500),
      notes: text.substring(0, 1000),
      status: 'processing',
    };

    console.log('📄 Update data:', updateData);

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
      message: 'Plan read successfully'
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
