// ============================================================
// VERIBUILD VISION - READ PLAN IMAGE
// Sends a plan image to Claude Sonnet 4.5 and parses the
// structured JSON response into clean measurement fields.
//
// NOTE: @anthropic-ai/sdk is NOT yet in package.json.
// This file uses a dynamic import so the build does not fail
// until Batch 3 adds the dependency. The function will throw
// a clear error if called before the SDK is installed.
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

// ------------------------------------------------------------
// Main entry point
// Sends one or more plan images to Claude and returns a
// normalised extraction object.
//
// @param {Buffer[]} imageBuffers - array of PNG buffers, one per page
// @returns {Promise<{
//   success: boolean,
//   readMethod: string,
//   error: string|null,
//   fields: object,          // ready to write into projects table
//   raw: object|null,        // raw model response for debugging
//   usage: object,           // token and cost info
// }>}
// ------------------------------------------------------------
export async function readPlanImage(imageBuffers) {
  const result = {
    success: false,
    readMethod: READ_METHOD.NONE,
    error: null,
    fields: {},
    raw: null,
    usage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
  };

  try {
    if (!Array.isArray(imageBuffers) || imageBuffers.length === 0) {
      result.error = 'No images provided to readPlanImage';
      return result;
    }

    // Pre-flight cost estimate. Reject if the request would exceed
    // the per-plan cap. This protects against runaway costs from
    // unusually large or numerous images.
    const preflightTokens = estimateInputTokens(imageBuffers);
    const estimatedCost = estimateCost(preflightTokens, MODEL_MAX_TOKENS);

    if (estimatedCost > MAX_COST_PER_PLAN_USD) {
      result.error = `Estimated cost $${estimatedCost.toFixed(2)} exceeds per-plan cap of $${MAX_COST_PER_PLAN_USD.toFixed(2)}`;
      result.usage.inputTokens = preflightTokens;
      return result;
    }

    // Load the SDK dynamically so Batch 2 can be deployed before
    // Batch 3 installs the package.
    let Anthropic;
    try {
      const mod = await import('@anthropic-ai/sdk');
      Anthropic = mod.default;
    } catch (err) {
      if (String(err.message || '').includes('Cannot find module')) {
        result.error =
          '@anthropic-ai/sdk is not installed. Add it to package.json before using the vision layer.';
        return result;
      }
      throw err;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      result.error = 'ANTHROPIC_API_KEY is not set in environment variables';
      return result;
    }

    const client = new Anthropic({ apiKey });

    // Build the content blocks: images first, then the user prompt.
    const content = [];
    for (const buf of imageBuffers) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: buf.toString('base64'),
        },
      });
    }
    content.push({ type: 'text', text: USER_PROMPT });

    // First attempt
    let response = await callClaude(client, content);

    // Retry once if the model returned non-JSON
    let parsed = tryParseJson(response.text);
    if (!parsed) {
      response = await callClaude(
        client,
        [...content, { type: 'text', text: RETRY_PROMPT }]
      );
      parsed = tryParseJson(response.text);
    }

    result.usage.inputTokens = response.usage.input_tokens || 0;
    result.usage.outputTokens = response.usage.output_tokens || 0;
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

    // Normalise the model's output into fields ready for the projects table.
    const fields = normaliseExtraction(parsed);
    result.fields = fields;

    const extractedCount = countMeaningfulFields(fields);

    if (extractedCount === 0) {
      result.error = 'No usable measurements extracted from the image';
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

// ------------------------------------------------------------
// Call Claude with the given content blocks
// ------------------------------------------------------------
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

  return {
    text,
    usage: response.usage || {},
  };
}

// ------------------------------------------------------------
// Try to parse a response as JSON, tolerating common noise
// ------------------------------------------------------------
function tryParseJson(text) {
  if (!text) return null;

  let candidate = text.trim();

  // Strip markdown code fences if present
  if (candidate.startsWith('```')) {
    candidate = candidate.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }

  // Find the first { and last }
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

// ------------------------------------------------------------
// Normalise the model's output into projects-table-ready fields
// Only fields above the confidence threshold are kept.
// Values outside plausibility ranges are dropped.
// ------------------------------------------------------------
function normaliseExtraction(raw) {
  const fields = {};
  const notesParts = [];

  // Floor area
  if (passes(raw.floor_area, 'floorArea')) {
    fields.floor_area = round1(raw.floor_area.value);
    notesParts.push(`floor_area=${fields.floor_area} (conf ${fmt(raw.floor_area.confidence)})`);
  }

  // Wall length
  if (passes(raw.wall_length, 'wallLength')) {
    fields.wall_length = round1(raw.wall_length.value);
    notesParts.push(`wall_length=${fields.wall_length} (conf ${fmt(raw.wall_length.confidence)})`);
  }

  // Rooms
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

  // Doors
  if (raw.doors && raw.doors.count !== null && raw.doors.count !== undefined) {
    const conf = Number(raw.doors.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('doors', raw.doors.count)) {
      fields.doors = Math.round(raw.doors.count);
      notesParts.push(`doors=${fields.doors} (conf ${fmt(conf)})`);
    }
  }

  // Windows
  if (raw.windows && raw.windows.count !== null && raw.windows.count !== undefined) {
    const conf = Number(raw.windows.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('windows', raw.windows.count)) {
      fields.windows = Math.round(raw.windows.count);
      notesParts.push(`windows=${fields.windows} (conf ${fmt(conf)})`);
    }
  }

  // Foundation depth
  if (passes(raw.foundation_depth, 'foundationDepth')) {
    fields.foundation_depth = round2(raw.foundation_depth.value);
    notesParts.push(
      `foundation_depth=${fields.foundation_depth} (conf ${fmt(raw.foundation_depth.confidence)})`
    );
  }

  // Wall thickness
  if (raw.wall_thickness && raw.wall_thickness.value) {
    const conf = Number(raw.wall_thickness.confidence) || 0;
    const value = Number(raw.wall_thickness.value);
    if (conf >= CONFIDENCE_MINIMUM && (value === 115 || value === 230)) {
      // Not written to projects table (column does not exist), stored in notes only
      notesParts.push(`wall_thickness=${value}mm (conf ${fmt(conf)})`);
    }
  }

  // Door codes
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

  // Window codes
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

  // Plan notes
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

  // Overall confidence recorded in notes
  if (raw.overall_confidence && raw.overall_confidence.value !== undefined) {
    notesParts.push(`overall=${fmt(raw.overall_confidence.value)}`);
  }

  fields.notes = `Extracted from PDF via vision: ${notesParts.join(', ')}`;
  fields.status = 'processing';

  return fields;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Pre-flight token estimate for images
// Anthropic counts image tokens as approximately (w*h)/750.
// We add a fixed allowance for the prompt text.
// ------------------------------------------------------------
function estimateInputTokens(imageBuffers) {
  let total = 800; // prompt text allowance
  for (const buf of imageBuffers) {
    if (buf.length < 24) continue;
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    total += Math.ceil((width * height) / 750);
  }
  return total;
}

function estimateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * RATES_USD_PER_MTOKEN.input;
  const outputCost = (outputTokens / 1_000_000) * RATES_USD_PER_MTOKEN.output;
  return inputCost + outputCost;
}

export default { readPlanImage };
