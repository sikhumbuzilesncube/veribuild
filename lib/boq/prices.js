// ============================================================
// VERIBUILD BOQ ENGINE - DEFAULT PRICES
// Zimbabwe 2025 fallback prices in USD
// When hardware stores are subscribed, live prices override these.
// ============================================================

export const DEFAULT_PRICES = {
  // Cement
  cement_50kg: 11.00,

  // Aggregates
  river_sand_m3: 25.00,
  pit_sand_m3: 20.00,
  crushed_stone_m3: 35.00,
  hardcore_m3: 22.00,

  // Bricks and blocks
  brick_common: 0.35,
  brick_face: 0.55,
  block_115mm: 1.20,
  block_230mm: 2.20,

  // Steel
  steel_rebar_12mm: 8.50,
  steel_rebar_16mm: 15.00,
  steel_bar_kg: 1.80,
  steel_mesh_S193: 45.00,
  brickforce_roll: 18.00,
  binding_wire_kg: 2.50,

  // Roofing
  roofing_ibr_sheet: 12.50,
  roofing_chromadek: 18.00,
  roofing_nail_kg: 3.50,
  concrete_tile: 1.50,
  roof_timber_50x50: 4.50,
  roof_timber_100x50: 8.00,
  purlin_50x75: 9.00,
  truss_8m: 85.00,
  ridge_cap_m: 6.00,
  barge_board_m: 5.00,
  fascia_board_m: 6.50,
  gutter_150mm_m: 8.00,
  downpipe_110mm_m: 9.00,

  // DPC and waterproofing
  dpc_roll: 25.00,
  polythene_roll: 45.00,
  termite_liquid_l: 12.00,

  // Finishes
  floor_tile_m2: 15.00,
  wall_tile_m2: 12.00,
  quarry_tile_m2: 18.00,
  vinyl_tile_m2: 20.00,
  tile_adhesive_20kg: 8.00,
  tylon_5kg: 6.00,
  grout_5kg: 5.00,
  plaster_rhinoset_25kg: 12.00,
  plaster_rhinobond_25kg: 14.00,
  paint_pva_20l: 60.00,
  paint_undercoat_20l: 55.00,
  paint_gloss_5l: 18.00,
  paint_metal_primer_5l: 16.00,
  paint_wood_primer_5l: 15.00,
  paint_ceiling_20l: 65.00,
  paint_ext_pva_20l: 70.00,
  ceiling_board_2400x1200: 11.00,
  ceiling_brandering_38x38: 3.50,
  clout_nail_kg: 4.50,
  covebond_25kg: 15.00,
  cornice_m: 2.50,
  skirting_m: 4.00,
  varnish_5l: 22.00,

  // Doors and windows
  door_frame_steel_230mm: 45.00,
  door_frame_steel_115mm: 38.00,
  door_panel_flush: 55.00,
  door_panel_paneled: 85.00,
  door_ironmongery_set: 25.00,
  window_frame_steel_basic: 65.00,
  window_glazing_m2: 35.00,

  // Plumbing
  pipe_pvc_110mm_6m: 15.00,
  pipe_pvc_50mm_6m: 10.00,
  pipe_pex_15mm_6m: 8.00,
  sewer_fittings_lot: 120.00,
  water_fittings_lot: 90.00,
  wc_toilet: 120.00,
  basin: 65.00,
  bath_tub: 250.00,
  shower_mixer: 90.00,
  kitchen_sink: 95.00,
  water_tank_2500l: 350.00,
  geyser_150l: 400.00,

  // Electrical
  cable_2_5mm_100m: 45.00,
  cable_1_5mm_100m: 35.00,
  conduit_20mm_3m: 3.50,
  db_board_12way: 85.00,
  socket_15a: 6.00,
  switch_1gang: 4.00,
  light_fitting_basic: 15.00,
  electrical_fittings_lot: 250.00,

  // Formwork
  plywood_sheet_18mm: 45.00,
  formwork_timber_m: 4.00,
  formwork_prop: 12.00,
  formwork_oil_l: 6.00,

  // Labour - daily rates USD
  labour_general: 8.00,
  labour_bricklayer: 15.00,
  labour_carpenter: 15.00,
  labour_plumber: 18.00,
  labour_electrician: 18.00,
  labour_painter: 12.00,
  labour_tiler: 15.00,
  labour_steel_fixer: 15.00,
  labour_roofer: 15.00,
  labour_supervisor: 25.00,
  labour_foreman: 30.00,

  // Preliminaries (lump sums)
  prelim_site_establishment: 200.00,
  prelim_site_clearance_m2: 0.50,
  prelim_scaffolding_m2: 1.50,
  prelim_water_per_day: 15.00,
  prelim_power_per_day: 10.00,
  prelim_safety_equipment: 150.00,
};

// City regional multipliers relative to Harare baseline
export const CITY_MULTIPLIERS = {
  1: { name: 'Harare', multiplier: 1.00 },
  2: { name: 'Bulawayo', multiplier: 0.95 },
  3: { name: 'Mutare', multiplier: 0.97 },
  4: { name: 'Gweru', multiplier: 0.96 },
  5: { name: 'Kwekwe', multiplier: 0.95 },
  6: { name: 'Masvingo', multiplier: 0.95 },
  7: { name: 'Chinhoyi', multiplier: 0.97 },
  8: { name: 'Marondera', multiplier: 0.98 },
};

export function getPrice(key, cityId = 1) {
  const base = DEFAULT_PRICES[key] ?? 0;
  const mult = CITY_MULTIPLIERS[cityId]?.multiplier ?? 1.0;
  return Math.round(base * mult * 100) / 100;
}

export function getCityMultiplier(cityId) {
  return CITY_MULTIPLIERS[cityId]?.multiplier ?? 1.0;
  }
