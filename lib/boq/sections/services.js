// ============================================================
// VERIBUILD BOQ ENGINE - SERVICES
// Water, sewer, electrical, sanitary fittings
// ============================================================

import { LABOUR_PRODUCTIVITY, WASTE } from '../conversions.js';
import { round1, ceilNum, withWaste } from '../utils.js';

export function calcServices(inputs, prices) {
  const items = [];

  const {
    brownSewerLength,
    blueWaterLength,
    electricalPoints,
    plumbingPoints,
    rooms,
    doors,
    windows,
  } = inputs;

  // ----------------------------------------------------------
  // E.1 Sewer drainage
  // ----------------------------------------------------------
  if (brownSewerLength > 0) {
    const sewerPipes = ceilNum(brownSewerLength / 6); // 6m per pipe section

    items.push({
      code: 'E.1',
      description: 'PVC sewer pipe 110mm diameter, laid in trenches and bedded',
      unit: 'm',
      qty: round1(brownSewerLength),
      category: 'Services',
      section: 'E',
      source: 'input',
      formula: 'brown_sewer_length from plan',
    });

    items.push({
      code: 'E.1.1',
      description: 'Sewer pipe sections 110mm x 6m',
      unit: 'nr',
      qty: sewerPipes,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'sewerLength / 6m per section',
      parentCode: 'E.1',
    });

    items.push({
      code: 'E.1.2',
      description: 'Sewer pipe fittings, bends, junctions, inspection chambers',
      unit: 'sum',
      qty: 1,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'provisional sum',
      parentCode: 'E.1',
    });

    const sewerGangDays = brownSewerLength / LABOUR_PRODUCTIVITY.plumbing.sewerPipe;
    items.push({
      code: 'E.1.3',
      description: 'Labour for laying sewer pipes, measured as gang-days of plumber and mate',
      unit: 'gang-day',
      qty: round1(sewerGangDays),
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: `sewerLength / ${LABOUR_PRODUCTIVITY.plumbing.sewerPipe} m per day`,
      labour: true,
      trade: 'plumber',
      gangSize: 2,
      parentCode: 'E.1',
    });
  }

  // ----------------------------------------------------------
  // E.2 Water supply
  // ----------------------------------------------------------
  if (blueWaterLength > 0) {
    const waterPipes = ceilNum(blueWaterLength / 6);

    items.push({
      code: 'E.2',
      description: 'PEX water pipe 15mm diameter, in walls and under floors',
      unit: 'm',
      qty: round1(blueWaterLength),
      category: 'Services',
      section: 'E',
      source: 'input',
      formula: 'blue_water_length from plan',
    });

    items.push({
      code: 'E.2.1',
      description: 'Water pipe sections 15mm x 6m',
      unit: 'nr',
      qty: waterPipes,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'waterLength / 6m per section',
      parentCode: 'E.2',
    });

    items.push({
      code: 'E.2.2',
      description: 'Water pipe fittings, elbows, tees, stop cocks',
      unit: 'sum',
      qty: 1,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'provisional sum',
      parentCode: 'E.2',
    });

    const waterGangDays = blueWaterLength / LABOUR_PRODUCTIVITY.plumbing.waterPipe;
    items.push({
      code: 'E.2.3',
      description: 'Labour for laying water pipes, measured as gang-days of plumber and mate',
      unit: 'gang-day',
      qty: round1(waterGangDays),
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: `waterLength / ${LABOUR_PRODUCTIVITY.plumbing.waterPipe} m per day`,
      labour: true,
      trade: 'plumber',
      gangSize: 2,
      parentCode: 'E.2',
    });
  }

  // ----------------------------------------------------------
  // E.3 Sanitary fittings
  // ----------------------------------------------------------
  // Assume one set per wet room, minimum 1
  const sanitarySets = Math.max(plumbingPoints, 3);
  items.push({
    code: 'E.3',
    description: 'Sanitary fittings including WC, basin, bath or shower, taps and traps',
    unit: 'set',
    qty: sanitarySets,
    category: 'Services',
    section: 'E',
    source: 'input',
    formula: 'plumbing_points or default 3 sets',
  });

  const sanitaryGangDays = sanitarySets / LABOUR_PRODUCTIVITY.plumbing.sanitaryFittings;
  items.push({
    code: 'E.3.1',
    description: 'Labour for installing sanitary fittings, measured as gang-days of plumber and mate',
    unit: 'gang-day',
    qty: round1(sanitaryGangDays),
    category: 'Services',
    section: 'E',
    source: 'formula',
    formula: `${sanitarySets} fittings / ${LABOUR_PRODUCTIVITY.plumbing.sanitaryFittings} per day`,
    labour: true,
    trade: 'plumber',
    gangSize: 2,
    parentCode: 'E.3',
  });

  // ----------------------------------------------------------
  // E.4 Electrical installation
  // ----------------------------------------------------------
  if (electricalPoints > 0) {
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

    const cableRolls = ceilNum(electricalPoints * 12 / 100); // ~12m per point / 100m roll
    items.push({
      code: 'E.4.1',
      description: 'PVC insulated cable 2.5mm2, 100m rolls',
      unit: 'roll',
      qty: cableRolls,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'electricalPoints * 12m per point / 100m roll',
      parentCode: 'E.4',
    });

    items.push({
      code: 'E.4.2',
      description: 'Distribution board 12-way with main switch and circuit breakers',
      unit: 'nr',
      qty: 1,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'one distribution board per installation',
      parentCode: 'E.4',
    });

    items.push({
      code: 'E.4.3',
      description: 'Electrical accessories including sockets, switches, light fittings',
      unit: 'sum',
      qty: 1,
      category: 'Services',
      section: 'E',
      source: 'formula',
      formula: 'provisional sum',
      parentCode: 'E.4',
    });
  }

  return items;
}
