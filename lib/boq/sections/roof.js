// ============================================================
// VERIBUILD BOQ ENGINE - ROOF
// Trusses, purlins, battens, coverings, fascia, barge, gutters.
// When isRural is true, trusses and gutters are skipped:
// rural structures use a simple purlin-and-sheet roof with
// no rainwater disposal.
// ============================================================

import { PITCH_FACTOR, ROOF_COVERAGE, WASTE } from '../conversions.js';
import { round1, ceilNum, withWaste } from '../utils.js';

export function calcRoof(inputs, prices, isRural = false) {
  const items = [];

  const {
    floorArea, wallLength,
    roofType = 'IBR',
    roofPitch = 22.5,
  } = inputs;

  // ----------------------------------------------------------
  // C.1 Calculate roof plan area with pitch factor
  // ----------------------------------------------------------
  const pitchKey = Object.keys(PITCH_FACTOR)
    .map(Number)
    .reduce(
      (prev, curr) =>
        Math.abs(curr - roofPitch) < Math.abs(prev - roofPitch) ? curr : prev,
      15
    );
  const pitchMult = PITCH_FACTOR[pitchKey];
  const roofArea = floorArea * pitchMult;

  if (isRural) {
    // ----------------------------------------------------------
    // RURAL ROOF: purlins, sheets, fixings, ridge, barge, wall plate.
    // No trusses. No gutters. No downpipes.
    // ----------------------------------------------------------

    // Purlins: at 1.2m centres. Rural huts use fewer, simpler purlins.
    // Estimate: 4 purlin runs across a small roof at half the wall length
    const purlinSpacing = 1.2;
    const slopeLength = Math.sqrt(Math.pow(floorArea / wallLength, 2) + Math.pow(wallLength / 4, 2));
    const purlinsPerSlope = ceilNum((wallLength / 2) / purlinSpacing) + 1;
    const purlinLength = purlinsPerSlope * 2 * slopeLength;
    items.push({
      code: 'C.1',
      description: 'Sawn timber purlins 50 x 75mm at 1.2m centres, treated',
      unit: 'm',
      qty: round1(purlinLength * 1.05),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: 'purlins per slope * 2 slopes * slope length * 1.05',
    });

    // Roofing sheets
    if (roofType === 'IBR' || roofType === 'Chromadek') {
      const coverage = ROOF_COVERAGE[roofType];
      const sheetCount = ceilNum(roofArea / coverage.m2PerSheet);

      items.push({
        code: 'C.2',
        description: `Roof sheeting ${roofType}, 0.47mm thick, fixed to purlins`,
        unit: 'sheet',
        qty: sheetCount,
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea / ${coverage.m2PerSheet} m2 per sheet`,
      });

      items.push({
        code: 'C.2.1',
        description: 'Roofing screws, hook bolts and washers for roof sheeting',
        unit: 'nr',
        qty: ceilNum(roofArea * coverage.fixingsPerM2),
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea * ${coverage.fixingsPerM2} fixings per m2`,
        parentCode: 'C.2',
      });

      items.push({
        code: 'C.2.2',
        description: 'Ridge caps to roof sheeting',
        unit: 'm',
        qty: round1(roofArea * coverage.ridgeCapPerM2),
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea * ${coverage.ridgeCapPerM2} m per m2`,
        parentCode: 'C.2',
      });

      items.push({
        code: 'C.2.3',
        description: 'Barge boards to gable ends, 200 x 25mm, primed',
        unit: 'm',
        qty: round1(roofArea * coverage.bargeBoardPerM2),
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea * ${coverage.bargeBoardPerM2} m per m2`,
        parentCode: 'C.2',
      });
    } else if (roofType === 'ConcreteTile' || roofType === 'ClayTile') {
      const coverage = ROOF_COVERAGE[roofType];
      items.push({
        code: 'C.2',
        description: `Roof tiles, ${roofType === 'ConcreteTile' ? 'concrete' : 'clay'}, laid to battens`,
        unit: 'nr',
        qty: ceilNum(roofArea * coverage.tilesPerM2 * 1.05),
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea * ${coverage.tilesPerM2} tiles per m2 * 1.05`,
      });

      items.push({
        code: 'C.2.1',
        description: 'Sawn timber battens 38 x 50mm at 400mm centres, treated',
        unit: 'm',
        qty: round1(roofArea * coverage.battensPerM2),
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea * ${coverage.battensPerM2} m per m2`,
        parentCode: 'C.2',
      });

      items.push({
        code: 'C.2.2',
        description: 'Roofing nails for tile fixing',
        unit: 'kg',
        qty: round1(roofArea * coverage.nailsKgPerM2),
        category: 'Roof',
        section: 'C',
        source: 'formula',
        formula: `roofArea * ${coverage.nailsKgPerM2} kg per m2`,
        parentCode: 'C.2',
      });
    } else if (roofType === 'thatch' || roofType === 'asbestos') {
      // Thatch and asbestos sheeting: simple quantity
      const m2PerSheet = roofType === 'asbestos' ? 1.2 : 0; // thatch measured differently

      if (roofType === 'asbestos') {
        const sheetCount = ceilNum(roofArea / m2PerSheet);
        items.push({
          code: 'C.2',
          description: 'Asbestos cement roofing sheets',
          unit: 'sheet',
          qty: sheetCount,
          category: 'Roof',
          section: 'C',
          source: 'formula',
          formula: 'roofArea / 1.2 m2 per sheet',
        });
      } else {
        // Thatch: grass bundles
        items.push({
          code: 'C.2',
          description: 'Thatch grass bundles laid on purlins',
          unit: 'bundle',
          qty: ceilNum(roofArea * 2.5),
          category: 'Roof',
          section: 'C',
          source: 'formula',
          formula: 'roofArea * 2.5 bundles per m2',
        });
      }
    }

    // Wall plate
    items.push({
      code: 'C.3',
      description: 'Sawn timber wall plate 75 x 50mm, treated and fixed to top of wall',
      unit: 'm',
      qty: round1(wallLength),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: 'wallLength',
    });

    return items;
  }

  // ----------------------------------------------------------
  // RESIDENTIAL ROOF: full scope with trusses and gutters
  // ----------------------------------------------------------

  // Trusses
  const trussCount = ceilNum(wallLength / 0.9) + 1;
  items.push({
    code: 'C.1',
    description: 'Roof trusses, timber, at 900mm centres, spanning nominal width',
    unit: 'nr',
    qty: trussCount,
    category: 'Roof',
    section: 'C',
    source: 'formula',
    formula: '(wallLength / 0.9) + 1',
  });

  // Purlins
  const purlinSpacing = 1.2;
  const purlinsPerSlope = ceilNum((wallLength / 2) / purlinSpacing) + 1;
  const purlinLength = purlinsPerSlope * 2 * (floorArea / wallLength);
  items.push({
    code: 'C.2',
    description: 'Sawn timber purlins 50 x 75mm at 1.2m centres, treated',
    unit: 'm',
    qty: round1(purlinLength * 1.05),
    category: 'Roof',
    section: 'C',
    source: 'formula',
    formula: 'purlins per slope * 2 slopes * slope length * 1.05',
  });

  // Roofing sheets
  if (roofType === 'IBR' || roofType === 'Chromadek') {
    const coverage = ROOF_COVERAGE[roofType];
    const sheetCount = ceilNum(roofArea / coverage.m2PerSheet);

    items.push({
      code: 'C.3',
      description: `Roof sheeting ${roofType}, 0.47mm thick, fixed to purlins`,
      unit: 'sheet',
      qty: sheetCount,
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea / ${coverage.m2PerSheet} m2 per sheet`,
    });

    items.push({
      code: 'C.3.1',
      description: 'Roofing screws, hook bolts and washers for roof sheeting',
      unit: 'nr',
      qty: ceilNum(roofArea * coverage.fixingsPerM2),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea * ${coverage.fixingsPerM2} fixings per m2`,
      parentCode: 'C.3',
    });

    items.push({
      code: 'C.3.2',
      description: 'Ridge caps to roof sheeting',
      unit: 'm',
      qty: round1(roofArea * coverage.ridgeCapPerM2),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea * ${coverage.ridgeCapPerM2} m per m2`,
      parentCode: 'C.3',
    });

    items.push({
      code: 'C.3.3',
      description: 'Barge boards to gable ends, 200 x 25mm, primed',
      unit: 'm',
      qty: round1(roofArea * coverage.bargeBoardPerM2),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea * ${coverage.bargeBoardPerM2} m per m2`,
      parentCode: 'C.3',
    });
  } else if (roofType === 'ConcreteTile' || roofType === 'ClayTile') {
    const coverage = ROOF_COVERAGE[roofType];
    items.push({
      code: 'C.3',
      description: `Roof tiles, ${roofType === 'ConcreteTile' ? 'concrete' : 'clay'}, laid to battens`,
      unit: 'nr',
      qty: ceilNum(roofArea * coverage.tilesPerM2 * 1.05),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea * ${coverage.tilesPerM2} tiles per m2 * 1.05`,
    });

    items.push({
      code: 'C.3.1',
      description: 'Sawn timber battens 38 x 50mm at 400mm centres, treated',
      unit: 'm',
      qty: round1(roofArea * coverage.battensPerM2),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea * ${coverage.battensPerM2} m per m2`,
      parentCode: 'C.3',
    });

    items.push({
      code: 'C.3.2',
      description: 'Roofing nails for tile fixing',
      unit: 'kg',
      qty: round1(roofArea * coverage.nailsKgPerM2),
      category: 'Roof',
      section: 'C',
      source: 'formula',
      formula: `roofArea * ${coverage.nailsKgPerM2} kg per m2`,
      parentCode: 'C.3',
    });
  }

  // Wall plate
  items.push({
    code: 'C.4',
    description: 'Sawn timber wall plate 75 x 50mm, treated and fixed to top of wall',
    unit: 'm',
    qty: round1(wallLength),
    category: 'Roof',
    section: 'C',
    source: 'formula',
    formula: 'wallLength',
  });

  // Gutters and downpipes (residential only)
  const gutterLength = wallLength * 1.0;
  items.push({
    code: 'C.5',
    description: 'PVC rainwater gutter 150mm diameter, fixed with brackets',
    unit: 'm',
    qty: round1(gutterLength),
    category: 'Roof',
    section: 'C',
    source: 'formula',
    formula: 'wallLength',
  });

  const downpipeLength = 4 * 3;
  items.push({
    code: 'C.5.1',
    description: 'PVC downpipe 110mm diameter with shoe',
    unit: 'm',
    qty: downpipeLength,
    category: 'Roof',
    section: 'C',
    source: 'formula',
    formula: '4 downpipes * 3m',
    parentCode: 'C.5',
  });

  return items;
}
