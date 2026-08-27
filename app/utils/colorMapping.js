// ============================================================
// COLOR MAPPING - Plan Color Coding
// ============================================================

export const colorMapping = {
  'red': {
    element: 'Walls',
    material: 'Masonry/Blocks',
    description: 'Wall construction lines'
  },
  'green': {
    element: 'Concrete',
    material: 'Slab/Foundation',
    description: 'Concrete elements, slabs, foundations'
  },
  'yellow': {
    element: 'Timber',
    material: 'Timber structure',
    description: 'Timber elements, roof structure'
  },
  'brown': {
    element: 'Sewer',
    material: 'Sewer pipes',
    description: 'Sewer and drainage lines'
  },
  'blue': {
    element: 'Water',
    material: 'Water pipes',
    description: 'Water supply lines'
  }
};

export function getColorMeaning(color) {
  return colorMapping[color.toLowerCase()] || null;
  }
