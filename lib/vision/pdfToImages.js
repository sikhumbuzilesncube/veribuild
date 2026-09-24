// ============================================================
// VERIBUILD VISION - PDF TO IMAGES
// Converts a PDF buffer to an array of PNG buffers, one per page.
// Uses pdf-to-img. Designed to be called from a Next.js server action.
// ============================================================

import { MAX_PAGES_PER_PLAN, RENDER_DPI } from './constants.js';

/**
 * Convert a PDF buffer into an array of PNG buffers.
 *
 * @param {Buffer} pdfBuffer - The raw PDF bytes.
 * @returns {Promise<{ pages: Buffer[], pageCount: number, truncated: boolean }>}
 */
export async function pdfToImages(pdfBuffer) {
  if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
    throw new Error('pdfToImages requires a Buffer');
  }

  let pdf;
  try {
    const mod = await import('pdf-to-img');
    // pdf-to-img uses scale factor where 1 = 72 DPI.
    pdf = await mod.pdf(pdfBuffer, {
      scale: RENDER_DPI / 72,
    });
  } catch (err) {
    if (String(err.message || '').includes('Cannot find module')) {
      throw new Error(
        'pdf-to-img is not installed. Add it to package.json before using the vision layer.'
      );
    }
    throw err;
  }

  const pages = [];
  let pageCount = 0;
  let truncated = false;

  for await (const pageData of pdf) {
    pageCount += 1;

    // pdf-to-img may yield either a Buffer or a base64 string depending on version.
    // Normalise to Buffer.
    let pageBuffer;
    if (Buffer.isBuffer(pageData)) {
      pageBuffer = pageData;
    } else if (typeof pageData === 'string') {
      pageBuffer = Buffer.from(pageData, 'base64');
    } else if (pageData && typeof pageData.toString === 'function') {
      // Some versions yield an object with a toString() that returns base64
      pageBuffer = Buffer.from(pageData.toString(), 'base64');
    } else {
      continue;
    }

    if (pages.length < MAX_PAGES_PER_PLAN) {
      pages.push(pageBuffer);
    } else {
      truncated = true;
    }
  }

  return { pages, pageCount, truncated };
}

/**
 * Estimate the number of tokens an image will consume.
 * Anthropic's vision pricing is based on image dimensions.
 * Rule of thumb: (width_px * height_px) / 750 tokens.
 */
export function estimateImageTokens(pngBuffer) {
  if (!pngBuffer || pngBuffer.length < 24) {
    return { width: 0, height: 0, estimatedTokens: 0 };
  }

  const width = pngBuffer.readUInt32BE(16);
  const height = pngBuffer.readUInt32BE(20);
  const estimatedTokens = Math.ceil((width * height) / 750);

  return { width, height, estimatedTokens };
}

export default { pdfToImages, estimateImageTokens };
