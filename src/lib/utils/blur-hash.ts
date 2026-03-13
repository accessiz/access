/**
 * Server-side blur placeholder generator.
 *
 * Generates tiny (~200 byte) base64-encoded data URIs from images.
 * These are stored in the DB alongside image paths and used by
 * SmartCroppedImage's `blurDataURL` prop for instant placeholders.
 *
 * Uses sharp (already a project dependency via Next.js) to:
 * 1. Resize to 8x8 pixels
 * 2. Apply Gaussian blur
 * 3. Encode as base64 WebP data URI
 *
 * The result is a ~200 byte string that can be inlined in HTML/JSON
 * without any additional network requests.
 */

import sharp from 'sharp';

/** Default blur placeholder dimensions (tiny — quality comes from the blur itself) */
const BLUR_SIZE = 8;
const BLUR_SIGMA = 3;

/**
 * Generate a base64 blur data URI from an image buffer.
 *
 * @param input - Image buffer (any format sharp supports: JPEG, PNG, WebP, AVIF)
 * @returns Base64 data URI string like `data:image/webp;base64,UklGR...`
 */
export async function generateBlurDataURL(input: Buffer): Promise<string> {
  const blurBuffer = await sharp(input)
    .resize(BLUR_SIZE, BLUR_SIZE, { fit: 'cover' })
    .blur(BLUR_SIGMA)
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${blurBuffer.toString('base64')}`;
}

/**
 * Generate a blur data URI from a remote URL.
 * Fetches the image and pipes it through sharp.
 *
 * @param url - Public URL of the image
 * @returns Base64 data URI or null if fetch/processing fails
 */
export async function generateBlurFromURL(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await generateBlurDataURL(buffer);
  } catch {
    return null;
  }
}

/**
 * Generate blur data URIs for multiple URLs in parallel.
 * Returns null for any URL that fails.
 *
 * @param urls - Array of public image URLs (null entries pass through as null)
 * @param concurrency - Max parallel fetches (default: 4)
 */
export async function generateBlurBatch(
  urls: (string | null | undefined)[],
  concurrency = 4,
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(urls.length).fill(null);

  // Process in chunks to limit concurrency
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency);
    const promises = chunk.map(async (url, j) => {
      if (!url) return null;
      const blur = await generateBlurFromURL(url);
      results[i + j] = blur;
      return blur;
    });
    await Promise.all(promises);
  }

  return results;
}
