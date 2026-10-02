// ============================================================
// VERIBUILD - SHARED CITY LIST
// Used by new-project, template, verify, and BOQ pages.
// IDs are stable. Do not reorder or remove entries.
// ============================================================

export const CITIES = [
  // Harare Province
  { id: 1,  name: 'Harare',            province: 'Harare' },
  { id: 2,  name: 'Chitungwiza',       province: 'Harare' },
  { id: 3,  name: 'Epworth',           province: 'Harare' },
  { id: 4,  name: 'Ruwa',              province: 'Harare' },

  // Bulawayo Province
  { id: 5,  name: 'Bulawayo',          province: 'Bulawayo' },

  // Manicaland
  { id: 6,  name: 'Mutare',            province: 'Manicaland' },
  { id: 7,  name: 'Rusape',            province: 'Manicaland' },
  { id: 8,  name: 'Chipinge',          province: 'Manicaland' },
  { id: 9,  name: 'Nyanga',            province: 'Manicaland' },
  { id: 10, name: 'Buhera',            province: 'Manicaland' },

  // Mashonaland Central
  { id: 11, name: 'Bindura',           province: 'Mashonaland Central' },
  { id: 12, name: 'Shamva',            province: 'Mashonaland Central' },
  { id: 13, name: 'Mvurwi',            province: 'Mashonaland Central' },
  { id: 14, name: 'Guruve',            province: 'Mashonaland Central' },
  { id: 15, name: 'Muzarabani',        province: 'Mashonaland Central' },

  // Mashonaland East
  { id: 16, name: 'Marondera',         province: 'Mashonaland East' },
  { id: 17, name: 'Mutoko',            province: 'Mashonaland East' },
  { id: 18, name: 'Murehwa',           province: 'Mashonaland East' },
  { id: 19, name: 'Goromonzi',         province: 'Mashonaland East' },
  { id: 20, name: 'Chivhu',            province: 'Mashonaland East' },

  // Mashonaland West
  { id: 21, name: 'Chinhoyi',          province: 'Mashonaland West' },
  { id: 22, name: 'Karoi',             province: 'Mashonaland West' },
  { id: 23, name: 'Chegutu',           province: 'Mashonaland West' },
  { id: 24, name: 'Kadoma',            province: 'Mashonaland West' },
  { id: 25, name: 'Norton',            province: 'Mashonaland West' },
  { id: 26, name: 'Kariba',            province: 'Mashonaland West' },
  { id: 27, name: 'Banket',            province: 'Mashonaland West' },
  { id: 28, name: 'Zvimba',            province: 'Mashonaland West' },

  // Masvingo Province
  { id: 29, name: 'Masvingo',          province: 'Masvingo' },
  { id: 30, name: 'Chiredzi',          province: 'Masvingo' },
  { id: 31, name: 'Triangle',          province: 'Masvingo' },
  { id: 32, name: 'Zvishavane',        province: 'Masvingo' },
  { id: 33, name: 'Gutu',              province: 'Masvingo' },
  { id: 34, name: 'Bikita',            province: 'Masvingo' },

  // Matabeleland North
  { id: 35, name: 'Hwange',            province: 'Matabeleland North' },
  { id: 36, name: 'Victoria Falls',    province: 'Matabeleland North' },
  { id: 37, name: 'Lupane',            province: 'Matabeleland North' },
  { id: 38, name: 'Tsholotsho',        province: 'Matabeleland North' },

  // Matabeleland South
  { id: 39, name: 'Gwanda',            province: 'Matabeleland South' },
  { id: 40, name: 'Beitbridge',        province: 'Matabeleland South' },
  { id: 41, name: 'Plumtree',          province: 'Matabeleland South' },

  // Midlands
  { id: 42, name: 'Gweru',             province: 'Midlands' },
  { id: 43, name: 'Kwekwe',            province: 'Midlands' },
  { id: 44, name: 'Shurugwi',          province: 'Midlands' },
  { id: 45, name: 'Gokwe',             province: 'Midlands' },
  { id: 46, name: 'Mberengwa',         province: 'Midlands' },
  { id: 47, name: 'Redcliff',          province: 'Midlands' },
];

// Fast lookup by ID → name
export const CITY_NAMES = Object.fromEntries(
  CITIES.map((c) => [c.id, c.name])
);

// Fast lookup by name → city object
export const CITY_BY_NAME = Object.fromEntries(
  CITIES.map((c) => [c.name, c])
);
