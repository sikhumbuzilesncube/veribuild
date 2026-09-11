// ============================================================
// VERIBUILD BOQ ENGINE - CONVERSION TABLES
// Source: Zimbabwe QS Estimating Data workbook
// All tables are authoritative. Changes require QS sign-off.
// ============================================================

// ------------------------------------------------------------
// CONCRETE MIX - per cubic metre of finished concrete
// Zimbabwe grades: G10 (blinding), G15 (foundation),
// G20 (ground slab), G25 (structural), G30 (suspended slab)
// ------------------------------------------------------------
export const CONCRETE_MIX = {
  G10: { cement: 5.0,  sand: 0.80, stone: 0.80 },
  G15: { cement: 6.0,  sand: 0.80, stone: 0.80 },
  G20: { cement: 7.0,  sand: 0.74, stone: 0.77 },
  G25: { cement: 9.26, sand: 0.70, stone: 0.78 },
  G30: { cement: 10.29, sand: 0.65, stone: 0.78 },
};

// ------------------------------------------------------------
// BRICKWORK - bricks per square metre of wall (no waste)
// ------------------------------------------------------------
export const BRICKS_PER_M2 = {
  halfBrick: 52,
  oneBrick: 104,
  oneAndHalf: 156,
  brickOnEdge: 35,
  perM3: 455,
};

// Mortar required per square metre of wall (m3)
export const MORTAR_PER_M2 = {
  brickOnEdge_75mm: 0.020,
  halfBrick: 0.028,
  oneBrick: 0.040,
  oneAndHalf: 0.096,
};

// ------------------------------------------------------------
// MORTAR MIX - per cubic metre of finished mortar
// ------------------------------------------------------------
export const MORTAR_MIX = {
  "1:3": { cement: 10.6, sand: 1.3 },
  "1:4": { cement: 8.9,  sand: 1.4 },
  "1:5": { cement: 7.5,  sand: 1.5 },
  "1:6": { cement: 6.5,  sand: 1.6 },
  "1:8": { cement: 5.4,  sand: 1.7 },
};

// ------------------------------------------------------------
// STEEL REINFORCEMENT
// ------------------------------------------------------------
export const STEEL_KG_PER_M3 = {
  bases: 90,
  columns: 170,
  walls: 100,
  slabs: 120,
  beams: 150,
};

// Bar weight in kg per linear metre
export const STEEL_KG_PER_M = {
  6: 0.222,
  8: 0.395,
  10: 0.616,
  12: 0.888,
  16: 1.579,
  20: 2.466,
  25: 3.854,
};

// Fabric reinforcement kg per square metre
export const FABRIC_KG_PER_M2 = {
  S245: 2.45,
  S193: 1.93,
  S125: 1.25,
};

// ------------------------------------------------------------
// ROOFING
// ------------------------------------------------------------
// Roof area multiplier by pitch in degrees
export const PITCH_FACTOR = {
  15: 1.035,
  20: 1.064,
  22.5: 1.082,
  25: 1.103,
  30: 1.155,
  35: 1.221,
  40: 1.305,
};

// Coverage per square metre by roof type
export const ROOF_COVERAGE = {
  IBR: {
    m2PerSheet: 0.9,
    fixingsPerM2: 6,
    ridgeCapPerM2: 0.12,   // linear m per m2 roof
    bargeBoardPerM2: 0.10,
  },
  Chromadek: {
    m2PerSheet: 0.9,
    fixingsPerM2: 6,
    ridgeCapPerM2: 0.12,
    bargeBoardPerM2: 0.10,
  },
  ConcreteTile: {
    tilesPerM2: 14.7,
    battensPerM2: 3.2,
    nailsKgPerM2: 0.1,
    ridgeCapPerM2: 0.15,
    bargeBoardPerM2: 0.12,
  },
  ClayTile: {
    tilesPerM2: 16,
    battensPerM2: 3.5,
    nailsKgPerM2: 0.1,
    ridgeCapPerM2: 0.15,
    bargeBoardPerM2: 0.12,
  },
};

