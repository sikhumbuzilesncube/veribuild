// ============================================================
// VERIBUILD VISION - READ PLAN
// Sends a PDF or image directly to Claude Sonnet 4.5.
// ============================================================

import {
  MODEL_ID,
  MODEL_MAX_TOKENS,
  MODEL_TEMPERATURE,
  CONFIDENCE_MINIMUM,
  MAX_COST_PER_PLAN_USD,
  RATES_USD_PER_MTOKEN,
  READ_METHOD,
  isPlausible,
} from './constants.js';
import { SYSTEM_PROMPT, USER_PROMPT, RETRY_PROMPT } from './prompts.js';

const MAX_PDF_BYTES = 32 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SUPPORTED_MEDIA_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function readPlanImage(input, mediaType = 'application/pdf') {
  const result = {
    success: false,
    readMethod: READ_METHOD.NONE,
    error: null,
    fields: {},
    raw: null,
    usage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
  };

  try {
    if (!input || !Buffer.isBuffer(input)) {
      result.error = 'readPlanImage requires a file Buffer';
      return result;
    }

    if (!SUPPORTED_MEDIA_TYPES.includes(mediaType)) {
      result.error = `Unsupported media type: ${mediaType}.`;
      return result;
    }

    const isPdf = mediaType === 'application/pdf';
    const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;

    if (input.length > maxBytes) {
      const mb = (input.length / 1024 / 1024).toFixed(1);
      const limit = (maxBytes / 1024 / 1024).toFixed(0);
      result.error = `File is ${mb} MB, exceeds ${limit} MB limit`;
      return result;
    }

    const estimatedInputTokens = 800 + 3000 * 30;
    const preflightCost = estimateCost(estimatedInputTokens, MODEL_MAX_TOKENS);
    if (preflightCost > MAX_COST_PER_PLAN_USD) {
      result.error = `Estimated cost exceeds cap`;
      return result;
    }

    let Anthropic;
    try {
      const mod = await import('@anthropic-ai/sdk');
      Anthropic = mod.default;
    } catch (err) {
      if (String(err.message || '').includes('Cannot find module')) {
        result.error = '@anthropic-ai/sdk is not installed.';
        return result;
      }
      throw err;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      result.error = 'ANTHROPIC_API_KEY is not set';
      return result;
    }

    const client = new Anthropic({ apiKey });

    const mediaBlock = isPdf
      ? {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: input.toString('base64'),
          },
        }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: input.toString('base64'),
          },
        };

    const content = [mediaBlock, { type: 'text', text: USER_PROMPT }];

    let response = await callClaude(client, content);
    let parsed = tryParseJson(response.text);

    if (!parsed) {
      response = await callClaude(client, [
        ...content,
        { type: 'text', text: RETRY_PROMPT },
      ]);
      parsed = tryParseJson(response.text);
    }

    result.usage.inputTokens = response.usage?.input_tokens || 0;
    result.usage.outputTokens = response.usage?.output_tokens || 0;
    result.usage.estimatedCostUsd = estimateCost(
      result.usage.inputTokens,
      result.usage.outputTokens
    );

    if (!parsed) {
      result.error = 'Model did not return valid JSON after retry';
      result.raw = { text: response.text };
      return result;
    }

    result.raw = parsed;

    const fields = normaliseExtraction(parsed);
    result.fields = fields;

    const extractedCount = countMeaningfulFields(fields);
    if (extractedCount === 0) {
      result.error = 'No usable measurements extracted from the plan';
      result.readMethod = READ_METHOD.VISION_EXTRACTION;
      return result;
    }

    result.success = true;
    result.readMethod = READ_METHOD.VISION_EXTRACTION;
    return result;
  } catch (err) {
    console.error('readPlanImage error:', err);
    result.error = err.message || 'Unknown vision error';
    return result;
  }
}

async function callClaude(client, content) {
  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MODEL_MAX_TOKENS,
    temperature: MODEL_TEMPERATURE,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const text = textBlock ? textBlock.text : '';

  return { text, usage: response.usage || {} };
}

