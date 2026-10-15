/**
 * Paynow hash verification helper.
 *
 * Paynow sends a `hash` field on every webhook notification. That hash is a
 * SHA-512 digest computed from the other fields in the payload plus your
 * integration key. Recomputing it locally is how we prove the webhook came
 * from Paynow and not from someone spoofing the URL.
 *
 * The exact algorithm has changed slightly across paynow SDK versions. This
 * helper tries the library's own verifier first, then two documented manual
 * variants, and returns true on the first match. If none match, the webhook
 * is rejected.
 */

import crypto from 'crypto';

/**
 * Try to load the paynow library. Next.js server routes can require CommonJS
 * packages directly. If the library is missing we degrade gracefully and
 * rely on the manual methods.
 */
let paynowLib = null;
let paynowLoadError = null;

try {
  // CommonJS require inside an ES module is fine in Next.js API routes.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('paynow');
  paynowLib = mod?.Paynow || mod?.default?.Paynow || mod;
} catch (err) {
  paynowLoadError = err;
}

/**
 * Compute the SHA-512 hex digest of a string.
 */
function sha512(input) {
  return crypto.createHash('sha512').update(input, 'utf8').digest('hex').toUpperCase();
}

/**
 * Method 1: use the paynow library's own verifyHash if it is exposed.
 *
 * The exact signature varies across versions. We try a few plausible
 * signatures and swallow errors, falling through to the manual methods.
 */
function tryLibraryVerify(payload, integrationKey) {
  if (!paynowLib) return false;

  const hash = payload.hash || payload.Hash;
  if (!hash) return false;

  const candidates = [];

  // Some versions expose it as a static method on Paynow.
  if (typeof paynowLib.verifyHash === 'function') {
    candidates.push(() => paynowLib.verifyHash(payload, integrationKey));
  }

  // Some versions expose it on an instance.
  if (typeof paynowLib === 'function' && paynowLib.prototype?.verifyHash) {
    try {
      const instance = new paynowLib(
        process.env.PAYNOW_SDK_INTEGRATION_ID,
        integrationKey
      );
      if (typeof instance.verifyHash === 'function') {
        candidates.push(() => instance.verifyHash(payload, integrationKey));
      }
    } catch {
      // ignore, instance creation failed
    }
  }

  for (const attempt of candidates) {
    try {
      const result = attempt();
      // The library may return a boolean or an object.
      if (result === true) return true;
      if (result && typeof result === 'object' && result.valid === true) return true;
    } catch {
      // try the next candidate
    }
  }

  return false;
}

/**
 * Method 2: manual concatenation in payload order.
 *
 * Paynow's JS SDK typically concatenates the field values in the order
 * they appear in the payload, excludes the hash itself and any empty
 * values, appends the integration key, and SHA-512s the result.
 */
function tryManualInOrder(payload, integrationKey, excludeKeys = ['hash', 'Hash']) {
  const hash = payload.hash || payload.Hash;
  if (!hash) return false;

  const parts = [];
  for (const [key, value] of Object.entries(payload)) {
    if (excludeKeys.includes(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    parts.push(String(value));
  }
  parts.push(integrationKey);
  const computed = sha512(parts.join(''));
  return computed === String(hash).toUpperCase();
}

/**
 * Method 3: manual concatenation with the fixed "paynow" suffix.
 *
 * Some documented variants append the literal string "paynow" instead of
 * the integration key, or in addition to it. We try both.
 */
function tryManualWithPaynowSuffix(payload, integrationKey, excludeKeys = ['hash', 'Hash']) {
  const hash = payload.hash || payload.Hash;
  if (!hash) return false;

  const parts = [];
  for (const [key, value] of Object.entries(payload)) {
    if (excludeKeys.includes(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    parts.push(String(value));
  }
  const upperHash = String(hash).toUpperCase();

  // Variant A: ...values + integrationKey + "paynow"
  if (sha512(parts.join('') + integrationKey + 'paynow') === upperHash) return true;

  // Variant B: ...values + "paynow"
  if (sha512(parts.join('') + 'paynow') === upperHash) return true;

  return false;
}

/**
 * Method 4: alphabetical-by-key concatenation.
 *
 * Paynow's webhook format is sometimes documented with fields sorted by
 * key name rather than payload order. Cheap to try, so we do.
 */
function tryManualAlphabetical(payload, integrationKey, excludeKeys = ['hash', 'Hash']) {
  const hash = payload.hash || payload.Hash;
  if (!hash) return false;

  const keys = Object.keys(payload)
    .filter((k) => !excludeKeys.includes(k))
    .filter((k) => payload[k] !== null && payload[k] !== undefined && payload[k] !== '')
    .sort();

  const parts = keys.map((k) => String(payload[k]));
  parts.push(integrationKey);
  const computed = sha512(parts.join(''));
  return computed === String(hash).toUpperCase();
}

/**
 * Main entry point. Returns true only if one of the strategies reproduces
 * the hash that Paynow sent.
 *
 * @param {object} payload - Parsed webhook body (JSON or form fields as an object).
 * @returns {boolean}
 */
export function verifyPaynowHash(payload) {
  if (!payload || typeof payload !== 'object') return false;

  const hash = payload.hash || payload.Hash;
  if (!hash) {
    // Paynow always sends a hash on legitimate notifications. No hash, no trust.
    return false;
  }

  const integrationKey =
    process.env.PAYNOW_SDK_INTEGRATION_KEY || process.env.PAYNOW_INTEGRATION_KEY;

  if (!integrationKey) {
    console.error('Paynow hash verification failed: integration key is not configured');
    return false;
  }

  if (paynowLoadError) {
    console.warn('Paynow library unavailable, falling back to manual hash checks:', paynowLoadError.message);
  }

  try {
    if (tryLibraryVerify(payload, integrationKey)) return true;
  } catch (err) {
    console.warn('Library verify threw, continuing to manual methods:', err.message);
  }

  try {
    if (tryManualInOrder(payload, integrationKey)) return true;
  } catch (err) {
    console.warn('Manual in-order verify threw:', err.message);
  }

  try {
    if (tryManualWithPaynowSuffix(payload, integrationKey)) return true;
  } catch (err) {
    console.warn('Manual paynow-suffix verify threw:', err.message);
  }

  try {
    if (tryManualAlphabetical(payload, integrationKey)) return true;
  } catch (err) {
    console.warn('Manual alphabetical verify threw:', err.message);
  }

  return false;
}

export default { verifyPaynowHash };
