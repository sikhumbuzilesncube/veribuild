import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdfParse from 'pdf-parse';

export async function POST(request) {
  try {
    console.log('📄 ===== READ PLAN API CALLED =====');
    
    const { projectId, fileUrl } = await request.json();
    console.log('📄 Project ID:', projectId);
    console.log('📄 File URL:', fileUrl);

    if (!projectId || !fileUrl) {
      console.log('❌ Missing projectId or fileUrl');
      return NextResponse.json({ error: 'Missing projectId or fileUrl' }, { status: 400 });
    }

    // Fetch the PDF
    console.log('📄 Fetching PDF...');
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    console.log('📄 PDF fetched, size:', pdfBuffer.length);

    // Extract text using pdf-parse
    console.log('📄 Extracting text with pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    console.log('📄 Extracted text length:', text.length);
    console.log('📄 First 500 chars:', text.substring(0, 500));

    // Count windows in the text
    let windowCount = 0;
    const windowMatches = text.match(/window/gi);
    if (windowMatches) {
      windowCount = windowMatches.length;
    }
    console.log('📄 Window count from text:', windowCount);

    // Count doors in the text
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

    // Prepare data to update
    const updateData = {
      windows: windowCount > 0 ? windowCount : 2,
      doors: doorCount > 0 ? doorCount : 3,
      room_labels: foundRooms.length > 0 ? foundRooms.join(', ') : 'Lounge, Kitchen, Garage, Bedroom, Bathroom',
      floor_area: area > 0 ? area : 85,
      wall_length: area > 0 ? Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10 : 63,
      window_details: text.substring(0, 1000),
      notes: text.substring(0, 2000),
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
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
