// ============================================================
// DOOR CODE DATABASE - Zimbabwe Standards
// ============================================================

export const doorCodes = {
  // Standard Single Doors
  'D1': { leafWidth: 813, leafHeight: 2032, frameWidth: 880, frameHeight: 2100, brickOpening: '900×2110', type: 'single', category: 'Standard' },
  'D2': { leafWidth: 762, leafHeight: 2032, frameWidth: 830, frameHeight: 2100, brickOpening: '850×2110', type: 'single', category: 'Standard' },
  
  // Double Doors
  'DD': { leafWidth: 1626, leafHeight: 2032, frameWidth: 1690, frameHeight: 2100, brickOpening: '1710×2110', type: 'double', category: 'Standard' },
  
  // Fire Doors
  'FD1': { leafWidth: 900, leafHeight: 2100, frameWidth: 970, frameHeight: 2170, brickOpening: '990×2180', type: 'fire', category: 'Specialty' },
  
  // Pivot Doors
  'PD1': { leafWidth: 1200, leafHeight: 2100, frameWidth: 1270, frameHeight: 2170, brickOpening: '1290×2180', type: 'pivot', category: 'Specialty' },
  
  // Sliding Doors (Patio)
  'SD1830': { leafWidth: 1830, leafHeight: 2135, frameWidth: 1900, frameHeight: 2200, brickOpening: '1920×2210', type: 'sliding', category: 'Patio' },
  'SD2135': { leafWidth: 2135, leafHeight: 2135, frameWidth: 2200, frameHeight: 2200, brickOpening: '2220×2210', type: 'sliding', category: 'Patio' },
  'SD3050': { leafWidth: 3050, leafHeight: 2135, frameWidth: 3120, frameHeight: 2200, brickOpening: '3140×2210', type: 'sliding', category: 'Patio' },
  
  // Fanlight Frames
  'FL1': { leafWidth: 880, leafHeight: 2600, frameWidth: 940, frameHeight: 2670, brickOpening: '960×2680', type: 'fanlight', category: 'Specialty' },
};

export function decodeDoorCode(code) {
  if (doorCodes[code]) {
    return doorCodes[code];
  }
  
  const match = code.match(/^D(\d+)$/);
  if (match) {
    return {
      leafWidth: 813,
      leafHeight: 2032,
      frameWidth: 880,
      frameHeight: 2100,
      brickOpening: '900×2110',
      type: 'single',
      category: 'Custom',
      isCustom: true
    };
  }
  
  return null;
          }
