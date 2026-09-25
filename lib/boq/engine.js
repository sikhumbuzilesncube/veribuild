// ============================================================
// VERIBUILD BOQ ENGINE - ORCHESTRATOR
// Entry point: generateFullBOQ(project)
// Branches by structure type for rural/auxiliary buildings.
// ============================================================

import { normaliseInputs, validateProject } from './validators.js';
import { getCityMultiplier, DEFAULT_PRICES } from './prices.js';
import { round2 } from './utils.js';

import { calcSubstructure } from './sections/substructure.js';
import { calcSuperstructure } from './sections/superstructure.js';
import { calcRoof } from './sections/roof.js';
import { calcFinishes } from './sections/finishes.js';
import { calcServices } from './sections/services.js';
import { summariseLabour } from './sections/labour.js';

const SECTION_TITLES = {
  A: 'Substructure',
  B: 'Superstructure',
  C: 'Roof',
  D: 'Finishes',
  E: 'Services',
  F: 'Labour',
  G: 'Summary',
};

// ------------------------------------------------------------
// Structure scope definitions.
// Each structure type declares which sections apply and
// what level of finish is expected.
// ------------------------------------------------------------
const STRUCTURE_SCOPES = {
  // Residential (full scope)
  house:          { finishes: 'full',  plumbing: 'full',  electrical: 'full' },
  cottage:        { finishes: 'full',  plumbing: 'full',  electrical: 'full' },
  outbuilding:    { finishes: 'full',  plumbing: 'full',  electrical: 'full' },
  commercial:     { finishes: 'full',  plumbing: 'full',  electrical: 'full' },

  // Rural / auxiliary
  kitchen_round:  { finishes: 'none',  plumbing: 'none',  electrical: 'none' },
  kitchen_square: { finishes: 'none',  plumbing: 'none',  electrical: 'none' },
  toilet_block:   { finishes: 'none',  plumbing: 'basic', electrical: 'none' },
  shower:         { finishes: 'none',  plumbing: 'basic', electrical: 'none' },
  storeroom:      { finishes: 'none',  plumbing: 'none',  electrical: 'none' },
  cottage_1room:  { finishes: 'basic', plumbing: 'none',  electrical: 'none' },
  cottage_2room:  { finishes: 'basic', plumbing: 'basic', electrical: 'none' },
  workshop:       { finishes: 'none',  plumbing: 'none',  electrical: 'none' },
};

// ------------------------------------------------------------
// Parse the structure type from the project's notes field.
// The template page writes notes in the format:
//   "Generated from template. <structure label>, ..."
// ------------------------------------------------------------
function detectStructureType(project) {
  const planType = String(project.plan_type || '').toLowerCase();
  const notes = String(project.notes || '');

  // If plan_type is not residential or rural, default to house
  if (planType !== 'rural') {
    return 'house';
  }

  // Match known structure labels against the notes
  const labelMap = [
    { pattern: /kitchen hut \(round\)/i,  type: 'kitchen_round' },
    { pattern: /kitchen hut \(square\)/i, type: 'kitchen_square' },
    { pattern: /toilet block/i,           type: 'toilet_block' },
    { pattern: /shower enclosure/i,       type: 'shower' },
    { pattern: /storeroom/i,              type: 'storeroom' },
    { pattern: /single-room cottage/i,    type: 'cottage_1room' },
    { pattern: /two-room cottage/i,       type: 'cottage_2room' },
    { pattern: /workshop/i,               type: 'workshop' },
  ];

  for (const { pattern, type } of labelMap) {
    if (pattern.test(notes)) return type;
  }

  // Fallback: if rural but no label matched, treat as a small cottage
  return 'cottage_1room';
}

