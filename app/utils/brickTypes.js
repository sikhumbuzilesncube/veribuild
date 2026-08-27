// ============================================================
// BRICK TYPES - Zimbabwe Standards
// ============================================================

export const brickTypes = {
  'standard': {
    name: 'Standard Brick',
    size: '220 × 100 × 70 mm',
    unitsPerM2: 65,
    priceUSD: 0.35,
    use: 'Walls and general construction'
  },
  'cement_block': {
    name: 'Cement Block',
    size: '400 × 200 × 150 mm',
    unitsPerM2: 12.5,
    priceUSD: 1.80,
    use: 'Foundation and load-bearing walls'
  },
  'maxi_block': {
    name: 'Maxi Block',
    size: '500 × 200 × 150 mm',
    unitsPerM2: 10,
    priceUSD: 2.50,
    use: 'Large walls and foundations'
  },
  'paving_brick': {
    name: 'Paving Brick',
    size: '200 × 100 × 80 mm',
    unitsPerM2: 50,
    priceUSD: 0.80,
    use: 'Flooring and driveways'
  }
};

export function getBrickType(type) {
  return brickTypes[type] || brickTypes.standard;
    }
