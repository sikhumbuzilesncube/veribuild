// ============================================================
// VERIBUILD BOQ ENGINE - WINDOW AND DOOR CODE DECODERS
// Zimbabwe standard steel and aluminium window codes
// Dimensions in millimetres
// ============================================================

// Standard window codes with known dimensions
export const WINDOW_CODES = {
  // PT series - top hung, single vent
  PT66:   { h: 600,  w: 600,  type: 'top-hung',  vents: 1, category: 'PT Series' },
  PT99:   { h: 900,  w: 900,  type: 'top-hung',  vents: 1, category: 'PT Series' },
  PT129:  { h: 1200, w: 900,  type: 'top-hung',  vents: 1, category: 'PT Series' },
  PT1212: { h: 1200, w: 1200, type: 'top-hung',  vents: 1, category: 'PT Series' },
  PT1515: { h: 1500, w: 1500, type: 'top-hung',  vents: 1, category: 'PT Series' },
  // PTT series - top hung, two vents
  PTT1212: { h: 1200, w: 1200, type: 'top-hung', vents: 2, category: 'PT Series' },
  PTT1515: { h: 1500, w: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
  PTT915:  { h: 900,  w: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
  // PS series - side hung
  PS69:    { h: 600,  w: 900,  type: 'side-hung', vents: 1, category: 'PS Series' },
  PS1212:  { h: 1200, w: 1200, type: 'side-hung', vents: 1, category: 'PS Series' },
  PSS1212: { h: 1200, w: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
  PSS1512: { h: 1500, w: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
  // HS series - horizontal sliding
  HS1212:  { h: 1200, w: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
  HS1512:  { h: 1500, w: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
  HS1812:  { h: 1800, w: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
  HS2415:  { h: 2400, w: 1500, type: 'sliding', vents: 1, category: 'HS Series' },
};

// Awning type residential steel windows
// Dimensions taken from catalogue where known; placeholders where pending
export const WINDOW_CODES_AWNING = {
  // NE series
  NE1:    { h: 654,  w: 533,  type: 'awning', category: 'NE Series', placeholder: true },
  NEx7:   { h: 654,  w: 1022, type: 'awning', category: 'NE Series', placeholder: true },
  NEx75:  { h: 654,  w: 1511, type: 'awning', category: 'NE Series', placeholder: true },
  NEx78:  { h: 654,  w: 2000, type: 'awning', category: 'NE Series', placeholder: true },
  NEx79:  { h: 654,  w: 2489, type: 'awning', category: 'NE Series', placeholder: true },
  NEx787: { h: 654,  w: 2978, type: 'awning', category: 'NE Series', placeholder: true },

  // NCT series
  NCT1S:     { h: 949, w: 533,  type: 'awning', category: 'NCT Series', placeholder: true },
  NCTx7S:    { h: 949, w: 1022, type: 'awning', category: 'NCT Series', placeholder: true },
  NCTx7S5S:  { h: 949, w: 1511, type: 'awning', category: 'NCT Series', placeholder: true },
  NCTx7S8:   { h: 949, w: 2000, type: 'awning', category: 'NCT Series', placeholder: true },
  NCTx7S9:   { h: 949, w: 2489, type: 'awning', category: 'NCT Series', placeholder: true },
  NCTx7S88:  { h: 949, w: 2978, type: 'awning', category: 'NCT Series', placeholder: true },
  NCT2S:     { h: 949, w: 533,  type: 'awning', category: 'NCT Series', placeholder: true },
  NCT1S51S:  { h: 949, w: 1022, type: 'awning', category: 'NCT Series', placeholder: true },
  NCT1S81S:  { h: 949, w: 1511, type: 'awning', category: 'NCT Series', placeholder: true },
  NCT1S91S:  { h: 949, w: 2000, type: 'awning', category: 'NCT Series', placeholder: true },
  NCTx7S87S: { h: 949, w: 2489, type: 'awning', category: 'NCT Series', placeholder: true },

  // TD series
  TD1:        { h: 1264, w: 533,  type: 'awning', category: 'TD Series', placeholder: true },
  TD7:        { h: 1264, w: 1022, type: 'awning', category: 'TD Series', placeholder: true },
  TD75:       { h: 1264, w: 1511, type: 'awning', category: 'TD Series', placeholder: true },
  TD78:       { h: 1264, w: 2000, type: 'awning', category: 'TD Series', placeholder: true },
  TD79:       { h: 1264, w: 2489, type: 'awning', category: 'TD Series', placeholder: true },
  TD787:      { h: 1264, w: 2978, type: 'awning', category: 'TD Series', placeholder: true },
  TD51S:      { h: 1559, w: 533,  type: 'awning', category: 'TD Series', placeholder: true },
  TD57S:      { h: 1559, w: 1022, type: 'awning', category: 'TD Series', placeholder: true },
  TD57S5S:    { h: 1559, w: 1511, type: 'awning', category: 'TD Series', placeholder: true },
  TD57S8:     { h: 1559, w: 2000, type: 'awning', category: 'TD Series', placeholder: true },
  TD57S9:     { h: 1559, w: 2489, type: 'awning', category: 'TD Series', placeholder: true },
  TD57S87S:   { h: 1559, w: 2978, type: 'awning', category: 'TD Series', placeholder: true },
  TD51S5S:    { h: 1559, w: 533,  type: 'awning', category: 'TD Series', placeholder: true },
  TD51S51S:   { h: 1559, w: 1022, type: 'awning', category: 'TD Series', placeholder: true },
  TD51S81S:   { h: 1559, w: 1511, type: 'awning', category: 'TD Series', placeholder: true },
  TD51S91S:   { h: 1559, w: 2000, type: 'awning', category: 'TD Series', placeholder: true },
  TD51S81S8:  { h: 1559, w: 2489, type: 'awning', category: 'TD Series', placeholder: true },

  // TD6 series
  TD61:      { h: 1873, w: 533,  type: 'awning', category: 'TD6 Series', placeholder: true },
  TD67:      { h: 1873, w: 1022, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD675:     { h: 1873, w: 1511, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD678:     { h: 1873, w: 2000, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD679:     { h: 1873, w: 2489, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD6787:    { h: 1873, w: 2978, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD67S:     { h: 1873, w: 533,  type: 'awning', category: 'TD6 Series', placeholder: true },
  TD67S5S:   { h: 1873, w: 1022, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD67S8S:   { h: 1873, w: 1511, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD67S9S:   { h: 1873, w: 2000, type: 'awning', category: 'TD6 Series', placeholder: true },
  TD67S85S7S:{ h: 1873, w: 2489, type: 'awning', category: 'TD6 Series', placeholder: true },

  // SL7 series
  SL7S:    { h: 2134, w: 533,  type: 'awning', category: 'SL7 Series', placeholder: true },
  SL7S5S:  { h: 2134, w: 1022, type: 'awning', category: 'SL7 Series', placeholder: true },
  SL7S8:   { h: 2134, w: 1511, type: 'awning', category: 'SL7 Series', placeholder: true },
  SL7S9:   { h: 2134, w: 2000, type: 'awning', category: 'SL7 Series', placeholder: true },
  SL7S87S: { h: 2134, w: 2489, type: 'awning', category: 'SL7 Series', placeholder: true },
};

// Standard door codes
export const DOOR_CODES = {
  D1:  { leafW: 813,  leafH: 2032, type: 'single', category: 'Standard' },
  D2:  { leafW: 762,  leafH: 2032, type: 'single', category: 'Standard' },
  D3:  { leafW: 686,  leafH: 2032, type: 'single', category: 'Standard' },
  DD:  { leafW: 1626, leafH: 2032, type: 'double', category: 'Standard' },
  FD1: { leafW: 900,  leafH: 2100, type: 'fire',   category: 'Specialty' },
  PD1: { leafW: 1200, leafH: 2100, type: 'pivot',  category: 'Specialty' },
};

// Combined lookup used by the engine
export function decodeWindowCode(code) {
  if (!code) return null;
  const upper = String(code).toUpperCase().trim();

  if (WINDOW_CODES[upper]) {
    return { code: upper, ...WINDOW_CODES[upper] };
  }
  if (WINDOW_CODES_AWNING[upper]) {
    return { code: upper, ...WINDOW_CODES_AWNING[upper] };
  }

  // N-series steel windows - generic placeholder
  const nMatch = upper.match(/^N(\d{1,3})$/);
  if (nMatch) {
    return {
      code: upper,
      h: 303,
      w: 303,
      type: 'steel',
      vents: 1,
      category: 'Steel Window',
      isGeneric: true,
      placeholder: true,
    };
  }

  // NS-series steel windows - generic placeholder
  const nsMatch = upper.match(/^NS\d{1,3}[A-Z]?$/);
  if (nsMatch) {
    return {
      code: upper,
      h: 1200,
      w: 1200,
      type: 'steel',
      vents: 1,
      category: 'NS Series',
      isGeneric: true,
      placeholder: true,
    };
  }

  // Generic TYPE plus 2 digits height plus 2 digits width fallback
  const regexMatch = upper.match(/^([A-Z]+)(\d{2})(\d{2})$/);
  if (regexMatch) {
    const typeCode = regexMatch[1];
    const height = parseInt(regexMatch[2], 10) * 100;
    const width = parseInt(regexMatch[3], 10) * 100;
    let vents = 1;
    if (typeCode.includes('TT')) vents = 2;
    if (typeCode.includes('SS')) vents = 2;
    return {
      code: upper,
      h: height,
      w: width,
      type: typeCode.includes('HS') ? 'sliding'
          : typeCode.includes('PS') ? 'side-hung'
          : 'top-hung',
      vents,
      category: 'Custom',
      isCustom: true,
    };
  }

  return null;
}

export function decodeDoorCode(code) {
  if (!code) return null;
  const upper = String(code).toUpperCase().trim();
  if (DOOR_CODES[upper]) {
    return { code: upper, ...DOOR_CODES[upper] };
  }
  return null;
}

// Extract all window and door codes from a text string
// Example input: "PT1212, PT99, TD7, D1, D1, DD"
export function extractCodes(text) {
  if (!text) return { windows: {}, doors: {} };

  const windowRegex = /\b(PTT?\d{2,4}|PSS?\d{2,4}|HS\d{2,4}|NE[1x7]*\d*|NCT[0-9xS]+|TD\d+[0-9S]*|SL\d+[0-9S]*|NS\d{1,3}[A-Z]?|N\d{1,3})\b/gi;
  const doorRegex = /\b(D[1-9]|DD|FD\d|PD\d|SD\d{4})\b/gi;

  const windowMatches = text.match(windowRegex) || [];
  const doorMatches = text.match(doorRegex) || [];

  const windows = {};
  const doors = {};

  windowMatches.forEach((code) => {
    const upper = code.toUpperCase();
    windows[upper] = (windows[upper] || 0) + 1;
  });

  doorMatches.forEach((code) => {
    const upper = code.toUpperCase();
    doors[upper] = (doors[upper] || 0) + 1;
  });

  return { windows, doors };
  }