// ------------------------------------------------------------
// Main entry point
// ------------------------------------------------------------
export function generateFullBOQ(project, options = {}) {
  const { includeContingency = true, contingencyRate = 0.05 } = options;

  const validation = validateProject(project);
  const inputs = normaliseInputs(project);

  const cityMultiplier = getCityMultiplier(inputs.cityId);

  const structureType = detectStructureType(project);
  const scope = STRUCTURE_SCOPES[structureType] || STRUCTURE_SCOPES.house;

  // ----------------------------------------------------------
  // Always include substructure, superstructure, roof
  // ----------------------------------------------------------
  const substructureItems = calcSubstructure(inputs, DEFAULT_PRICES);
  const superstructureItems = calcSuperstructure(inputs, DEFAULT_PRICES);
  const roofItems = calcRoof(inputs, DEFAULT_PRICES);

  // ----------------------------------------------------------
  // Finishes: full, basic, or none
  // ----------------------------------------------------------
  let finishesItems = [];
  if (scope.finishes === 'full') {
    finishesItems = calcFinishes(inputs, DEFAULT_PRICES);
  } else if (scope.finishes === 'basic') {
    finishesItems = calcBasicFinishes(inputs, DEFAULT_PRICES);
  }

  // ----------------------------------------------------------
  // Services: full, basic, or none
  // ----------------------------------------------------------
  let servicesItems = [];
  if (scope.plumbing === 'full' && scope.electrical === 'full') {
    servicesItems = calcServices(inputs, DEFAULT_PRICES);
  } else if (scope.plumbing === 'basic' || scope.electrical === 'full') {
    servicesItems = calcBasicServices(inputs, DEFAULT_PRICES, scope);
  }

  const allItems = [
    ...substructureItems,
    ...superstructureItems,
    ...roofItems,
    ...finishesItems,
    ...servicesItems,
  ];

  const pricedItems = allItems.map((item) => {
    const rate = getRateForItem(item);
    const amount = round2(item.qty * rate * cityMultiplier);
    return { ...item, rate, amount };
  });

  const labourSummary = summariseLabour(pricedItems, cityMultiplier);

  const sections = {};
  for (const item of pricedItems) {
    const sec = item.section;
    if (!sections[sec]) {
      sections[sec] = {
        letter: sec,
        title: SECTION_TITLES[sec] || sec,
        items: [],
        subtotal: 0,
      };
    }
    sections[sec].items.push(item);
    sections[sec].subtotal = round2(sections[sec].subtotal + item.amount);
  }

  if (labourSummary.items.length > 0) {
    sections.F = {
      letter: 'F',
      title: 'Labour',
      items: labourSummary.items.map((l, idx) => ({
        code: `F.${idx + 1}`,
        description: `${l.trade} labour (${l.gangDescription})`,
        unit: 'man-day',
        qty: l.manDays,
        gangDays: l.gangDays,
        gangSize: l.gangSize,
        rate: l.rate,
        amount: l.cost,
        category: 'Labour',
        section: 'F',
        source: 'formula',
      })),
      subtotal: labourSummary.totalCost,
    };
  }

  const subtotal = round2(
    Object.values(sections).reduce((sum, s) => sum + (s.subtotal || 0), 0)
  );

  const contingency = includeContingency ? round2(subtotal * contingencyRate) : 0;
  const grandTotal = round2(subtotal + contingency);

  const flatItems = [];
  for (const sec of Object.values(sections)) {
    for (const item of sec.items) {
      flatItems.push({
        id: item.code,
        code: item.code,
        name: item.description,
        qty: item.qty,
        unit: item.unit,
        category: sec.title,
        rate: item.rate,
        amount: item.amount,
        section: item.section,
        source: item.source,
        formula: item.formula,
        isHeader: !!item.isHeader,
        parentCode: item.parentCode || null,
        labour: !!item.labour,
      });
    }
  }

  return {
    sections: Object.values(sections),
    summary: {
      subtotal,
      contingency,
      contingencyRate,
      grandTotal,
      cityMultiplier,
      cityId: inputs.cityId,
      structureType,
      scope,
    },
    labour: labourSummary,
    validation,
    items: flatItems,
    totalCost: grandTotal,
  };
}

