'use server';

import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';
import { readPlanImage } from '@/lib/vision/readPlanImage';

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

    // ----------------------------------------------------------
    // Step 1: try text extraction (fast, free for vector PDFs)
    // ----------------------------------------------------------
    let extractedText = '';
    let textExtractionWorked = false;

    try {
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text || '';
      const meaningfulText = extractedText.replace(/[\s\d\W]/g, '').length;
      textExtractionWorked = meaningfulText >= 50;
    } catch (pdfErr) {
      console.warn('pdf-parse failed, will try vision:', pdfErr.message);
    }

    if (textExtractionWorked) {
      const textResult = extractFromText(extractedText);
      if (textResult.success) {
        return await saveAndReturn(projectId, textResult, 'text-extraction');
      }
      // Text was readable but no measurements identified.
      // Fall through to vision for a second attempt.
    }

    // ----------------------------------------------------------
    // Step 2: vision path (raster PDFs, or text without measurements)
    // ----------------------------------------------------------
    const visionResult = await readPlanImage(buffer);

    if (!visionResult.success) {
      result.error = visionResult.error || 'Vision extraction failed.';
      result.notes = `Vision attempt did not produce measurements. Manual entry required.`;
      result.readMethod = visionResult.readMethod || 'raster-pdf';
      await writeStatus(projectId, result);
      return result;
    }

    return await saveAndReturn(projectId, visionResult, 'vision-extraction');
  } catch (error) {
    console.error('readPlan error:', error);
    result.error = error.message || 'Unknown error';
    result.notes = 'Unexpected error during plan reading.';
    result.readMethod = 'error';
    await writeStatus(projectId, result);
    return result;
  }
}

function extractFromText(text) {
  const result = {
    success: false,
    fields: {},
    notes: '',
    windowsFound: 0,
    doorsFound: 0,
    roomsFound: [],
    dimensionsFound: 0,
  };

  const windowPattern =
    /\b(PTT?\d{2,4}|PSS?\d{2,4}|HS\d{2,4}|NCT[0-9xS]+|TD\d+[0-9S]*|SL\d+[0-9S]*|NE[1x7]*\d*|NS\d{1,3}[A-Z]?|N\d{1,3})\b/gi;
  const windowMatches = text.match(windowPattern) || [];
  const windowCodes = [...new Set(windowMatches.map((w) => w.toUpperCase()))];

  const doorPattern = /\b(D[1-9]|DD|FD\d|PD\d|SD\d{4})\b/gi;
  const doorMatches = text.match(doorPattern) || [];
  const doorCodes = [...new Set(doorMatches.map((d) => d.toUpperCase()))];

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

  const fields = {};

  if (windowCodes.length >= LIMITS.windows.min && windowCodes.length <= LIMITS.windows.max) {
    fields.windows = windowCodes.length;
    fields.window_details = windowCodes.join(', ');
  }
  if (doorCodes.length >= LIMITS.doors.min && doorCodes.length <= LIMITS.doors.max) {
    fields.doors = doorCodes.length;
    fields.door_details = doorCodes.join(', ');
  }
  if (foundRooms.length >= LIMITS.rooms.min && foundRooms.length <= LIMITS.rooms.max) {
    fields.rooms = foundRooms.length;
    fields.room_labels = foundRooms.join(', ');
  }
  if (area >= LIMITS.floorArea.min && area <= LIMITS.floorArea.max) {
    fields.floor_area = area;
    const wallLength = Math.round(4 * Math.sqrt(area) * 1.2 * 10) / 10;
    if (wallLength >= LIMITS.wallLength.min && wallLength <= LIMITS.wallLength.max) {
      fields.wall_length = wallLength;
    }
  }

  const count = Object.keys(fields).length;
  if (count === 0) return result;

  fields.notes = `Extracted from PDF text: ${windowCodes.length} window codes, ${doorCodes.length} door codes, ${foundRooms.length} room labels, ${dims.length} dimensions, area ${area || 'not computed'} m2`;
  fields.status = 'processing';

  result.success = true;
  result.fields = fields;
  result.notes = fields.notes;
  result.windowsFound = windowCodes.length;
  result.doorsFound = doorCodes.length;
  result.roomsFound = foundRooms;
  result.dimensionsFound = dims.length;

  return result;
}

async function saveAndReturn(projectId, extraction, readMethod) {
  const { error: updateError } = await supabase
    .from('projects')
    .update(extraction.fields)
    .eq('id', projectId);

  if (updateError) {
    console.error('Failed to save extraction:', updateError);
    return {
      success: false,
      readMethod: 'save-failed',
      error: 'Failed to save extracted measurements',
      notes: updateError.message,
      data: null,
    };
  }

  return {
    success: true,
    readMethod,
    error: null,
    data: extraction.fields,
    notes: extraction.fields.notes,
    windowsFound: extraction.windowsFound || 0,
    doorsFound: extraction.doorsFound || 0,
    roomsFound: extraction.roomsFound || [],
    dimensionsFound: extraction.dimensionsFound || 0,
    usage: extraction.usage || null,
  };
}

async function writeStatus(projectId, result) {
  if (!projectId) return;

  const note = result.notes || result.error || 'Plan reading did not produce measurements.';

  try {
    await supabase
      .from('projects')
      .update({ notes: note, status: 'processing' })
      .eq('id', projectId);
  } catch (err) {
    console.error('Failed to write read status:', err);
  }
        }
