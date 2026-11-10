// ============================================================
// VERIBUILD PRICE MAP
// Single source of truth for every price the server charges.
// ============================================================

export const PRICES = {
  // ----------------------------------------------------------
  // Subscriptions — Construction
  // ----------------------------------------------------------
  construction_starter: 15,
  construction_pro_local: 45,
  construction_pro_national: 75,

  // ----------------------------------------------------------
  // Subscriptions — Architect
  // ----------------------------------------------------------
  architect_starter: 15,
  architect_pro_local: 40,
  architect_pro_national: 70,

  // ----------------------------------------------------------
  // Subscriptions — Worker
  // ----------------------------------------------------------
  worker_starter: 5,
  worker_pro_local: 15,
  worker_pro_national: 35,

  // ----------------------------------------------------------
  // Subscriptions — Hardware
  // ----------------------------------------------------------
  hardware_starter: 15,
  hardware_pro_local: 35,
  hardware_pro_national: 55,

  // ----------------------------------------------------------
  // BOQ generation — one-off
  // ----------------------------------------------------------
  // LOWERED to $1 for market penetration (With Plan)
  boq_with_plan: 1,
  // Template BOQ remains at $5
  boq_without_plan: 5,
};

export function getPrice(planType) {
  if (!planType || typeof planType !== 'string') return null;
  const price = PRICES[planType];
  return typeof price === 'number' ? price : null;
}

export function getPaymentPurpose(planType) {
  if (!planType || typeof planType !== 'string') return 'unknown';
  if (planType.startsWith('boq_')) return 'boq';

  const subscriptionPrefixes = [
    'construction_',
    'architect_',
    'worker_',
    'hardware_',
  ];

  for (const prefix of subscriptionPrefixes) {
    if (planType.startsWith(prefix)) return 'subscription';
  }

  return 'unknown';
}

export default {
  PRICES,
  getPrice,
  getPaymentPurpose,
};
