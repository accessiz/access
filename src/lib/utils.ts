/**
 * @module utils
 *
 * Core utility functions used across the application.
 * - `cn()` — Tailwind class merging (clsx + tailwind-merge)
 * - `toTitleCase()` — Spanish-aware title casing
 * - `toPublicUrl()` — R2 relative path → full public URL
 * - `mediaUrl()` — Legacy alias (returns `undefined` instead of `null`)
 */
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

import { R2_PUBLIC_URL } from '@/lib/constants';

/**
 * Converts a relative R2 storage path to its full public URL.
 * Returns `null` if no path is provided.
 */
export function toPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Si ya es una URL completa de R2 o externa, la devolvemos tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Si no hay R2_PUBLIC_URL definido, estamos en problemas para descargas directas
  if (!R2_PUBLIC_URL) {
    console.warn('[toPublicUrl] R2_PUBLIC_URL is not defined. Falling back to relative path:', path);
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Limpiar el path: si viene con el prefijo del proxy antiguo o el bucket de supabase, lo quitamos
  const cleanPath = path.toString()
    .replace(/^\/?api\/media\//, '')
    .replace(/^\/?storage\/v1\/object\/public\/[^\/]+\//, '')
    .replace(/^\//, '');
  
  const base = R2_PUBLIC_URL.replace(/\/$/, '');
  const finalUrl = `${base}/${cleanPath}`;
  
  return finalUrl;
}

/**
 * Returns a URL with a `?cors=1` query parameter appended.
 * 
 * **Why this exists:**
 * When the same R2 image is loaded twice on one page — once without CORS
 * (e.g. sidebar thumbnail via next/image) and once WITH `crossOrigin="anonymous"`
 * (e.g. CompCard manager for canvas/download) — the browser reuses the cached
 * response from the first (non-CORS) request and blocks the second because it
 * lacks `Access-Control-Allow-Origin`. Adding `?cors=1` makes the browser treat
 * it as a separate resource, forcing a fresh fetch with CORS headers.
 * 
 * Use this wrapper wherever an image is rendered with `crossOrigin="anonymous"`.
 */
export function toCorsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cors=1`;
}

/** @deprecated Use `toPublicUrl()` instead. Thin wrapper kept for backward-compat. */
export function mediaUrl(url: string | null | undefined): string | undefined {
  return toPublicUrl(url) ?? undefined;
}
