// ============================================================
// VERIBUILD BOQ ENGINE - FINISHES
// Plaster, screed, tiling, painting, ceiling, skirting, cornice
// ============================================================

import { PLASTER, PAINT_COVERAGE, TILING, CEILING, WASTE,
         LABOUR_PRODUCTIVITY } from '../conversions.js';
import { round1, ceilNum, withWaste } from '../utils.js';

export function calcFinishes(inputs, prices) {
  const items = [];

  const {
    floorArea, wallLength, wallHeight, rooms,
    doors, windows, roomLabels,
  } = inputs;

  // Determine wet areas (bathrooms, kitchens) from room labels
  const wetAreaMultiplier = detectWetAreas(roomLabels);

  // ----------------------------------------------------------
  // D.1 Internal wall plaster
  // ----------------------------------------------------------
  const totalWallArea = wallLength * wallHeight;
  const openingDeduction = doors * 1.8 + windows * 1.5;
  const netInternalWallArea = Math.max(totalWallArea - openingDeduction, totalWallArea * 0.85);

  items.push({
    code: 'D.1',
    description: 'Cement and sand render 1:5 to internal walls, 12mm thick, wood float finish',
    unit: 'm2',
    qty: round1(netInternalWallArea),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallLength * wallHeight - openings',
  });

  const renderSand = netInternalWallArea * PLASTER.render.sand;
  const renderCement = netInternalWallArea * PLASTER.render.cement;

  items.push({
    code: 'D.1.1',
    description: 'Cement 50kg bags for internal wall plaster',
    unit: 'bag',
    qty: ceilNum(withWaste(renderCement, WASTE.cement)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallArea * 0.1814 bags/m2 * 1.05',
    parentCode: 'D.1',
  });

  items.push({
    code: 'D.1.2',
    description: 'Pit sand for internal wall plaster',
    unit: 'm3',
    qty: round1(withWaste(renderSand, WASTE.sand)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallArea * 0.0252m3/m2 * 1.10',
    parentCode: 'D.1',
  });

  // ----------------------------------------------------------
  // D.2 External wall plaster (wood float)
  // ----------------------------------------------------------
  const externalWallArea = wallLength * wallHeight * 0.9; // external perimeter approximate

  items.push({
    code: 'D.2',
    description: 'Cement and sand render 1:4 to external walls, 15mm thick, wood float finish',
    unit: 'm2',
    qty: round1(externalWallArea),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallLength * wallHeight * 0.9',
  });

  items.push({
    code: 'D.2.1',
    description: 'Cement 50kg bags for external wall plaster',
    unit: 'bag',
    qty: ceilNum(withWaste(externalWallArea * PLASTER.woodfloat.cement, WASTE.cement)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallArea * 0.2217 bags/m2 * 1.05',
    parentCode: 'D.2',
  });

  items.push({
    code: 'D.2.2',
    description: 'Pit sand for external wall plaster',
    unit: 'm3',
    qty: round1(withWaste(externalWallArea * PLASTER.woodfloat.sand, WASTE.sand)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallArea * 0.0231m3/m2 * 1.10',
    parentCode: 'D.2',
  });

  // ----------------------------------------------------------
  // D.3 Rhinoset skim coat to internal walls
  // ----------------------------------------------------------
  items.push({
    code: 'D.3',
    description: 'Rhinoset skim coat to internal plastered walls, 3mm thick',
    unit: 'bag25kg',
    qty: ceilNum(withWaste(netInternalWallArea * PLASTER.rhinoset25kg, WASTE.plaster)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallArea * 0.0525 bags/25kg/m2 * 1.10',
  });

  // ----------------------------------------------------------
  // D.4 Floor screed
  // ----------------------------------------------------------
  const screedArea = floorArea;
  items.push({
    code: 'D.4',
    description: 'Cement and sand screed 1:4 to floor, 40mm thick, laid to falls',
    unit: 'm2',
    qty: round1(screedArea),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea',
  });

  const screedCement = screedArea * 0.42; // approximately 0.42 bags per m2 at 40mm
  items.push({
    code: 'D.4.1',
    description: 'Cement 50kg bags for floor screed',
    unit: 'bag',
    qty: ceilNum(withWaste(screedCement, WASTE.cement)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea * 0.42 bags/m2 * 1.05',
    parentCode: 'D.4',
  });

  // ----------------------------------------------------------
  // D.5 Floor tiles (dry areas)
  // ----------------------------------------------------------
  const dryFloorArea = floorArea * (1 - wetAreaMultiplier);
  const dryTileArea = dryFloorArea * 1.10;

  items.push({
    code: 'D.5',
    description: 'Ceramic floor tiles 400 x 400mm, laid on 20mm cement and sand bed',
    unit: 'm2',
    qty: round1(dryTileArea),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'dryFloorArea * 1.10',
  });

  // ----------------------------------------------------------
  // D.6 Wet area floor tiles
  // ----------------------------------------------------------
  const wetFloorArea = floorArea * wetAreaMultiplier;

  items.push({
    code: 'D.6',
    description: 'Ceramic floor tiles 300 x 300mm, slip resistant, in wet areas',
    unit: 'm2',
    qty: round1(wetFloorArea * 1.10),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wetFloorArea * 1.10',
  });

  // ----------------------------------------------------------
  // D.7 Wall tiles to wet areas
  // ----------------------------------------------------------
  // Wall tiles to walls of bathroom and kitchen - 1.5m height typical
  const wetWallTileArea = wetFloorArea * 2.0; // approximate
  items.push({
    code: 'D.7',
    description: 'Ceramic wall tiles 150 x 150mm to wet area walls up to 1.5m high',
    unit: 'm2',
    qty: round1(wetWallTileArea),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wetFloorArea * 2.0',
  });

  items.push({
    code: 'D.7.1',
    description: 'Tile adhesive 20kg bags for wall tiling',
    unit: 'bag',
    qty: ceilNum(withWaste(wetWallTileArea * TILING.adhesiveKgPerM2, 0.05)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallTileArea * 0.167kg/m2 / 20kg * 1.05',
    parentCode: 'D.7',
  });

  items.push({
    code: 'D.7.2',
    description: 'Tylon tile grout 5kg bags for wall tiling',
    unit: 'bag',
    qty: ceilNum(withWaste(wetWallTileArea * TILING.tylonKgPerM2 / 5, 0.05)),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallTileArea * 0.1kg/m2 / 5kg * 1.05',
    parentCode: 'D.7',
  });

  // ----------------------------------------------------------
  // D.8 Painting - internal walls
  // ----------------------------------------------------------
  const internalPaintArea = netInternalWallArea;
  const paintLitresInternal = Math.ceil(
    (internalPaintArea / PAINT_COVERAGE.pvaPlaster_1st) * 5 +
    (internalPaintArea / PAINT_COVERAGE.pvaPlaster_subsequent) * 5 * 2
  );

  items.push({
    code: 'D.8',
    description: 'Internal emulsion paint to walls, one primer coat and two finish coats',
    unit: 'l',
    qty: paintLitresInternal,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'internalWallArea / coverage per litre across 3 coats',
  });

  // ----------------------------------------------------------
  // D.9 Painting - external walls
  // ----------------------------------------------------------
  const externalPaintLitres = Math.ceil(
    (externalWallArea / PAINT_COVERAGE.pvaPlaster_1st) * 5 +
    (externalWallArea / PAINT_COVERAGE.pvaPlaster_subsequent) * 5 * 2
  );

  items.push({
    code: 'D.9',
    description: 'External emulsion paint to walls, one primer coat and two finish coats',
    unit: 'l',
    qty: externalPaintLitres,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'externalWallArea / coverage per litre across 3 coats',
  });

  // ----------------------------------------------------------
  // D.10 Ceiling
  // ----------------------------------------------------------
  const ceilingArea = floorArea;
  const ceilingBoards = ceilNum(ceilingArea / CEILING.boardSize_m2 * 1.05);

  items.push({
    code: 'D.10',
    description: 'Plasterboard ceiling 2400 x 1200 x 6mm thick, fixed to brandering',
    unit: 'sheet',
    qty: ceilingBoards,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea / 2.88m2 per sheet * 1.05',
  });

  items.push({
    code: 'D.10.1',
    description: 'Sawn timber brandering 38 x 38mm at 400mm centres under ceiling',
    unit: 'm',
    qty: round1(ceilingArea * CEILING.branderingPerM2),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea * 5.0 m/m2',
    parentCode: 'D.10',
  });

  items.push({
    code: 'D.10.2',
    description: 'Clout nails for ceiling board fixing',
    unit: 'kg',
    qty: round1(ceilingArea * CEILING.cloutNailsPerM2 / 250), // ~250 nails per kg
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea * 10.5 nails/m2 / 250 nails per kg',
    parentCode: 'D.10',
  });

  items.push({
    code: 'D.10.3',
    description: 'Covebond 25kg bags for ceiling board jointing',
    unit: 'bag25kg',
    qty: ceilNum(ceilingArea * CEILING.covebond25kgPerM2),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea * 0.0525 bags/m2',
    parentCode: 'D.10',
  });

  // ----------------------------------------------------------
  // D.11 Painting to ceiling
  // ----------------------------------------------------------
  const ceilingPaintLitres = Math.ceil(
    (ceilingArea / PAINT_COVERAGE.pvaBoards_1st) * 5 +
    (ceilingArea / PAINT_COVERAGE.pvaBoards_subsequent) * 5 * 2
  );

  items.push({
    code: 'D.11',
    description: 'Ceiling white emulsion paint to plasterboard ceilings, three coats',
    unit: 'l',
    qty: ceilingPaintLitres,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'ceilingArea / coverage per litre across 3 coats',
  });

  // ----------------------------------------------------------
  // D.12 Skirting
  // ----------------------------------------------------------
  const skirtingLength = wallLength * 0.9; // approximate internal perimeter
  items.push({
    code: 'D.12',
    description: 'Sawn timber skirting 100 x 19mm, primed and fixed',
    unit: 'm',
    qty: round1(skirtingLength),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallLength * 0.9',
  });

  // ----------------------------------------------------------
  // D.13 Cornice
  // ----------------------------------------------------------
  items.push({
    code: 'D.13',
    description: 'Gypsum cornice 90mm to ceiling and wall junction',
    unit: 'm',
    qty: round1(skirtingLength),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallLength * 0.9',
  });

  return items;
}

// Detect the proportion of floor area that is wet (bathroom, kitchen)
function detectWetAreas(roomLabels) {
  if (!roomLabels) return 0.15; // default 15%
  const labels = String(roomLabels).toLowerCase();
  if (labels.includes('bathroom') || labels.includes('toilet') || labels.includes('kitchen')) {
    // Rough proportion based on number of wet rooms
    const wetRooms = (labels.match(/bathroom|toilet|kitchen/g) || []).length;
    return Math.min(wetRooms * 0.08, 0.35); // each wet room ~8% of floor area, capped at 35%
  }
  return 0.15;
}
