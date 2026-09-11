// ============================================================
// VERIBUILD BOQ ENGINE - ORCHESTRATOR
// Entry point: generateFullBOQ(project)
// Returns: BOQ object with sections, items, subtotals, totals
// ============================================================

import { normaliseInputs, validateProject } from './validators.js';
import { getCityMultiplier, getPrice, DEFAULT_PRICES } from './prices.js';
import { round2 } from './utils.js';

import { calcSubstructure } from './sections/substructure.js';
import { calcSuperstructure } from './sections/superstructure.js';
import { calcRoof } from './sections/roof.js';
import { calcFinishes } from './sections/finishes.js';
import { calcServices } from './sections/services.js';
import { summariseLabour } from './sections/labour.js';

// Section letter to title
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
// Main entry point
// ------------------------------------------------------------
export function generateFullBOQ(project, options = {}) {
  const { includeContingency = true, contingencyRate = 0.05 } = options;

  // Validate and normalise
  const validation = validateProject(project);
  const inputs = normaliseInputs(project);

  // City multiplier
  const cityMultiplier = getCityMultiplier(inputs.cityId);

  // Compute each section
  const substructureItems = calcSubstructure(inputs, DEFAULT_PRICES);
  const superstructureItems = calcSuperstructure(inputs, DEFAULT_PRICES);
  const roofItems = calcRoof(inputs, DEFAULT_PRICES);
  const finishesItems = calcFinishes(inputs, DEFAULT_PRICES);
  const servicesItems = calcServices(inputs, DEFAULT_PRICES);

  // All items before labour
  const allItems = [
    ...substructureItems,
    ...superstructureItems,
    ...roofItems,
    ...finishesItems,
    ...servicesItems,
  ];

  // Attach rates and amounts
  const pricedItems = allItems.map((item) => {
    const rate = getRateForItem(item);
    const amount = round2(item.qty * rate * cityMultiplier);
    return {
      ...item,
      rate,
      amount,
    };
  });

  // Labour summary - computed from marked items
  const labourSummary = summariseLabour(pricedItems, cityMultiplier);

  // Build section subtotals
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

  // Build labour section
  if (labourSummary.items.length > 0) {
    sections.F = {
      letter: 'F',
      title: 'Labour',
      items: labourSummary.items.map((l, idx) => ({
        code: `F.${idx + 1}`,
        description: `${l.trade} labour`,
        unit: 'man-day',
        qty: l.manDays,
        rate: l.rate,
        amount: l.cost,
        category: 'Labour',
        section: 'F',
        source: 'formula',
      })),
      subtotal: labourSummary.totalCost,
    };
  }

  // Compute subtotal
  const subtotal = round2(
    Object.values(sections).reduce((sum, s) => sum + (s.subtotal || 0), 0)
  );

  // Contingency
  const contingency = includeContingency ? round2(subtotal * contingencyRate) : 0;

  // Grand total
  const grandTotal = round2(subtotal + contingency);

  // Return in a shape that is backward-compatible with existing BOQ page
  // (items array) plus new rich shape (sections, subtotals)
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
      });
    }
  }

  return {
    // New rich shape
    sections: Object.values(sections),
    summary: {
      subtotal,
      contingency,
      contingencyRate,
      grandTotal,
      cityMultiplier,
      cityId: inputs.cityId,
    },
    labour: labourSummary,
    validation,

    // Backward-compatible flat items (used by existing BOQ page)
    items: flatItems,
    totalCost: grandTotal,
  };
}

