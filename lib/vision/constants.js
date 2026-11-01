// ============================================================
// YAKA AI VISION CONSTANTS
// Configuration for the Anthropic Claude API
// ============================================================

export const MODEL_ID = 'claude-sonnet-5-5';

export const MAX_TOKENS = 2000;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_COST_PER_PLAN_USD = 0.50;

// Confidence thresholds for filtering out bad data
export const CONFIDENCE_THRESHOLD = 0.6;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export default {
  MODEL_ID,
  MAX_TOKENS,
  MAX_FILE_SIZE_MB,
  MAX_COST_PER_PLAN_USD,
  CONFIDENCE_THRESHOLD,
  SUPPORTED_IMAGE_TYPES,
};
