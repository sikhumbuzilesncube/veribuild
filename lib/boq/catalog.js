// ============================================================
// VERIBUILD BOQ MATERIALS CATALOG
// Complete list of line items the BOQ engine produces.
// Hardware stores select from this list when adding products.
// Matching is by exact name.
// Do not rename items here without updating the BOQ engine.
// ============================================================

export const BOQ_SECTIONS = [
  {
    key: 'A',
    label: 'Substructure',
    items: [
      { code: 'A.1',    name: 'Clear site of all vegetation and rubbish',                       unit: 'm2' },
      { code: 'A.2',    name: 'Excavate trenches for strip foundations',                         unit: 'm3' },
      { code: 'A.3',    name: 'Return, fill and ram excavated material around foundations',      unit: 'm3' },
      { code: 'A.4',    name: 'Hardcore filling under floor slab',                               unit: 'm3' },
      { code: 'A.5',    name: 'Sand blinding to receive polythene damp proof membrane',          unit: 'm3' },
      { code: 'A.6',    name: '1000 gauge polythene damp proof membrane',                        unit: 'm2' },
      { code: 'A.7',    name: 'Approved chemical termite treatment',                             unit: 'litre' },
      { code: 'A.8',    name: 'Concrete Grade G20 in strip foundations',                         unit: 'm3' },
      { code: 'A.8.1',  name: 'Portland cement 50kg bags for foundation concrete',                unit: 'bag' },
      { code: 'A.8.2',  name: 'River sand for foundation concrete',                              unit: 'm3' },
      { code: 'A.8.3',  name: '19mm crushed stone aggregate for foundation concrete',            unit: 'm3' },
      { code: 'A.9',    name: 'High yield steel bar reinforcement to foundations, Y12 grade',    unit: 'kg' },
      { code: 'A.10',   name: 'Common bricks in foundation walls, one brick thick',              unit: 'nr' },
      { code: 'A.10.1', name: 'Cement 50kg bags for foundation wall mortar',                     unit: 'bag' },
      { code: 'A.10.2', name: 'Pit sand for foundation wall mortar',                             unit: 'm3' },
      { code: 'A.11',   name: 'Brickforce reinforcement in foundation brickwork',                unit: 'm' },
      { code: 'A.12',   name: 'Damp proof course, 112.5mm wide, polythene based',                unit: 'm' },
    ],
  },
  {
    key: 'B',
    label: 'Superstructure',
    items: [
      { code: 'B.1',    name: 'Concrete Grade G20 in ground floor slab',                         unit: 'm3' },
      { code: 'B.1.1',  name: 'Portland cement 50kg bags for slab concrete',                     unit: 'bag' },
      { code: 'B.1.2',  name: 'River sand for slab concrete',                                    unit: 'm3' },
      { code: 'B.1.3',  name: '19mm crushed stone aggregate for slab concrete',                  unit: 'm3' },
      { code: 'B.2',    name: 'Steel fabric reinforcement Ref S193',                             unit: 'sheet' },
      { code: 'B.3',    name: 'Common bricks in walls, one brick thick, 230mm',                  unit: 'nr' },
      { code: 'B.3.1',  name: 'Cement 50kg bags for wall mortar',                                unit: 'bag' },
      { code: 'B.3.2',  name: 'Pit sand for wall mortar',                                        unit: 'm3' },
      { code: 'B.4',    name: 'Brickforce reinforcement in walls',                               unit: 'm' },
      { code: 'B.5',    name: 'Reinforced concrete lintels over openings, 150 x 200mm',         unit: 'nr' },
      { code: 'B.6',    name: 'Galvanised hoop iron ties for wall plate fixing',                 unit: 'nr' },
    ],
  },
  {
    key: 'C',
    label: 'Roof',
    items: [
      { code: 'C.1',    name: 'Roof trusses, timber, at 900mm centres',                          unit: 'nr' },
      { code: 'C.2',    name: 'Sawn timber purlins 50 x 75mm at 1.2m centres',                   unit: 'm' },
      { code: 'C.3',    name: 'Roof sheeting IBR, 0.47mm thick',                                 unit: 'sheet' },
      { code: 'C.3.1',  name: 'Roofing screws, hook bolts and washers',                          unit: 'nr' },
      { code: 'C.3.2',  name: 'Ridge caps to roof sheeting',                                     unit: 'm' },
      { code: 'C.3.3',  name: 'Barge boards 200 x 25mm, primed',                                 unit: 'm' },
      { code: 'C.4',    name: 'Sawn timber wall plate 75 x 50mm',                                unit: 'm' },
      { code: 'C.5',    name: 'PVC rainwater gutter 150mm diameter',                             unit: 'm' },
      { code: 'C.5.1',  name: 'PVC downpipe 110mm diameter with shoe',                           unit: 'm' },
    ],
  },
  {
    key: 'D',
    label: 'Finishes',
    items: [
      { code: 'D.1',    name: 'Cement and sand render to internal walls, 12mm thick',            unit: 'm2' },
      { code: 'D.1.1',  name: 'Cement 50kg bags for internal wall plaster',                      unit: 'bag' },
      { code: 'D.1.2',  name: 'Pit sand for internal wall plaster',                              unit: 'm3' },
      { code: 'D.2',    name: 'Cement and sand render to external walls, 15mm thick',            unit: 'm2' },
      { code: 'D.2.1',  name: 'Cement 50kg bags for external wall plaster',                      unit: 'bag' },
      { code: 'D.2.2',  name: 'Pit sand for external wall plaster',                              unit: 'm3' },
      { code: 'D.3',    name: 'Rhinoset skim coat to internal plastered walls',                  unit: 'bag' },
      { code: 'D.4',    name: 'Cement and sand screed to floor, 40mm thick',                     unit: 'm2' },
      { code: 'D.4.1',  name: 'Cement 50kg bags for floor screed',                               unit: 'bag' },
      { code: 'D.5',    name: 'Ceramic floor tiles 400 x 400mm',                                 unit: 'm2' },
      { code: 'D.6',    name: 'Ceramic floor tiles 300 x 300mm, slip resistant',                 unit: 'm2' },
      { code: 'D.7',    name: 'Ceramic wall tiles 150 x 150mm',                                  unit: 'm2' },
      { code: 'D.7.1',  name: 'Tile adhesive 20kg bags',                                         unit: 'bag' },
      { code: 'D.7.2',  name: 'Tylon tile grout 5kg bags',                                       unit: 'bag' },
      { code: 'D.8',    name: 'Internal emulsion paint to walls',                                unit: 'litre' },
      { code: 'D.9',    name: 'External emulsion paint to walls',                                unit: 'litre' },
      { code: 'D.10',   name: 'Plasterboard ceiling 2400 x 1200 x 6mm',                          unit: 'sheet' },
      { code: 'D.10.1', name: 'Sawn timber brandering 38 x 38mm at 400mm centres',               unit: 'm' },
      { code: 'D.10.2', name: 'Clout nails for ceiling board fixing',                            unit: 'kg' },
      { code: 'D.10.3', name: 'Covebond 25kg bags for ceiling board jointing',                   unit: 'bag' },
      { code: 'D.11',   name: 'Ceiling white emulsion paint to plasterboard ceilings',           unit: 'litre' },
      { code: 'D.12',   name: 'Sawn timber skirting 100 x 19mm',                                 unit: 'm' },
      { code: 'D.13',   name: 'Gypsum cornice 90mm',                                             unit: 'm' },
    ],
  },
  {
    key: 'E',
    label: 'Services',
    items: [
      { code: 'E.1',    name: 'PVC sewer pipe 110mm diameter',                                   unit: 'm' },
      { code: 'E.1.2',  name: 'Sewer pipe fittings, bends, junctions, inspection chambers',      unit: 'sum' },
      { code: 'E.2',    name: 'PEX water pipe 15mm diameter',                                    unit: 'm' },
      { code: 'E.2.2',  name: 'Water pipe fittings, elbows, tees, stop cocks',                   unit: 'sum' },
      { code: 'E.3',    name: 'Sanitary fittings including WC, basin, bath or shower',           unit: 'set' },
      { code: 'E.4',    name: 'Electrical installation including wiring, conduit, boxes',        unit: 'point' },
      { code: 'E.4.1',  name: 'PVC insulated cable 2.5mm2, 100m rolls',                          unit: 'roll' },
      { code: 'E.4.2',  name: 'Distribution board 12-way',                                       unit: 'nr' },
      { code: 'E.4.3',  name: 'Electrical accessories including sockets, switches, light fittings', unit: 'sum' },
    ],
  },
];

// Flat lookup by name
export const CATALOG_BY_NAME = Object.fromEntries(
  BOQ_SECTIONS.flatMap((s) => s.items.map((it) => [it.name, it]))
);

// Flat lookup by code
export const CATALOG_BY_CODE = Object.fromEntries(
  BOQ_SECTIONS.flatMap((s) => s.items.map((it) => [it.code, it]))
);

// Flat list, for iteration
export const CATALOG_FLAT = BOQ_SECTIONS.flatMap((s) =>
  s.items.map((it) => ({ ...it, section: s.key, sectionLabel: s.label }))
);

export function findCatalogItem(name) {
  return CATALOG_BY_NAME[name] || null;
}

export function getUnitForItem(name) {
  const item = CATALOG_BY_NAME[name];
  return item ? item.unit : 'nr';
}

export default {
  BOQ_SECTIONS,
  CATALOG_BY_NAME,
  CATALOG_BY_CODE,
  CATALOG_FLAT,
  findCatalogItem,
  getUnitForItem,
};
