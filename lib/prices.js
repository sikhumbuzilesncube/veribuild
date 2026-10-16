// ============================================================
// VERIBUILD PRICE MAP
// Single source of truth for every price the server charges.
//
// The client never sets the price. The payment page sends a planType
// string, and the server looks up the amount here. Whatever amount
// appears in the URL is for display only and is ignored by the API.
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
  boq_with_plan: 10,
  boq_without_plan: 5,
};

// ------------------------------------------------------------
// Look up the price for a plan type.
// Returns a number, or null if the plan type is unknown.
// ------------------------------------------------------------
export function getPrice(planType) {
  if (!planType || typeof planType !== 'string') return null;
  const price = PRICES[planType];
  return typeof price === 'number' ? price : null;
}

// ------------------------------------------------------------
// Classify a plan type. Used by the webhook and verify routes to
// decide whether a completed payment should activate a subscription,
// unlock a BOQ, or both.
//
// Returns one of:
//   'subscription' — a monthly plan for construction / architect / worker / hardware
//   'boq'          — a one-off BOQ generation payment
//   'unknown'      — no match
// ------------------------------------------------------------
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
