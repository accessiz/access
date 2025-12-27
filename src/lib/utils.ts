import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function mediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const urlObj = new URL(url);
    // Validar si es una URL de R2 para proxyarla
    if (urlObj.hostname.includes('r2.dev') || urlObj.hostname.includes('cloudflarestorage')) {
      return `/api/media${urlObj.pathname}`;
    }
    return url;
  } catch (_e) {
    return url;
  }
}