// ------------------------------------------------------------
// Rate lookup: map BOQ item to price key
// This is the bridge between calculation and pricing.
// Phase 3 will replace this with hardware store FK lookups.
// ------------------------------------------------------------
function getRateForItem(item) {
  const map = {
    // Substructure
    'A.8.1': DEFAULT_PRICES.cement_50kg,
    'A.8.2': DEFAULT_PRICES.river_sand_m3,
    'A.8.3': DEFAULT_PRICES.crushed_stone_m3,
    'A.9':   DEFAULT_PRICES.steel_bar_kg,
    'A.10':  DEFAULT_PRICES.brick_common,
    'A.10.1': DEFAULT_PRICES.cement_50kg,
    'A.10.2': DEFAULT_PRICES.pit_sand_m3,
    'A.11':  DEFAULT_PRICES.brickforce_roll / 20,
    'A.12':  DEFAULT_PRICES.dpc_roll / 20,
    'A.6':   DEFAULT_PRICES.polythene_roll / 75,
    'A.4':   DEFAULT_PRICES.hardcore_m3,
    'A.5':   DEFAULT_PRICES.river_sand_m3,
    'A.7':   DEFAULT_PRICES.termite_liquid_l,

    // Superstructure
    'B.1.1': DEFAULT_PRICES.cement_50kg,
    'B.1.2': DEFAULT_PRICES.river_sand_m3,
    'B.1.3': DEFAULT_PRICES.crushed_stone_m3,
    'B.2':   DEFAULT_PRICES.steel_mesh_S193,
    'B.3':   DEFAULT_PRICES.brick_common,
    'B.3.1': DEFAULT_PRICES.cement_50kg,
    'B.3.2': DEFAULT_PRICES.pit_sand_m3,
    'B.4':   DEFAULT_PRICES.brickforce_roll / 20,
    'B.5':   25.00, // lintel unit price
    'B.6':   1.50,  // hoop iron per piece

    // Roof
    'C.1':   DEFAULT_PRICES.truss_8m,
    'C.2':   DEFAULT_PRICES.purlin_50x75,
    'C.3':   DEFAULT_PRICES.roofing_ibr_sheet,
    'C.3.1': 0.30,  // roof screw
    'C.3.2': DEFAULT_PRICES.ridge_cap_m,
    'C.3.3': DEFAULT_PRICES.barge_board_m,
    'C.4':   DEFAULT_PRICES.roof_timber_50x50 / 3, // per m
    'C.5':   DEFAULT_PRICES.gutter_150mm_m,
    'C.5.1': DEFAULT_PRICES.downpipe_110mm_m,

    // Finishes
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
    'D.8':   DEFAULT_PRICES.paint_pva_20l / 20, // per litre
    'D.9':   DEFAULT_PRICES.paint_ext_pva_20l / 20,
    'D.10':  DEFAULT_PRICES.ceiling_board_2400x1200,
    'D.10.1': DEFAULT_PRICES.ceiling_brandering_38x38 / 3,
    'D.10.2': DEFAULT_PRICES.clout_nail_kg,
    'D.10.3': DEFAULT_PRICES.covebond_25kg,
    'D.11':  DEFAULT_PRICES.paint_ceiling_20l / 20,
    'D.12':  DEFAULT_PRICES.skirting_m,
    'D.13':  DEFAULT_PRICES.cornice_m,

    // Services
    'E.1':   2.50, // sewer pipe per m
    'E.1.1': 15.00, // sewer pipe section
    'E.1.2': DEFAULT_PRICES.sewer_fittings_lot,
    'E.2':   1.70, // water pipe per m
    'E.2.1': 10.00, // water pipe section
    'E.2.2': DEFAULT_PRICES.water_fittings_lot,
    'E.3':   DEFAULT_PRICES.wc_toilet, // per set approximation
    'E.4':   45.00, // per electrical point
    'E.4.1': DEFAULT_PRICES.cable_2_5mm_100m,
    'E.4.2': DEFAULT_PRICES.db_board_12way,
    'E.4.3': DEFAULT_PRICES.electrical_fittings_lot,
  };

  return map[item.code] ?? 0;
}

// ------------------------------------------------------------
// Export for use elsewhere
// ------------------------------------------------------------
export default { generateFullBOQ };
