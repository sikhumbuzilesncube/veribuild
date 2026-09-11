// ============================================================
// VERIBUILD BOQ ENGINE - ROOF
// Trusses, purlins, battens, coverings, fascia, barge, gutters
// ============================================================

import { PITCH_FACTOR, ROOF_COVERAGE, WASTE,
         LABOUR_PRODUCTIVITY } from '../conversions.js';
import { round1, ceilNum, withWaste } from '../utils.js';

export function calcRoof(inputs, prices) {
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
    .reduce((prev, curr) =>
      Math.abs(curr - roofPitch) < Math.abs(prev - roofPitch) ? curr : prev
    , 15);
  const pitchMult = PITCH_FACTOR[pitchKey];
  const roofArea = floorArea * pitchMult;

  // ----------------------------------------------------------
  // C.2 Trusses
  // ----------------------------------------------------------
  // Spacing at 900mm centres along wall length
  const trussCount = ceilNum(wallLength / 0.9) + 1;
  items.push({
    code: 'C.1',
    description: `Roof trusses, timber, at 900mm centres, spanning nominal width`,
    unit: 'nr',
    qty: trussCount,
    category: 'Roof',
    section: 'C',
    source: 'formula',
    formula: '(wallLength / 0.9) + 1',
  });

  // ----------------------------------------------------------
  // C.3 Purlins
  // ----------------------------------------------------------
  const purlinSpacing = 1.2; // metres
  const purlinsPerSlope = ceilNum((wallLength / 2) / purlinSpacing) + 1;
  const purlinLength = purlinsPerSlope * 2 * (floorArea / wallLength); // approximate
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

  // ----------------------------------------------------------
  // C.4 Roofing sheets (IBR or Chromadek)
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // C.5 Wall plate
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // C.6 Gutters and downpipes
  // ----------------------------------------------------------
  const gutterLength = wallLength * 1.0; // half perimeter approximation
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

  const downpipeLength = 4 * 3; // 4 downpipes x 3m each
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
