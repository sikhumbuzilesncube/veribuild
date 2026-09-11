'use server';

import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LIMITS = {
  floorArea: { min: 20, max: 500 },
  wallLength: { min: 15, max: 400 },
  rooms: { min: 1, max: 40 },
  doors: { min: 1, max: 80 },
  windows: { min: 1, max: 80 },
};

export async function readPlan(projectId, fileUrl) {
  const result = {
    success: false,
    readMethod: 'none',
    error: null,
    data: null,
    notes: '',
  };

  try {
    if (!projectId || !fileUrl) {
      result.error = 'Missing projectId or fileUrl';
      result.notes = 'Missing required parameters';
      await writeStatus(projectId, result);
      return result;
    }

    const lowerUrl = String(fileUrl).toLowerCase();

    // Only attempt PDF text extraction. Images are not supported yet.
    if (!lowerUrl.endsWith('.pdf')) {
      result.error = 'Non-PDF plan uploaded. Manual entry required.';
      result.notes = 'Automatic reading is only available for PDF plans at this time.';
      result.readMethod = 'unsupported-file-type';
      await writeStatus(projectId, result);
      return result;
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      result.error = 'Failed to fetch the uploaded file';
      result.notes = `File fetch returned status ${response.status}`;
      result.readMethod = 'fetch-failed';
      await writeStatus(projectId, result);
      return result;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;
    try {
      pdfData = await pdf(buffer);
    } catch (pdfErr) {
      console.error('pdf-parse error:', pdfErr);
      result.error = 'Unable to extract text from PDF. Plan may be scanned or image-based.';
      result.notes = 'The PDF does not contain extractable text. Manual entry required.';
      result.readMethod = 'raster-pdf';
      await writeStatus(projectId, result);
      return result;
    }

    const text = pdfData.text || '';
    const meaningfulText = text.replace(/[\s\d\W]/g, '').length;

    // If the extracted text is essentially empty, the PDF is a raster image
    // (scanned, or exported from CAD without a text layer).
    if (meaningfulText < 50) {
      result.error = 'PDF contains no readable text. Plan may be scanned or image-based.';
      result.notes = 'This type of plan requires manual entry. Automatic reading of scanned plans is planned for a future update.';
      result.readMethod = 'raster-pdf';
      await writeStatus(projectId, result);
      return result;
    }

    // ----------------------------------------------------------
    // Real text was extracted. Attempt measurement parsing.
    // ----------------------------------------------------------
    const cleaned = {};

    // Window codes
    const windowPattern = /\b(PTT?\d{2,4}|PSS?\d{2,4}|HS\d{2,4}|NCT[0-9xS]+|TD\d+[0-9S]*|SL\d+[0-9S]*|NE[1x7]*\d*|NS\d{1,3}[A-Z]?|N\d{1,3})\b/gi;
    const windowMatches = text.match(windowPattern) || [];
    const windowCodes = [...new Set(windowMatches.map((w) => w.toUpperCase()))];

    if (windowCodes.length >= LIMITS.windows.min && windowCodes.length <= LIMITS.windows.max) {
      cleaned.windows = windowCodes.length;
      cleaned.window_details = windowCodes.join(', ');
    }

    // Door codes
    const doorPattern = /\b(D[1-9]|DD|FD\d|PD\d|SD\d{4})\b/gi;
    const doorMatches = text.match(doorPattern) || [];
    const doorCodes = [...new Set(doorMatches.map((d) => d.toUpperCase()))];

    if (doorCodes.length >= LIMITS.doors.min && doorCodes.length <= LIMITS.doors.max) {
      cleaned.doors = doorCodes.length;
      cleaned.door_details = doorCodes.join(', ');
    }

    // Room labels
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
      cleaned.rooms = foundRooms.length;
      cleaned.room_labels = foundRooms.join(', ');
    }

    // Dimensions
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

    if (area >= LIMITS.floorArea.min && area <= LIMITS.floorArea.max) {
      cleaned.floor_area = area;
      const wallLength = Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10;
      if (wallLength >= LIMITS.wallLength.min && wallLength <= LIMITS.wallLength.max) {
        cleaned.wall_length = wallLength;
      }
    }

    // ----------------------------------------------------------
    // Determine outcome
    // ----------------------------------------------------------
    const fieldsExtracted = Object.keys(cleaned).length;

    if (fieldsExtracted === 0) {
      result.error = 'Text was found in the PDF but no measurements could be identified.';
      result.notes = 'The plan may use non-standard notation. Manual entry required.';
      result.readMethod = 'text-without-measurements';
      await writeStatus(projectId, result);
      return result;
    }

    // At least some fields were extracted. Write them.
    cleaned.notes = `Extracted from PDF: ${windowCodes.length} window codes, ${doorCodes.length} door codes, ${foundRooms.length} room labels, ${dims.length} dimensions, area ${area || 'not computed'} m2`;
    cleaned.status = 'processing';

    const { error: updateError } = await supabase
      .from('projects')
      .update(cleaned)
      .eq('id', projectId);

    if (updateError) {
      result.error = 'Failed to save extracted measurements';
      result.notes = updateError.message;
      result.readMethod = 'save-failed';
      return result;
    }

    result.success = true;
    result.readMethod = 'text-extraction';
    result.data = cleaned;
    result.notes = cleaned.notes;
    result.windowsFound = windowCodes.length;
    result.doorsFound = doorCodes.length;
    result.roomsFound = foundRooms;
    result.dimensionsFound = dims.length;
    result.areaExtracted = area || 0;
    return result;
  } catch (error) {
    console.error('readPlan error:', error);
    result.error = error.message || 'Unknown error';
    result.notes = 'Unexpected error during plan reading.';
    result.readMethod = 'error';
    await writeStatus(projectId, result);
    return result;
  }
}

// Writes a status note to the project row so the verify page can detect
// that no automatic reading happened and prompt for manual entry.
async function writeStatus(projectId, result) {
  if (!projectId) return;

  const note = result.notes || result.error || 'Plan reading did not produce measurements.';

  try {
    await supabase
      .from('projects')
      .update({
        notes: note,
        status: 'processing',
      })
      .eq('id', projectId);
  } catch (err) {
    console.error('Failed to write read status:', err);
  }
}