function tryParseJson(text) {
  if (!text) return null;

  let candidate = text.trim();

  if (candidate.startsWith('```')) {
    candidate = candidate.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  const jsonText = candidate.slice(start, end + 1);

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function normaliseExtraction(raw) {
  const fields = {};
  const notesParts = [];

  // ----------------------------------------------------------
  // Project name (extracted, written to notes only — readPlan.js
  // decides whether to write it to the projects table based on
  // whether the user already provided one)
  // ----------------------------------------------------------
  if (
    raw.project_name &&
    raw.project_name.value &&
    typeof raw.project_name.value === 'string'
  ) {
    const conf = Number(raw.project_name.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      const clean = raw.project_name.value.trim().slice(0, 120);
      fields.suggested_project_name = clean;
      notesParts.push(`project_name="${clean}" (conf ${fmt(conf)})`);
    }
  }

  // ----------------------------------------------------------
  // Floor area
  // ----------------------------------------------------------
  if (passes(raw.floor_area, 'floorArea')) {
    fields.floor_area = round1(raw.floor_area.value);
    notesParts.push(`floor_area=${fields.floor_area} (conf ${fmt(raw.floor_area.confidence)})`);
  }

  // ----------------------------------------------------------
  // Wall length
  // ----------------------------------------------------------
  if (passes(raw.wall_length, 'wallLength')) {
    fields.wall_length = round1(raw.wall_length.value);
    notesParts.push(`wall_length=${fields.wall_length} (conf ${fmt(raw.wall_length.confidence)})`);
  }

  // ----------------------------------------------------------
  // Fallbacks: derive one from the other when either is missing
  // ----------------------------------------------------------
  if (
    fields.floor_area === undefined &&
    fields.wall_length !== undefined &&
    fields.wall_length >= 15
  ) {
    const estimatedArea = round1(Math.pow(fields.wall_length / 4.8, 2));
    if (estimatedArea >= 20 && estimatedArea <= 500) {
      fields.floor_area = estimatedArea;
      notesParts.push(`floor_area=${estimatedArea} (estimated from perimeter)`);
    }
  }

  if (
    fields.wall_length === undefined &&
    fields.floor_area !== undefined &&
    fields.floor_area >= 20
  ) {
    const estimatedWallLength = round1(4 * Math.sqrt(fields.floor_area) * 1.15);
    if (estimatedWallLength >= 15 && estimatedWallLength <= 400) {
      fields.wall_length = estimatedWallLength;
      notesParts.push(`wall_length=${estimatedWallLength} (estimated from area)`);
    }
  }

  // ----------------------------------------------------------
  // Rooms
  // ----------------------------------------------------------
  if (raw.rooms && raw.rooms.count !== null && raw.rooms.count !== undefined) {
    const conf = Number(raw.rooms.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('rooms', raw.rooms.count)) {
      fields.rooms = Math.round(raw.rooms.count);
      if (Array.isArray(raw.rooms.labels) && raw.rooms.labels.length > 0) {
        fields.room_labels = raw.rooms.labels.join(', ');
      }
      notesParts.push(`rooms=${fields.rooms} (conf ${fmt(conf)})`);
    }
  }

  // ----------------------------------------------------------
  // Doors / windows
  // ----------------------------------------------------------
  if (raw.doors && raw.doors.count !== null && raw.doors.count !== undefined) {
    const conf = Number(raw.doors.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('doors', raw.doors.count)) {
      fields.doors = Math.round(raw.doors.count);
      notesParts.push(`doors=${fields.doors} (conf ${fmt(conf)})`);
    }
  }

  if (raw.windows && raw.windows.count !== null && raw.windows.count !== undefined) {
    const conf = Number(raw.windows.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('windows', raw.windows.count)) {
      fields.windows = Math.round(raw.windows.count);
      notesParts.push(`windows=${fields.windows} (conf ${fmt(conf)})`);
    }
  }

  // ----------------------------------------------------------
  // Foundation depth / wall thickness
  // ----------------------------------------------------------
  if (passes(raw.foundation_depth, 'foundationDepth')) {
    fields.foundation_depth = round2(raw.foundation_depth.value);
    notesParts.push(
      `foundation_depth=${fields.foundation_depth} (conf ${fmt(raw.foundation_depth.confidence)})`
    );
  }

  if (raw.wall_thickness && raw.wall_thickness.value) {
    const conf = Number(raw.wall_thickness.confidence) || 0;
    const value = Number(raw.wall_thickness.value);
    if (conf >= CONFIDENCE_MINIMUM && (value === 115 || value === 230)) {
      notesParts.push(`wall_thickness=${value}mm (conf ${fmt(conf)})`);
    }
  }

  // ----------------------------------------------------------
  // Door / window codes
  // ----------------------------------------------------------
  if (
    raw.door_codes &&
    Array.isArray(raw.door_codes.list) &&
    raw.door_codes.list.length > 0
  ) {
    const conf = Number(raw.door_codes.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      fields.door_details = raw.door_codes.list.join(', ');
      notesParts.push(`door_codes=${fields.door_details} (conf ${fmt(conf)})`);
    }
  }

  if (
    raw.window_codes &&
    Array.isArray(raw.window_codes.list) &&
    raw.window_codes.list.length > 0
  ) {
    const conf = Number(raw.window_codes.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      fields.window_details = raw.window_codes.list.join(', ');
      notesParts.push(`window_codes=${fields.window_details} (conf ${fmt(conf)})`);
    }
  }

  // ----------------------------------------------------------
  // Plan notes
  // ----------------------------------------------------------
  if (
    raw.plan_notes &&
    Array.isArray(raw.plan_notes.list) &&
    raw.plan_notes.list.length > 0
  ) {
    const conf = Number(raw.plan_notes.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      notesParts.push(`plan_notes="${raw.plan_notes.list.join(' | ')}"`);
    }
  }

  // ----------------------------------------------------------
  // Overall confidence
  // ----------------------------------------------------------
  if (raw.overall_confidence && raw.overall_confidence.value !== undefined) {
    notesParts.push(`overall=${fmt(raw.overall_confidence.value)}`);
  }

  fields.notes = `Extracted from PDF via vision: ${notesParts.join(', ')}`;
  fields.status = 'processing';

  return fields;
}

function passes(field, limitKey) {
  if (!field) return false;
  if (field.value === null || field.value === undefined) return false;
  const conf = Number(field.confidence) || 0;
  if (conf < CONFIDENCE_MINIMUM) return false;
  return isPlausible(limitKey, field.value);
}

function countMeaningfulFields(fields) {
  const meaningful = [
    'floor_area',
    'wall_length',
    'rooms',
    'doors',
    'windows',
    'foundation_depth',
    'door_details',
    'window_details',
  ];
  return meaningful.filter((k) => fields[k] !== undefined).length;
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function fmt(n) {
  const v = Number(n);
  return isNaN(v) ? '0.00' : v.toFixed(2);
}

function estimateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * RATES_USD_PER_MTOKEN.input;
  const outputCost = (outputTokens / 1_000_000) * RATES_USD_PER_MTOKEN.output;
  return inputCost + outputCost;
}

export default { readPlanImage };