// ------------------------------------------------------------
// FINISHES
// ------------------------------------------------------------
export const PLASTER = {
  // Per square metre of wall (m3 of sand, bags of cement)
  render:    { sand: 0.0252, cement: 0.1814 },
  woodfloat: { sand: 0.0231, cement: 0.2217 },
  // Rhinoset skim coat - bags of 25kg per m2
  rhinoset25kg: 0.0525,
};

// Paint coverage in square metres per 5 litres
export const PAINT_COVERAGE = {
  pvaBoards_1st: 30,
  pvaBoards_subsequent: 45,
  pvaPlaster_1st: 40,
  pvaPlaster_subsequent: 50,
  pvaBlockwork_1st: 40,
  pvaBlockwork_subsequent: 42,
  primerSteel_1st: 45,
  primerSteel_subsequent: 50,
  primerTimber_1st: 35,
  primerTimber_subsequent: 45,
};

export const TILING = {
  tilesPerM2_150: 52.5,
  tilesPerM2_300: 11.1,
  tilesPerM2_400: 6.25,
  tilesPerM2_600: 2.78,
  quarryTilesPerM2_150: 44.4,
  vinylTilesPerM2_300: 11.1,
  tylonKgPerM2: 0.1,
  adhesiveKgPerM2: 0.167,
};

export const CEILING = {
  boardSize_m2: 2.88,
  boardSizeSmall_m2: 2.52,
  cloutNailsPerM2: 10.5,
  branderingPerM2: 5.0,
  covebond25kgPerM2: 0.0525,
  ceilingWhiteLitresPerM2: 0.202,
};

// ------------------------------------------------------------
// DPC AND WATERPROOFING
// ------------------------------------------------------------
export const DPC = {
  rollWidth_m: 1.5,
  rollLength_m: 20,
  linearMetersPerRoll: 20,
  m2PerRoll: 30,
};

export const POLYTHENE = {
  rollWidth_m: 1.5,
  rollLength_m: 50,
  m2PerRoll: 75,
};

// ------------------------------------------------------------
// REINFORCEMENT ACCESSORIES
// ------------------------------------------------------------
export const REINFORCEMENT_ACCESSORIES = {
  brickforcePerM2: 2.94,   // linear metres per m2 of wall (every 4 courses)
  hoopIronKgPerM3: 6.20,   // kg per m3 of brickwork
};

// ------------------------------------------------------------
// SITE WORKS
// ------------------------------------------------------------
export const SITE = {
  hardcoreThickness_m: 0.15,
  sandBlindingThickness_m: 0.05,
  termiteLiquidLPerM2: 0.109,
};

