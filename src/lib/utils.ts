import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // NYXA typography tokens (Design System): allow coexistence with text colors
      "font-size": [{ text: ["label", "body", "title", "display"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un string a Title Case (primera letra de cada palabra en mayúscula)
 * Maneja texto en mayúsculas, minúsculas o mixto
 * Respeta conectores comunes en español que normalmente van en minúscula
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';

  // Conectores que típicamente van en minúscula (excepto al inicio)
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'a', 'en', 'con', 'por', 'para']);

  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      // Primera palabra siempre en mayúscula
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Conectores en minúscula
      if (lowercaseWords.has(word)) {
        return word;
      }
      // Resto de palabras con mayúscula inicial
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
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
  } catch {
    return url;
  }
}