// ------------------------------------------------------------
// Basic finishes: plaster only, no tiles, ceiling, paint, cornice.
// Applies to single-room and two-room cottages.
// ------------------------------------------------------------
function calcBasicFinishes(inputs, prices) {
  const items = [];
  const {
    floorArea, wallLength, wallHeight, doors, windows,
  } = inputs;

  const totalWallArea = wallLength * wallHeight;
  const openingDeduction = doors * 1.8 + windows * 1.5;
  const netInternalWallArea = Math.max(
    totalWallArea - openingDeduction,
    totalWallArea * 0.85
  );

  // Internal render (cement plaster)
  items.push({
    code: 'D.1',
    description: 'Cement and sand render 1:5 to internal walls, 12mm thick, wood float finish',
    unit: 'm2',
    qty: Math.round(netInternalWallArea * 10) / 10,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallLength * wallHeight - openings',
    isHeader: true,
  });

  const renderCement = netInternalWallArea * 0.1814;
  const renderSand = netInternalWallArea * 0.0252;

  items.push({
    code: 'D.1.1',
    description: 'Cement 50kg bags for internal wall plaster',
    unit: 'bag',
    qty: Math.ceil(renderCement * 1.05),
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
    qty: Math.round(renderSand * 1.10 * 10) / 10,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'wallArea * 0.0252 m3/m2 * 1.10',
    parentCode: 'D.1',
  });

  // Floor screed only (no tiles)
  items.push({
    code: 'D.4',
    description: 'Cement and sand screed 1:4 to floor, 40mm thick',
    unit: 'm2',
    qty: Math.round(floorArea * 10) / 10,
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea',
    isHeader: true,
  });

  const screedCement = floorArea * 0.42;
  items.push({
    code: 'D.4.1',
    description: 'Cement 50kg bags for floor screed',
    unit: 'bag',
    qty: Math.ceil(screedCement * 1.05),
    category: 'Finishes',
    section: 'D',
    source: 'formula',
    formula: 'floorArea * 0.42 bags/m2 * 1.05',
    parentCode: 'D.4',
  });

  return items;
}

// ------------------------------------------------------------
// Basic services: minimal plumbing and/or electrical only.
// Used for toilet block, shower, and similar.
// ------------------------------------------------------------
function calcBasicServices(inputs, prices, scope) {
  const items = [];
  const {
    brownSewerLength,
    blueWaterLength,
    plumbingPoints,
    electricalPoints,
  } = inputs;

  // Minimal plumbing: one set of fittings, minimal pipe
  if (scope.plumbing === 'basic') {
    const pipeLength = Math.max(brownSewerLength, 3);
    const waterLength = Math.max(blueWaterLength, 2);

    items.push({
      code: 'E.1',
      description: 'PVC sewer pipe 110mm diameter, laid in trenches and bedded',
      unit: 'm',
      qty: Math.round(pipeLength * 10) / 10,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'minimum 3m for rural structure',
    });

    items.push({
      code: 'E.2',
      description: 'PEX water pipe 15mm diameter, in walls',
      unit: 'm',
      qty: Math.round(waterLength * 10) / 10,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'minimum 2m for rural structure',
    });

    const fittingsCount = Math.max(plumbingPoints, 1);
    items.push({
      code: 'E.3',
      description: 'Sanitary fittings including WC or shower, taps and traps',
      unit: 'set',
      qty: fittingsCount,
      category: 'Services',
      section: 'E',
      source: 'input',
      formula: 'plumbing points',
    });

    const sanitaryGangDays = fittingsCount / 3;
    items.push({
      code: 'E.3.1',
      description: 'Labour for installing sanitary fittings, measured as gang-days of plumber and mate',
      unit: 'gang-day',
      qty: Math.round(sanitaryGangDays * 10) / 10,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: `${fittingsCount} fittings / 3 per day`,
      labour: true,
      trade: 'plumber',
      gangSize: 2,
    });
  }

  // Basic electrical (currently none for rural structures)
  if (scope.electrical === 'full' && electricalPoints > 0) {
    items.push({
      code: 'E.4',
      description: 'Electrical installation including wiring, conduit, boxes and fittings',
      unit: 'point',
      qty: electricalPoints,
      category: 'Services',
      section: 'E',
      source: 'input',
      formula: 'electrical_points from plan',
    });
  }

  return items;
}

