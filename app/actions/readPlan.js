'use server';

import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Plausible ranges for residential / small commercial projects in Zimbabwe
const LIMITS = {
  floorArea: { min: 20, max: 500 },   // m2
  wallLength: { min: 15, max: 400 },  // m
  rooms: { min: 1, max: 40 },
  doors: { min: 1, max: 80 },
  windows: { min: 1, max: 80 },
};

export async function readPlan(projectId, fileUrl) {
  try {
    if (!projectId || !fileUrl) {
      return { success: false, error: 'Missing projectId or fileUrl' };
    }

    const lowerUrl = String(fileUrl).toLowerCase();
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
    const cleanedUpdate = {};

    // ----------------------------------------------------------
    // Window code extraction
    // ----------------------------------------------------------
    const windowPattern = /\b(PTT?\d{2,4}|PSS?\d{2,4}|HS\d{2,4}|NCT[0-9xS]+|TD\d+[0-9S]*|SL\d+[0-9S]*|NE[1x7]*\d*|NS\d{1,3}[A-Z]?|N\d{1,3})\b/gi;
    const windowMatches = text.match(windowPattern) || [];
    const windowCodes = [...new Set(windowMatches.map((w) => w.toUpperCase()))];

    if (windowCodes.length >= LIMITS.windows.min && windowCodes.length <= LIMITS.windows.max) {
      cleanedUpdate.windows = windowCodes.length;
      cleanedUpdate.window_details = windowCodes.join(', ');
    }

    // ----------------------------------------------------------
    // Door code extraction
    // ----------------------------------------------------------
    const doorPattern = /\b(D[1-9]|DD|FD\d|PD\d|SD\d{4})\b/gi;
    const doorMatches = text.match(doorPattern) || [];
    const doorCodes = [...new Set(doorMatches.map((d) => d.toUpperCase()))];

    if (doorCodes.length >= LIMITS.doors.min && doorCodes.length <= LIMITS.doors.max) {
      cleanedUpdate.doors = doorCodes.length;
      cleanedUpdate.door_details = doorCodes.join(', ');
    }

    // ----------------------------------------------------------
    // Room label extraction
    // ----------------------------------------------------------
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

    if (foundRooms.length >= LIMITS.rooms.min && foundRooms.length <= LIMITS.rooms.max) {
      cleanedUpdate.rooms = foundRooms.length;
      cleanedUpdate.room_labels = foundRooms.join(', ');
    }

    // ----------------------------------------------------------
    // Dimension extraction (reject implausible values)
    // ----------------------------------------------------------
    const dimPattern = /(\d+\.?\d*)\s*[xX\u00d7]\s*(\d+\.?\d*)/g;
    const dims = [];
    let m;
    while ((m = dimPattern.exec(text)) !== null) {
      const w = parseFloat(m[1]);
      const l = parseFloat(m[2]);
      if (w >= 0.5 && w <= 50 && l >= 0.5 && l <= 50) {
        dims.push({ w, l });
      }
    }

    let area = 0;
    if (dims.length > 0) {
      for (const d of dims) area += d.w * d.l;
      area = Math.round(area * 10) / 10;
    }

    // Reject implausible floor areas
    if (area >= LIMITS.floorArea.min && area <= LIMITS.floorArea.max) {
      cleanedUpdate.floor_area = area;

      // Estimate wall length from area
      const wallLength = Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10;
      if (wallLength >= LIMITS.wallLength.min && wallLength <= LIMITS.wallLength.max) {
        cleanedUpdate.wall_length = wallLength;
      }
    }

    // Always update notes and status
    cleanedUpdate.notes = `Extracted from PDF: ${windowCodes.length} window codes, ${doorCodes.length} door codes, ${foundRooms.length} room labels, ${dims.length} dimensions, area ${area || 'rejected'} m2`;
    cleanedUpdate.status = 'processing';

    if (Object.keys(cleanedUpdate).length <= 2) {
      // Only notes and status, no real extraction
      return {
        success: false,
        error: 'No reliable measurements extracted. Manual entry required.',
        data: null,
      };
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
      dimensionsFound: dims.length,
      areaExtracted: area || 0,
    };
  } catch (error) {
    console.error('readPlan error:', error);
    return { success: false, error: error.message };
  }
              }
