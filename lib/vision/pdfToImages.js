// ============================================================
// VERIBUILD VISION - PDF TO IMAGES
// Converts a PDF buffer to an array of PNG buffers, one per page.
// Uses pdf-to-img. This module is designed to be called from
// a Next.js server action or API route.
//
// NOTE: pdf-to-img is NOT installed yet. This file is imported by
// Batch 3 code, not by anything currently deployed.
// The package will be added to package.json in Batch 3.
// ============================================================

import { MAX_PAGES_PER_PLAN, RENDER_DPI } from './constants.js';

/**
 * Convert a PDF buffer into an array of PNG buffers.
 *
 * @param {Buffer} pdfBuffer - The raw PDF bytes.
 * @returns {Promise<{ pages: Buffer[], pageCount: number, truncated: boolean }>}
 *   pages:      array of PNG buffers, capped at MAX_PAGES_PER_PLAN
 *   pageCount:  total pages found in the PDF
 *   truncated:  true if the PDF had more pages than MAX_PAGES_PER_PLAN
 */
export async function pdfToImages(pdfBuffer) {
  if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
    throw new Error('pdfToImages requires a Buffer');
  }

  let pdf;
  try {
    // Dynamic import so that the package is only required when this
    // function is actually called. This allows Batch 1 to be deployed
    // safely without the pdf-to-img dependency.
    const mod = await import('pdf-to-img');
    pdf = await mod.pdf(pdfBuffer, {
      scale: RENDER_DPI / 72, // pdf-to-img uses scale, not DPI
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

  for await (const pageBuffer of pdf) {
    pageCount += 1;
    if (pages.length >= MAX_PAGES_PER_PLAN) {
      truncated = true;
      continue; // keep counting pages but stop collecting images
    }
    pages.push(pageBuffer);
  }

  return { pages, pageCount, truncated };
}

/**
 * Estimate the number of tokens an image will consume.
 * Anthropic's vision pricing is based on image dimensions.
 * Rule of thumb: (width_px * height_px) / 750 tokens.
 * This is a rough pre-flight estimate used to enforce the cost cap.
 *
 * @param {Buffer} pngBuffer
 * @returns {{ width: number, height: number, estimatedTokens: number }}
 */
export function estimateImageTokens(pngBuffer) {
  // Read PNG dimensions from the IHDR chunk (bytes 16-24).
  // PNG signature is 8 bytes, IHDR length 4 bytes, "IHDR" 4 bytes,
  // then width (4 bytes) and height (4 bytes).
  if (!pngBuffer || pngBuffer.length < 24) {
    return { width: 0, height: 0, estimatedTokens: 0 };
  }

  const width = pngBuffer.readUInt32BE(16);
  const height = pngBuffer.readUInt32BE(20);
  const estimatedTokens = Math.ceil((width * height) / 750);

  return { width, height, estimatedTokens };
}

export default { pdfToImages, estimateImageTokens };
