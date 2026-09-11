// ============================================================
// VERIBUILD BOQ ENGINE - LABOUR SUMMARY
// Aggregates labour items into Section F
// Reports gang-days (crew time) and man-days (total effort)
// ============================================================

import { DEFAULT_PRICES } from '../prices.js';
import { round1, round2 } from '../utils.js';

const TRADE_DAILY_RATES = {
  general:      DEFAULT_PRICES.labour_general,
  bricklayer:   DEFAULT_PRICES.labour_bricklayer,
  carpenter:    DEFAULT_PRICES.labour_carpenter,
  plumber:      DEFAULT_PRICES.labour_plumber,
  electrician:  DEFAULT_PRICES.labour_electrician,
  painter:      DEFAULT_PRICES.labour_painter,
  tiler:        DEFAULT_PRICES.labour_tiler,
  steel_fixer:  DEFAULT_PRICES.labour_steel_fixer,
  roofer:       DEFAULT_PRICES.labour_roofer,
  supervisor:   DEFAULT_PRICES.labour_supervisor,
  foreman:      DEFAULT_PRICES.labour_foreman,
};

const TRADE_LABELS = {
  general:      'General labourer',
  bricklayer:   'Bricklayer',
  carpenter:    'Carpenter',
  plumber:      'Plumber',
  electrician:  'Electrician',
  painter:      'Painter',
  tiler:        'Tiler',
  steel_fixer:  'Steel fixer',
  roofer:       'Roofer',
  supervisor:   'Supervisor',
  foreman:      'Foreman',
};

const GANG_DESCRIPTION = {
  general:      '1 labourer',
  bricklayer:   '1 bricklayer and 2 assistants',
  carpenter:    '1 carpenter and 2 assistants',
  plumber:      '1 plumber and 1 assistant',
  electrician:  '1 electrician and 1 assistant',
  painter:      '1 painter and 1 assistant',
  tiler:        '1 tiler and 1 assistant',
  steel_fixer:  '1 steel fixer and 2 assistants',
  roofer:       '1 roofer and 4 assistants',
  supervisor:   '1 supervisor',
  foreman:      '1 foreman',
};

export function summariseLabour(items, cityMultiplier = 1.0) {
  const byTrade = {};

  for (const item of items) {
    if (!item.labour) continue;

    const trade = item.trade || 'general';
    const gangDays = item.qty;
    const gangSize = item.gangSize || 1;
    const manDays = gangDays * gangSize;

    if (!byTrade[trade]) {
      byTrade[trade] = {
        trade,
        gangDays: 0,
        manDays: 0,
        gangSize,
      };
    }
    byTrade[trade].gangDays += gangDays;
    byTrade[trade].manDays += manDays;
  }

  const labourItems = [];
  let totalGangDays = 0;
  let totalManDays = 0;
  let totalCost = 0;

  for (const [trade, summary] of Object.entries(byTrade)) {
    const dailyRate = TRADE_DAILY_RATES[trade] || DEFAULT_PRICES.labour_general;
    const adjustedRate = round2(dailyRate * cityMultiplier);
    const cost = round2(summary.manDays * adjustedRate);
    const label = TRADE_LABELS[trade] || capitalise(trade.replace('_', ' '));
    const gang = GANG_DESCRIPTION[trade] || `${summary.gangSize} workers`;

    labourItems.push({
      trade: label,
      gangDays: round1(summary.gangDays),
      manDays: round1(summary.manDays),
      gangSize: summary.gangSize,
      gangDescription: gang,
      rate: adjustedRate,
      cost,
    });

    totalGangDays += summary.gangDays;
    totalManDays += summary.manDays;
    totalCost += cost;
  }

  labourItems.sort((a, b) => b.cost - a.cost);

  return {
    items: labourItems,
    totalGangDays: round1(totalGangDays),
    totalManDays: round1(totalManDays),
    totalCost: round2(totalCost),
  };
}

function capitalise(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }
