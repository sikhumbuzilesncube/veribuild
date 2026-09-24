// ============================================================
// VERIBUILD VISION - CONSTANTS
// Shared configuration for the plan-reading vision layer
// No external dependencies. Pure data and pure functions.
// ============================================================

// ------------------------------------------------------------
// Cost and rate limits
// ------------------------------------------------------------
// Hard cap per plan upload, in USD. If estimated cost exceeds this,
// the vision call is aborted and the user is prompted for manual entry.
export const MAX_COST_PER_PLAN_USD = 0.50;

// Maximum pages sent to the vision model per plan.
// Pages 1 to this number are read. Later pages are skipped.
// This caps both cost and processing time.
export const MAX_PAGES_PER_PLAN = 3;

// PNG rendering resolution, dots per inch.
// 300 DPI is the standard for architectural drawings.
// Higher produces larger images with diminishing accuracy gains.
export const RENDER_DPI = 300;

// ------------------------------------------------------------
// Model configuration
// ------------------------------------------------------------
export const MODEL_ID = 'claude-sonnet-4-5-20250929';
export const MODEL_MAX_TOKENS = 4096;
export const MODEL_TEMPERATURE = 0.1; // low temperature for deterministic extraction

// ------------------------------------------------------------
// Confidence thresholds
// ------------------------------------------------------------
// Fields extracted with confidence at or above this value are
// written to the projects table. Below this, they are left blank
// and the user must enter them manually.
export const CONFIDENCE_MINIMUM = 0.70;

// At or above this, the field is shown as high-confidence (green).
export const CONFIDENCE_HIGH = 0.85;

// Between CONFIDENCE_MINIMUM and CONFIDENCE_HIGH, shown as medium (yellow).
// Below CONFIDENCE_MINIMUM, shown as not-detected (grey).

// ------------------------------------------------------------
// Plausibility limits
// Values outside these ranges are rejected even if the model reports
// high confidence. Matches the limits in app/actions/readPlan.js.
// ------------------------------------------------------------
export const LIMITS = {
  floorArea: { min: 20, max: 500 },     // square metres
  wallLength: { min: 15, max: 400 },    // metres
  rooms: { min: 1, max: 40 },
  doors: { min: 1, max: 80 },
  windows: { min: 1, max: 80 },
  foundationDepth: { min: 0.3, max: 4.0 },  // metres
};

// ------------------------------------------------------------
// Cost estimation
// Used to enforce the per-plan cap before making the API call.
// Rates are in USD per 1 million tokens.
// Update these when Anthropic changes pricing.
// ------------------------------------------------------------
export const RATES_USD_PER_MTOKEN = {
  input: 3.00,       // $3.00 per 1M input tokens (Sonnet 4.5)
  output: 15.00,     // $15.00 per 1M output tokens (Sonnet 4.5)
};

// ------------------------------------------------------------
// Vision-layer project status values
// These are written to the projects.status column.
// ------------------------------------------------------------
export const VISION_STATUS = {
  NOT_STARTED: 'vision_pending',
  IN_PROGRESS: 'vision_processing',
  SUCCEEDED: 'vision_succeeded',
  PARTIAL: 'vision_partial',
  FAILED: 'vision_failed',
};

// ------------------------------------------------------------
// readMethod values (kept consistent with existing readPlan.js)
// ------------------------------------------------------------
export const READ_METHOD = {
  TEXT_EXTRACTION: 'text-extraction',      // pdf-parse worked
  VISION_EXTRACTION: 'vision-extraction',  // Claude vision worked
  RASTER_PDF: 'raster-pdf',                // PDF is an image
  UNSUPPORTED_FILE_TYPE: 'unsupported-file-type',
  FETCH_FAILED: 'fetch-failed',
  SAVE_FAILED: 'save-failed',
  ERROR: 'error',
  NONE: 'none',
};

// ------------------------------------------------------------
// Helper: check whether a value is within the plausibility range
// ------------------------------------------------------------
export function isPlausible(field, value) {
  if (value === null || value === undefined) return false;
  const numeric = Number(value);
  if (isNaN(numeric)) return false;
  const limit = LIMITS[field];
  if (!limit) return true;
  return numeric >= limit.min && numeric <= limit.max;
}

// ------------------------------------------------------------
// Helper: estimate the cost of a vision call
// Tokens are approximate; this is a pre-flight check.
// ------------------------------------------------------------
export function estimateCostUsd(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * RATES_USD_PER_MTOKEN.input;
  const outputCost = (outputTokens / 1_000_000) * RATES_USD_PER_MTOKEN.output;
  return inputCost + outputCost;
}

export default {
  MAX_COST_PER_PLAN_USD,
  MAX_PAGES_PER_PLAN,
  RENDER_DPI,
  MODEL_ID,
  MODEL_MAX_TOKENS,
  MODEL_TEMPERATURE,
  CONFIDENCE_MINIMUM,
  CONFIDENCE_HIGH,
  LIMITS,
  RATES_USD_PER_MTOKEN,
  VISION_STATUS,
  READ_METHOD,
  isPlausible,
  estimateCostUsd,
};
