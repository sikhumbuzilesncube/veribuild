// ============================================================
// VERIBUILD BOQ ENGINE - NUMERIC HELPERS
// ============================================================

export function round1(n) {
  if (!isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function round2(n) {
  if (!isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function ceilNum(n) {
  if (!isFinite(n)) return 0;
  return Math.ceil(n);
}

export function num(value, fallback = 0) {
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : fallback;
}

export function int(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return isFinite(parsed) ? parsed : fallback;
}

export function withWaste(quantity, wasteFactor = 0.05) {
  return quantity * (1 + wasteFactor);
}

export function usd(amount) {
  return `$${round2(amount).toFixed(2)}`;
}

// Compute gang-days from total output required and daily productivity
export function gangDays(totalQuantity, outputPerDay) {
  if (!outputPerDay || outputPerDay <= 0) return 0;
  return totalQuantity / outputPerDay;
}

// Compute man-days for a gang of N workers over D days
export function manDays(gangSize, days) {
  return gangSize * days;
}

export function safeDivide(a, b, fallback = 0) {
  if (!b || b === 0) return fallback;
  return a / b;
                     }
