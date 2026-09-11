// ============================================================
// VERIBUILD BOQ ENGINE - LABOUR SUMMARY
// Aggregates labour items into a summary for the BOQ
// ============================================================

import { DEFAULT_PRICES } from '../prices.js';
import { round1, round2, manDays } from '../utils.js';

// Given a list of items that have labour: true, compute
// the man-day cost and total cost per trade
export function summariseLabour(items, cityMultiplier = 1.0) {
  const byTrade = {};

  for (const item of items) {
    if (!item.labour) continue;

    const trade = item.trade || 'general';
    const gangDays = item.qty; // gang-days
    const gangSize = item.gangSize || 1;
    const md = manDays(gangSize, gangDays);

    if (!byTrade[trade]) {
      byTrade[trade] = { trade, gangDays: 0, manDays: 0 };
    }
    byTrade[trade].gangDays += gangDays;
    byTrade[trade].manDays += md;
  }

  // Convert man-days to cost using default daily rates
  const rateMap = {
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

  const labourItems = [];
  let totalManDays = 0;
  let totalCost = 0;

  for (const [trade, summary] of Object.entries(byTrade)) {
    const rate = rateMap[trade] || DEFAULT_PRICES.labour_general;
    const adjustedRate = round2(rate * cityMultiplier);
    const cost = round2(summary.manDays * adjustedRate);

    labourItems.push({
      trade: capitalise(trade.replace('_', ' ')),
      manDays: round1(summary.manDays),
      rate: adjustedRate,
      cost,
    });

    totalManDays += summary.manDays;
    totalCost += cost;
  }

  return {
    items: labourItems,
    totalManDays: round1(totalManDays),
    totalCost: round2(totalCost),
  };
}

function capitalise(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
      }
