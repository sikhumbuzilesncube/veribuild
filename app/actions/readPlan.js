'use server';

import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function readPlan(projectId, fileUrl) {
  try {
    if (!projectId || !fileUrl) {
      return { success: false, error: 'Missing projectId or fileUrl' };
    }

    // Only attempt PDF text extraction. Image files (JPEG, PNG) are skipped
    // because they require OCR, which is deferred to a later phase.
    const lowerUrl = fileUrl.toLowerCase();
    if (!lowerUrl.endsWith('.pdf')) {
      return {
        success: false,
        error: 'Non-PDF plan uploaded. Manual entry required.',
        data: null,
      };
    }

    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Real PDF text extraction
    let pdfData;
    try {
      pdfData = await pdf(buffer);
    } catch (pdfErr) {
      console.error('PDF parse error:', pdfErr);
      return {
        success: false,
        error: 'Unable to extract text from PDF. Plan may be scanned or image-based.',
        data: null,
      };
    }

    const text = pdfData.text || '';

    // Extract window codes
    const windowPattern = /\b(PTT?\d{2,4}|PSS?\d{2,4}|HS\d{2,4}|NCT[0-9xS]+|TD\d+[0-9S]*|SL\d+[0-9S]*|NE[1x7]*\d*|NS\d{1,3}[A-Z]?|N\d{1,3})\b/gi;
    const windowMatches = text.match(windowPattern) || [];
    const windowCodes = [...new Set(windowMatches.map((w) => w.toUpperCase()))];

    // Extract door codes
    const doorPattern = /\b(D[1-9]|DD|FD\d|PD\d|SD\d{4})\b/gi;
    const doorMatches = text.match(doorPattern) || [];
    const doorCodes = [...new Set(doorMatches.map((d) => d.toUpperCase()))];

    // Extract room names
    const roomKeywords = [
      'lounge', 'kitchen', 'garage', 'bedroom', 'bathroom',
      'toilet', 'dining', 'study', 'office', 'store', 'passage',
    ];
    const foundRooms = [];
    for (const kw of roomKeywords) {
      const re = new RegExp('\\b' + kw + '\\b', 'gi');
      if (text.match(re)) {
        foundRooms.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    }

    // Extract dimensions in metres
    const dimPattern = /(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/g;
    const dims = [];
    let m;
    while ((m = dimPattern.exec(text)) !== null) {
      const w = parseFloat(m[1]);
      const l = parseFloat(m[2]);
      if (w > 0.5 && w < 50 && l > 0.5 && l < 50) {
        dims.push({ w, l });
      }
    }

    let area = 0;
    if (dims.length > 0) {
      for (const d of dims) area += d.w * d.l;
      area = Math.round(area * 10) / 10;
    }

    // Only write fields that were actually detected.
    // Fields left undefined retain whatever the user will enter manually.
    const updateData = {
      windows: windowCodes.length > 0 ? windowCodes.length : undefined,
      doors: doorCodes.length > 0 ? doorCodes.length : undefined,
      floor_area: area > 0 ? area : undefined,
      wall_length: area > 0 ? Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10 : undefined,
      room_labels: foundRooms.length > 0 ? foundRooms.join(', ') : undefined,
      window_details: windowCodes.length > 0 ? windowCodes.join(', ') : undefined,
      door_details: doorCodes.length > 0 ? doorCodes.join(', ') : undefined,
      notes: `Extracted from PDF: ${windowCodes.length} window codes, ${doorCodes.length} door codes, ${foundRooms.length} room labels, ${dims.length} dimensions`,
      status: 'processing',
    };

    // Strip undefined keys so we don't overwrite user data with nulls
    const cleanedUpdate = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) cleanedUpdate[key] = value;
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(cleanedUpdate)
      .eq('id', projectId);

    if (updateError) {
      console.error('Update error:', updateError);
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      data: cleanedUpdate,
      windowsFound: windowCodes.length,
      doorsFound: doorCodes.length,
      roomsFound: foundRooms,
      windowCodes,
      doorCodes,
      dimensionsFound: dims.length,
      message: `Extracted ${windowCodes.length} window codes, ${doorCodes.length} door codes, ${foundRooms.length} room labels`,
    };
  } catch (error) {
    console.error('readPlan error:', error);
    return { success: false, error: error.message };
  }
  }
