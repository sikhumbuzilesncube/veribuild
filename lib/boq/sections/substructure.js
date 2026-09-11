// ============================================================
// VERIBUILD BOQ ENGINE - SUBSTRUCTURE
// Site clearance, excavation, foundation concrete, foundation
// brickwork, DPC, hardcore, blinding, termite treatment
// ============================================================

import { CONCRETE_MIX, MORTAR_MIX, MORTAR_PER_M2, BRICKS_PER_M2,
         STEEL_KG_PER_M3, WASTE, SITE, DPC, POLYTHENE,
         REINFORCEMENT_ACCESSORIES, LABOUR_PRODUCTIVITY } from '../conversions.js';
import { round1, round2, ceilNum, withWaste } from '../utils.js';
import { gradeToZim } from '../validators.js';

export function calcSubstructure(inputs, prices) {
  const items = [];

  const {
    wallLength, foundationDepth, foundationWidth,
    floorArea, concreteGrade, cityId,
  } = inputs;

  // ----------------------------------------------------------
  // A.1 Site clearance
  // ----------------------------------------------------------
  const siteClearanceArea = round1(floorArea * 1.5); // 150% of footprint
  items.push({
    code: 'A.1',
    description: 'Clear site of all vegetation and rubbish, including removal off site',
    unit: 'm2',
    qty: siteClearanceArea,
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'floorArea * 1.5',
  });

  // ----------------------------------------------------------
  // A.2 Excavation for foundations
  // ----------------------------------------------------------
  // Volume = wall length x width x depth, plus 10% for working space
  const excavationVolume = wallLength * foundationWidth * foundationDepth * 1.1;

  items.push({
    code: 'A.2',
    description: `Excavate trenches for strip foundations, depth not exceeding ${round1(foundationDepth)}m`,
    unit: 'm3',
    qty: round1(excavationVolume),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'wallLength * foundationWidth * foundationDepth * 1.1',
  });

  // Backfill
  const backfillVolume = excavationVolume * 0.35;
  items.push({
    code: 'A.3',
    description: 'Return, fill and ram excavated material around foundations',
    unit: 'm3',
    qty: round1(backfillVolume),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'excavationVolume * 0.35',
  });

  // ----------------------------------------------------------
  // A.4 Hardcore bed under floor slab
  // ----------------------------------------------------------
  const hardcoreVolume = floorArea * SITE.hardcoreThickness_m;
  items.push({
    code: 'A.4',
    description: `Hardcore filling under floor slab, ${SITE.hardcoreThickness_m * 1000}mm thick, well compacted`,
    unit: 'm3',
    qty: round1(hardcoreVolume),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'floorArea * 0.15',
  });

  // ----------------------------------------------------------
  // A.5 Sand blinding
  // ----------------------------------------------------------
  const blindingVolume = floorArea * SITE.sandBlindingThickness_m;
  items.push({
    code: 'A.5',
    description: 'Sand blinding to receive polythene damp proof membrane',
    unit: 'm3',
    qty: round1(blindingVolume),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'floorArea * 0.05',
  });

  // ----------------------------------------------------------
  // A.6 Polythene DPM
  // ----------------------------------------------------------
  items.push({
    code: 'A.6',
    description: '1000 gauge polythene damp proof membrane laid under floor slab',
    unit: 'm2',
    qty: round1(floorArea * 1.1),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'floorArea * 1.1',
  });

  // ----------------------------------------------------------
  // A.7 Termite treatment
  // ----------------------------------------------------------
  const termiteLitres = floorArea * SITE.termiteLiquidLPerM2;
  items.push({
    code: 'A.7',
    description: 'Approved chemical termite treatment to underside of floor slab',
    unit: 'l',
    qty: round1(termiteLitres),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'floorArea * 0.109',
  });

  // ----------------------------------------------------------
  // A.8 Foundation concrete
  // ----------------------------------------------------------
  // Volume of concrete in foundations: 60% of excavation (typical ratio)
  const foundationConcreteVolume = excavationVolume * 0.6;
  const zimGrade = gradeToZim(concreteGrade);
  const mix = CONCRETE_MIX[zimGrade] || CONCRETE_MIX.G20;

  items.push({
    code: 'A.8',
    description: `Concrete Grade ${zimGrade} in strip foundations`,
    unit: 'm3',
    qty: round1(foundationConcreteVolume),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'excavationVolume * 0.6',
    grade: zimGrade,
  });

  const cementBagsFoundation = ceilNum(withWaste(foundationConcreteVolume * mix.cement, WASTE.cement));
  items.push({
    code: 'A.8.1',
    description: 'Portland cement 50kg bags for foundation concrete',
    unit: 'bag',
    qty: cementBagsFoundation,
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'concreteVolume * mix.cement * 1.05',
    parentCode: 'A.8',
  });

  items.push({
    code: 'A.8.2',
    description: 'River sand for foundation concrete',
    unit: 'm3',
    qty: round1(withWaste(foundationConcreteVolume * mix.sand, WASTE.sand)),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'concreteVolume * mix.sand * 1.10',
    parentCode: 'A.8',
  });

  items.push({
    code: 'A.8.3',
    description: '19mm crushed stone aggregate for foundation concrete',
    unit: 'm3',
    qty: round1(withWaste(foundationConcreteVolume * mix.stone, WASTE.stone)),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'concreteVolume * mix.stone * 1.10',
    parentCode: 'A.8',
  });

  // ----------------------------------------------------------
  // A.9 Steel reinforcement to foundations
  // ----------------------------------------------------------
  const rebarKg = foundationConcreteVolume * STEEL_KG_PER_M3.bases;
  items.push({
    code: 'A.9',
    description: 'High yield steel bar reinforcement to foundations, Y12 grade',
    unit: 'kg',
    qty: ceilNum(withWaste(rebarKg, WASTE.steel)),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'concreteVolume * 90kg/m3 * 1.05',
  });

  // ----------------------------------------------------------
  // A.10 Foundation brickwork
  // ----------------------------------------------------------
  // Height of foundation wall (from top of foundation concrete to DPC)
  const foundationWallHeight = 0.45; // 3 courses of bricks typical
  const foundationWallArea = wallLength * foundationWallHeight;
  const foundationBricks = ceilNum(withWaste(foundationWallArea * BRICKS_PER_M2.oneBrick, WASTE.bricks));

  items.push({
    code: 'A.10',
    description: 'Common bricks in cement mortar 1:5 in foundation walls, one brick thick',
    unit: 'nr',
    qty: foundationBricks,
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'wallLength * 0.45 * 104 * 1.05',
  });

  const foundationMortarVolume = foundationWallArea * MORTAR_PER_M2.oneBrick;
  const mortarMix = MORTAR_MIX['1:5'];

  items.push({
    code: 'A.10.1',
    description: 'Cement 50kg bags for foundation wall mortar',
    unit: 'bag',
    qty: ceilNum(withWaste(foundationMortarVolume * mortarMix.cement, WASTE.cement)),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'wallArea * 0.04m3/m2 * 7.5 bags/m3 * 1.05',
    parentCode: 'A.10',
  });

  items.push({
    code: 'A.10.2',
    description: 'Pit sand for foundation wall mortar',
    unit: 'm3',
    qty: round1(withWaste(foundationMortarVolume * mortarMix.sand, WASTE.sand)),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'wallArea * 0.04m3/m2 * 1.5m3/m3 * 1.10',
    parentCode: 'A.10',
  });

  // ----------------------------------------------------------
  // A.11 Brickforce reinforcement
  // ----------------------------------------------------------
  const brickforceLength = foundationWallArea * REINFORCEMENT_ACCESSORIES.brickforcePerM2;
  items.push({
    code: 'A.11',
    description: 'Brickforce reinforcement every 4 courses in foundation brickwork',
    unit: 'm',
    qty: round1(brickforceLength),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'wallArea * 2.94m/m2',
  });

  // ----------------------------------------------------------
  // A.12 Damp proof course
  // ----------------------------------------------------------
  const dpcLength = wallLength;
  const dpcRolls = ceilNum(dpcLength / DPC.linearMetersPerRoll);
  items.push({
    code: 'A.12',
    description: 'Damp proof course, 112.5mm wide, polythene based, laid in wall at DPC level',
    unit: 'm',
    qty: round1(dpcLength),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: 'wallLength',
  });

  // ----------------------------------------------------------
  // A.13 Excavation labour - time analysis
  // ----------------------------------------------------------
  const excProd = LABOUR_PRODUCTIVITY.excavation;
  let excOutputPerDay = excProd.trench_lt_1m;
  if (foundationDepth > 1.0 && foundationDepth <= 2.0) excOutputPerDay = excProd.trench_1_2m;
  if (foundationDepth > 2.0 && foundationDepth <= 3.0) excOutputPerDay = excProd.trench_2_3m;

  const excavationGangDays = excavationVolume / excOutputPerDay;

  items.push({
    code: 'A.13',
    description: 'Labour for excavation, measured as gang-days of 1 general labourer',
    unit: 'gang-day',
    qty: round1(excavationGangDays),
    category: 'Substructure',
    section: 'A',
    source: 'formula',
    formula: `excavationVolume / ${excOutputPerDay} m3 per day`,
    labour: true,
    trade: 'general',
    gangSize: 1,
  });

  return items;
    }
