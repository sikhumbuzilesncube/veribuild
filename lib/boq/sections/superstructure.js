// ============================================================
// VERIBUILD BOQ ENGINE - SUPERSTRUCTURE
// Ground slab, walls, DPC to walls, lintels, wall reinforcement
// ============================================================

import { CONCRETE_MIX, MORTAR_MIX, MORTAR_PER_M2, BRICKS_PER_M2,
         STEEL_KG_PER_M3, FABRIC_KG_PER_M2, WASTE,
         REINFORCEMENT_ACCESSORIES, LABOUR_PRODUCTIVITY } from '../conversions.js';
import { round1, ceilNum, withWaste } from '../utils.js';
import { gradeToZim } from '../validators.js';

export function calcSuperstructure(inputs, prices) {
  const items = [];

  const {
    floorArea, wallLength, wallHeight, slabThickness,
    doors, windows, concreteGrade,
    windowDetails, doorDetails,
  } = inputs;

  // ----------------------------------------------------------
  // B.1 Ground floor slab concrete
  // ----------------------------------------------------------
  const slabVolume = floorArea * slabThickness;
  const zimGrade = gradeToZim(concreteGrade);
  const mix = CONCRETE_MIX[zimGrade] || CONCRETE_MIX.G20;

  items.push({
    code: 'B.1',
    description: `Concrete Grade ${zimGrade} in ground floor slab, ${Math.round(slabThickness * 1000)}mm thick`,
    unit: 'm3',
    qty: round1(slabVolume),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'floorArea * slabThickness',
    grade: zimGrade,
  });

  items.push({
    code: 'B.1.1',
    description: 'Portland cement 50kg bags for slab concrete',
    unit: 'bag',
    qty: ceilNum(withWaste(slabVolume * mix.cement, WASTE.cement)),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'slabVolume * mix.cement * 1.05',
    parentCode: 'B.1',
  });

  items.push({
    code: 'B.1.2',
    description: 'River sand for slab concrete',
    unit: 'm3',
    qty: round1(withWaste(slabVolume * mix.sand, WASTE.sand)),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'slabVolume * mix.sand * 1.10',
    parentCode: 'B.1',
  });

  items.push({
    code: 'B.1.3',
    description: '19mm crushed stone aggregate for slab concrete',
    unit: 'm3',
    qty: round1(withWaste(slabVolume * mix.stone, WASTE.stone)),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'slabVolume * mix.stone * 1.10',
    parentCode: 'B.1',
  });

  // ----------------------------------------------------------
  // B.2 Steel mesh to slab
  // ----------------------------------------------------------
  const meshSheets = ceilNum((floorArea * 1.1) / 14.4); // standard 2.4 x 6m sheet
  items.push({
    code: 'B.2',
    description: 'Steel fabric reinforcement Ref S193 to ground floor slab',
    unit: 'sheet',
    qty: meshSheets,
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'floorArea * 1.1 / 14.4',
  });

  // ----------------------------------------------------------
  // B.3 External walls
  // ----------------------------------------------------------
  // Deduct openings from wall area
  const openingArea = doors * 1.8 + windows * 1.5; // typical deductions
  const grossWallArea = wallLength * wallHeight;
  const netWallArea = Math.max(grossWallArea - openingArea, grossWallArea * 0.85);

  items.push({
    code: 'B.3',
    description: 'Common bricks in cement mortar 1:5 in walls, one brick thick, 230mm',
    unit: 'nr',
    qty: ceilNum(withWaste(netWallArea * BRICKS_PER_M2.oneBrick, WASTE.bricks)),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: `(wallLength * wallHeight - openings) * 104 bricks/m2 * 1.05`,
    wallArea: round1(netWallArea),
  });

  const wallMortarVolume = netWallArea * MORTAR_PER_M2.oneBrick;
  const mortarMix = MORTAR_MIX['1:5'];

  items.push({
    code: 'B.3.1',
    description: 'Cement 50kg bags for wall mortar',
    unit: 'bag',
    qty: ceilNum(withWaste(wallMortarVolume * mortarMix.cement, WASTE.cement)),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'netWallArea * 0.04m3/m2 * 7.5 bags/m3 * 1.05',
    parentCode: 'B.3',
  });

  items.push({
    code: 'B.3.2',
    description: 'Pit sand for wall mortar',
    unit: 'm3',
    qty: round1(withWaste(wallMortarVolume * mortarMix.sand, WASTE.sand)),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'netWallArea * 0.04m3/m2 * 1.5m3/m3 * 1.10',
    parentCode: 'B.3',
  });

  // ----------------------------------------------------------
  // B.4 Brickforce in walls (every 4 courses)
  // ----------------------------------------------------------
  const brickforceLength = netWallArea * REINFORCEMENT_ACCESSORIES.brickforcePerM2;
  items.push({
    code: 'B.4',
    description: 'Brickforce reinforcement built into walls every 4 courses',
    unit: 'm',
    qty: round1(brickforceLength),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'netWallArea * 2.94m/m2',
  });

  // ----------------------------------------------------------
  // B.5 Lintels over openings
  // ----------------------------------------------------------
  const lintelCount = doors + windows;
  items.push({
    code: 'B.5',
    description: 'Reinforced concrete lintels over door and window openings, 150 x 200mm, precast',
    unit: 'nr',
    qty: lintelCount,
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'doors + windows',
  });

  // ----------------------------------------------------------
  // B.6 Wall plate and hoop irons
  // ----------------------------------------------------------
  items.push({
    code: 'B.6',
    description: 'Galvanised hoop iron ties built into brickwork for wall plate fixing',
    unit: 'nr',
    qty: ceilNum(wallLength / 1.2),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: 'wallLength / 1.2m spacing',
  });

  // ----------------------------------------------------------
  // B.7 Bricklaying labour
  // ----------------------------------------------------------
  const totalBricks = netWallArea * BRICKS_PER_M2.oneBrick;
  const bricksPerGangDay = LABOUR_PRODUCTIVITY.brickwork.oneBrick_super;
  const brickGangDays = totalBricks / bricksPerGangDay;

  items.push({
    code: 'B.7',
    description: 'Labour for bricklaying, measured as gang-days of 1 bricklayer and 2 assistants',
    unit: 'gang-day',
    qty: round1(brickGangDays),
    category: 'Superstructure',
    section: 'B',
    source: 'formula',
    formula: `totalBricks / ${bricksPerGangDay} bricks per gang-day`,
    labour: true,
    trade: 'bricklayer',
    gangSize: 3,
  });

  return items;
    }
