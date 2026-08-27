// ============================================================
// SYMBOL PATTERNS - Window and Door Symbol Detection
// ============================================================

export const windowSymbols = {
  'casement': {
    pattern: 'line with hinge',
    description: 'Casement window (opens outward)',
    detection: ['─┐', 'line with arc']
  },
  'sliding': {
    pattern: 'overlapping lines',
    description: 'Sliding window (horizontal)',
    detection: ['═══', 'parallel lines']
  },
  'fixed': {
    pattern: 'simple line',
    description: 'Fixed window (non-opening)',
    detection: ['───', 'simple rectangle']
  }
};

export const doorSymbols = {
  'single': {
    pattern: 'arc + line from hinge',
    description: 'Single door swing',
    detection: ['arc', 'line from wall']
  },
  'double': {
    pattern: 'two arcs from center',
    description: 'Double door swing',
    detection: ['two arcs', 'center hinge']
  },
  'sliding': {
    pattern: 'parallel lines',
    description: 'Sliding door',
    detection: ['parallel lines', 'track']
  },
  'bifold': {
    pattern: 'multiple panels folding',
    description: 'Bifold door',
    detection: ['multiple panels', 'folding']
  },
  'pocket': {
    pattern: 'line disappearing into wall',
    description: 'Pocket door',
    detection: ['line into wall', 'hidden']
  },
  'open': {
    pattern: 'no door, just opening',
    description: 'Open doorway',
    detection: ['gap', 'no door']
  }
};