// ------------------------------------------------------------
// Rate lookup (unchanged)
// ------------------------------------------------------------
function getRateForItem(item) {
  const map = {
    'A.1':   0.50,
    'A.2':   12.50,
    'A.3':   8.00,
    'A.4':   DEFAULT_PRICES.hardcore_m3,
    'A.5':   DEFAULT_PRICES.river_sand_m3,
    'A.6':   DEFAULT_PRICES.polythene_roll / 75,
    'A.7':   DEFAULT_PRICES.termite_liquid_l,
    'A.8.1': DEFAULT_PRICES.cement_50kg,
    'A.8.2': DEFAULT_PRICES.river_sand_m3,
    'A.8.3': DEFAULT_PRICES.crushed_stone_m3,
    'A.9':   DEFAULT_PRICES.steel_bar_kg,
    'A.10':  DEFAULT_PRICES.brick_common,
    'A.10.1': DEFAULT_PRICES.cement_50kg,
    'A.10.2': DEFAULT_PRICES.pit_sand_m3,
    'A.11':  DEFAULT_PRICES.brickforce_roll / 20,
    'A.12':  DEFAULT_PRICES.dpc_roll / 20,

    'B.1.1': DEFAULT_PRICES.cement_50kg,
    'B.1.2': DEFAULT_PRICES.river_sand_m3,
    'B.1.3': DEFAULT_PRICES.crushed_stone_m3,
    'B.2':   DEFAULT_PRICES.steel_mesh_S193,
    'B.3':   DEFAULT_PRICES.brick_common,
    'B.3.1': DEFAULT_PRICES.cement_50kg,
    'B.3.2': DEFAULT_PRICES.pit_sand_m3,
    'B.4':   DEFAULT_PRICES.brickforce_roll / 20,
    'B.5':   25.00,
    'B.6':   1.50,

    'C.1':   DEFAULT_PRICES.truss_8m,
    'C.2':   DEFAULT_PRICES.purlin_50x75,
    'C.3':   DEFAULT_PRICES.roofing_ibr_sheet,
    'C.3.1': 0.30,
    'C.3.2': DEFAULT_PRICES.ridge_cap_m,
    'C.3.3': DEFAULT_PRICES.barge_board_m,
    'C.4':   DEFAULT_PRICES.roof_timber_50x50 / 3,
    'C.5':   DEFAULT_PRICES.gutter_150mm_m,
    'C.5.1': DEFAULT_PRICES.downpipe_110mm_m,

    'D.1.1': DEFAULT_PRICES.cement_50kg,
    'D.1.2': DEFAULT_PRICES.pit_sand_m3,
    'D.2.1': DEFAULT_PRICES.cement_50kg,
    'D.2.2': DEFAULT_PRICES.pit_sand_m3,
    'D.3':   DEFAULT_PRICES.plaster_rhinoset_25kg,
    'D.4.1': DEFAULT_PRICES.cement_50kg,
    'D.5':   DEFAULT_PRICES.floor_tile_m2,
    'D.6':   DEFAULT_PRICES.floor_tile_m2,
    'D.7':   DEFAULT_PRICES.wall_tile_m2,
    'D.7.1': DEFAULT_PRICES.tile_adhesive_20kg,
    'D.7.2': DEFAULT_PRICES.tylon_5kg,
    'D.8':   DEFAULT_PRICES.paint_pva_20l / 20,
    'D.9':   DEFAULT_PRICES.paint_ext_pva_20l / 20,
    'D.10':  DEFAULT_PRICES.ceiling_board_2400x1200,
    'D.10.1': DEFAULT_PRICES.ceiling_brandering_38x38 / 3,
    'D.10.2': DEFAULT_PRICES.clout_nail_kg,
    'D.10.3': DEFAULT_PRICES.covebond_25kg,
    'D.11':  DEFAULT_PRICES.paint_ceiling_20l / 20,
    'D.12':  DEFAULT_PRICES.skirting_m,
    'D.13':  DEFAULT_PRICES.cornice_m,

    'E.1':   2.50,
    'E.1.1': 15.00,
    'E.1.2': DEFAULT_PRICES.sewer_fittings_lot,
    'E.2':   1.70,
    'E.2.1': 10.00,
    'E.2.2': DEFAULT_PRICES.water_fittings_lot,
    'E.3':   450.00,
    'E.4':   85.00,
    'E.4.1': DEFAULT_PRICES.cable_2_5mm_100m,
    'E.4.2': DEFAULT_PRICES.db_board_12way,
    'E.4.3': DEFAULT_PRICES.electrical_fittings_lot,
  };

  return map[item.code] ?? 0;
}

export default { generateFullBOQ };
