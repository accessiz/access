/**
 * @module image
 *
 * Unified image compression pipeline.
 *
 * ─── TWO-TIER STRATEGY ───
 * DISPLAY quality  → Fast browsing (gallery, cards, portfolio view)
 *   • maxWidth 2400px, WebP 0.82 → typically 200-500KB
 *   • Served through Next.js Image Optimization (AVIF/WebP, responsive sizes)
 *
 * PRINT quality    → CompCard PDF/print (high-res for 300 DPI output)
 *   • maxWidth 4000px, WebP 0.92 → typically 800KB-2MB
 *   • Used only for CompCard print template capture
 *
 * The original full-res file is ALWAYS stored in R2.
 * Client-side compression is a network optimization, NOT a quality reduction.
 * Next.js Image Optimization handles responsive delivery for display.
 *
 * @example
 * // For gallery/portfolio uploads (fast, small)
 * const display = await compressForDisplay(file);
 *
 * // For comp-card/cover uploads (higher quality for print)
 * const print = await compressForPrint(file);
 */

/** Compression presets */
const DISPLAY_PRESET = {
  maxWidth: 2400,
  maxHeight: 2400,
  quality: 0.82,
} as const;

const PRINT_PRESET = {
  maxWidth: 4000,
  maxHeight: 4000,
  quality: 0.92,
} as const;

interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * Core compression function using canvas + WebP.
 * Revokes the object URL after use to prevent memory leaks.
 */
async function compressImage(
  file: File,
  { maxWidth, maxHeight, quality }: CompressOptions
): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      // Always revoke to prevent memory leaks
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Downscale maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Round to integers (canvas requirement)
      width = Math.round(width);
      height = Math.round(height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }

          const outputName = file.name.replace(/\.[^.]+$/, '.webp');
          resolve(
            new File([blob], outputName, {
              type: 'image/webp',
              lastModified: Date.now(),
            })
          );
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compress for display: gallery, portfolio, general browsing.
 * Optimized for fast transfer + responsive delivery via Next.js Image.
 */
export function compressForDisplay(file: File): Promise<File> {
  return compressImage(file, DISPLAY_PRESET);
}

/**
 * Compress for print: cover, comp-card slots.
 * Higher quality to preserve detail at 300 DPI print output.
 */
export function compressForPrint(file: File): Promise<File> {
  return compressImage(file, PRINT_PRESET);
}
