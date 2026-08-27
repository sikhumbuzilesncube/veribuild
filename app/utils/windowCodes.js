// ============================================================
// WINDOW CODE DATABASE - SA Standards (AAAMSA)
// ============================================================

export const windowCodes = {
  // PT Series - Top Hung Windows
  'PT66': { height: 600, width: 600, type: 'top-hung', vents: 1, category: 'PT Series' },
  'PT99': { height: 900, width: 900, type: 'top-hung', vents: 1, category: 'PT Series' },
  'PT129': { height: 1200, width: 900, type: 'top-hung', vents: 1, category: 'PT Series' },
  'PT1212': { height: 1200, width: 1200, type: 'top-hung', vents: 1, category: 'PT Series' },
  'PT1515': { height: 1500, width: 1500, type: 'top-hung', vents: 1, category: 'PT Series' },
  'PTT1212': { height: 1200, width: 1200, type: 'top-hung', vents: 2, category: 'PT Series' },
  'PTT1515': { height: 1500, width: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
  'PTT915': { height: 900, width: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
  'P4T1815': { height: 1800, width: 1500, type: 'top-hung', vents: 4, category: 'PT Series' },
  
  // PS Series - Side Hung Windows
  'PS69': { height: 600, width: 900, type: 'side-hung', vents: 1, category: 'PS Series' },
  'PS1212': { height: 1200, width: 1200, type: 'side-hung', vents: 1, category: 'PS Series' },
  'PSS1212': { height: 1200, width: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
  'PSS1512': { height: 1500, width: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
  
  // HS Series - Horizontal Sliding Windows
  'HS1212': { height: 1200, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
  'HS1512': { height: 1500, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
  'HS1812': { height: 1800, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
  'HS2415': { height: 2400, width: 1500, type: 'sliding', vents: 1, category: 'HS Series' },
  'HS306': { height: 3000, width: 600, type: 'sliding', vents: 1, category: 'HS Series' },
};

export const steelWindowTypes = {
  'N1': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N2': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N3': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N4': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N5': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N6': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N7': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N8': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N9': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
  'N10': { height: 303, width: 303, type: 'steel', category: 'Steel Window' },
};

export function decodeWindowCode(code) {
  if (windowCodes[code]) {
    return windowCodes[code];
  }
  if (steelWindowTypes[code]) {
    return steelWindowTypes[code];
  }
  
  const match = code.match(/^([A-Z]+)(\d{2})(\d{2})$/);
  if (match) {
    const [, type, h, w] = match;
    const height = parseInt(h) * 100;
    const width = parseInt(w) * 100;
    let vents = 1;
    if (type.includes('TT')) vents = 2;
    if (type.includes('4T')) vents = 4;
    if (type.includes('SS')) vents = 2;
    
    return {
      height,
      width,
      type: type.includes('HS') ? 'sliding' : 
            type.includes('PS') ? 'side-hung' : 'top-hung',
      vents,
      category: 'Custom',
      isCustom: true
    };
  }
  
  return null;
}

export function calculateWindowArea(code) {
  const decoded = decodeWindowCode(code);
  if (!decoded) return 0;
  return (decoded.width / 1000) * (decoded.height / 1000);
             }