// ------------------------------------------------------------
// LABOUR PRODUCTIVITY
// Rates taken from Zimbabwe estimating data sheet
// ------------------------------------------------------------
export const LABOUR_PRODUCTIVITY = {
  excavation: {
    // Cubic metres per labourer per day
    trench_lt_1m: 2.0,
    trench_1_2m: 1.5,
    trench_2_3m: 1.0,
    bases_lt_1m: 1.75,
    reduceLevels_lt_1m: 2.2,
    hardPickableMultiplier: 3.5,   // divide output by this
    rockMultiplier: 13.0,
  },
  disposal: {
    backfillTrenches: 2.5,
    looseFill: 3.0,
    ramFill: 2.0,
    compacting_m2: 35,
    loadForDisposal: 1.5,
  },
  brickwork: {
    // Bricks laid per day - gang of 1 bricklayer + 2 assistants
    halfBrick_foundation: 375,
    oneBrick_foundation: 400,
    oneAndHalf_foundation: 425,
    halfBrick_super: 350,
    oneBrick_super: 380,
    oneAndHalf_super: 400,
  },
  blockwork: {
    block115_foundation: 180,
    block115_super: 150,
    block230_foundation: 150,
    block230_super: 120,
  },
  concreting: {
    // Hours per cubic metre
    massFill: 2,
    foundations: 4,
    slabs: 6,
    blinding: 12,
    columnsBelowGround: 8,
    columns4m: 12,
    beams4m: 10,
    suspendedSlabs: 10,
    walls: 8,
    isolatedSmallAreas: 12,
    mixingByHand: 8,
  },
  steelFixing: {
    // Tonnes per labourer per day
    beamsFloorsRoofsWalls: 1.0,
    columns: 0.5,
    hoisting3m: 4.0,
    hoisting9m: 2.5,
  },
  formwork: {
    // Gang-hours per square metre (gang of 1 carpenter + 2 assistants)
    beams: 0.85,
    walls: 0.75,
    columns: 1.15,
    soffits: 0.80,
    narrowWidths: 2.15,
  },
  plastering: {
    // Square metres per day (gang of 1 + 2)
    singleCoatWood_lt_1m: 16,
    singleCoatWood_narrow: 10,
    singleCoatSteel_lt_1m: 14,
    singleCoatSteel_narrow: 8,
    singleCoatSoffits_wood: 12,
    singleCoatSoffits_steel: 10,
    twoCoat_first: 16,
    twoCoat_skim: 23,
    screeds: 20,
    screeds_narrow: 16,
  },
  tiling: {
    ceramicWall: 6,
    quarry: 10,
    sloping: 3,
    vinyl_boxes: 10,
    vinyl_sheets: 20,
    concreteRoofTiles: 100,
  },
  plumbing: {
    sanitaryFittings: 3,     // number per day
    waterPipe: 30,           // metres per day
    sewerPipe: 59,
    guttersDownpipes: 14,
  },
  carpentry: {
    fixPurlins: 20,          // metres per hour
    fixRafters: 14,
    fixTrusses_8m: 4,        // number per day
    fixJoists: 15,
    fixHangers: 3,
    fixBrandering: 3,        // square metres per hour
    fixCeilings: 2,
    fixCoverStrip: 20,       // metres per hour
    fixCornice: 15,
    fixSkirting: 10,
    fixFraming: 6,
    hangDoors: 1,            // number per hour
  },
  roofing: {
    ibrSheeting_m2PerHr: 6,
    tilingBattens_m2PerHr: 3.33,
    bargeFascia_mPerHr: 5,
    mitring_sheetsPerHr: 20,
    fixSheets_sheetsPerHr: 6,
  },
  painting: {
    ceiling_m2PerDay: 60,
    walls_m2PerDay: 50,
    frames_m2PerDay: 45,
    timber_m2PerDay: 25,
  },
  siteClearance: {
    clearVegetation_m2PerDay: 20,
  },
  hauling: {
    lt20m: 180,   // wheelbarrows per day
    lt50m: 70,
    lt100m: 36,
  },
};

// ------------------------------------------------------------
// WASTE FACTORS
// Applied on top of computed quantity, by material type
// ------------------------------------------------------------
export const WASTE = {
  cement: 0.05,
  sand: 0.10,
  stone: 0.10,
  bricks: 0.05,
  blocks: 0.05,
  steel: 0.05,
  tiles: 0.10,
  paint: 0.05,
  timber: 0.10,
  roofing: 0.05,
  plaster: 0.10,
  default: 0.05,
};

// ------------------------------------------------------------
// UNIT CONVERSIONS
// ------------------------------------------------------------
export const CONVERSIONS = {
  cementBagKg: 50,
  cementBagM3: 0.034,
  sandTonnePerM3: 1.6,
  stoneTonnePerM3: 1.5,
  wheelbarrowM3: 0.057,
};

export const DEFAULT_GRADES = {
  foundation: 'G20',
  slab: 'G20',
  blinding: 'G10',
  columns: 'G25',
  beams: 'G25',
  suspendedSlab: 'G30',
};

export const DEFAULT_WALL_THICKNESS_MM = 230;
export const DEFAULT_ROOF_TYPE = 'IBR';
export const DEFAULT_ROOF_PITCH = 22.5;
export const DEFAULT_STOREYS = 1;
