'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SmartCroppedImage } from '@/components/atoms/SmartCroppedImage';

/* ─────────────────────────────────────────────
 * MasonryGallery — Componente reutilizable de
 * galería masonry (Pinterest-style columns).
 *
 * Breakpoints unificados con client-grid:
 *   default  → 2 columnas
 *   480px+   → 3 columnas
 *   900px+   → 4 columnas
 *   1200px+  → 5 columnas
 *   1600px+  → 6 columnas
 *
 * Uso:
 *   <MasonryGallery
 *     images={urls}
 *     onImageClick={(url, index) => openLightbox(index)}
 *   />
 * ───────────────────────────────────────────── */

// ── Types ──────────────────────────────────────

export interface MasonryGalleryImage {
  /** URL de la imagen */
  url: string;
  /** Alt text descriptivo */
  alt?: string;
}

export interface MasonryGalleryProps {
  /** Array de imágenes (strings o objetos con url/alt) */
  images: (string | MasonryGalleryImage)[];
  /** Callback al hacer click en una imagen */
  onImageClick?: (url: string, index: number) => void;
  /** Mostrar overlay oscuro al hover (default: true) */
  showHoverOverlay?: boolean;
  /** Ocultar imágenes rotas automáticamente (default: true) */
  hideOnError?: boolean;
  /** Contenido custom renderizado encima de cada imagen (ej. botones de acción) */
  renderOverlay?: (url: string, index: number) => React.ReactNode;
  /** Contenido insertado antes de las imágenes (ej. uploads en progreso) */
  prepend?: React.ReactNode;
  /** className adicional para el contenedor principal */
  className?: string;
}

// ── Component ──────────────────────────────────

export function MasonryGallery({
  images,
  onImageClick,
  showHoverOverlay = true,
  hideOnError = true,
  renderOverlay,
  prepend,
  className,
}: MasonryGalleryProps) {
  if (images.length === 0 && !prepend) return null;

  const normalizedImages = images.map((img) =>
    typeof img === 'string' ? { url: img, alt: undefined } : img
  );

  return (
    <div
      className={cn('masonry-gallery', className)}
    >
      {/* Contenido pre-pendido (ej. uploads en progreso) */}
      {prepend}

      {/* Imágenes */}
      {normalizedImages.map((image, index) => (
        <div
          key={`masonry-${index}-${image.url}`}
          className={cn(
            'break-inside-avoid mb-1 relative group overflow-hidden bg-muted',
            onImageClick && 'cursor-pointer'
          )}
          onClick={() => onImageClick?.(image.url, index)}
        >
          <SmartCroppedImage
            src={image.url}
            alt={image.alt || `Foto ${index + 1}`}
            className="w-full h-auto block transform transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 480px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 20vw"
            loading="lazy"
            native={true}
            onError={
              hideOnError
                ? (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const parent = (e.target as HTMLElement).closest(
                      '.break-inside-avoid'
                    ) as HTMLElement;
                    if (parent) parent.style.display = 'none';
                  }
                : undefined
            }
          />

          {/* Overlay hover simple */}
          {showHoverOverlay && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          )}

          {/* Overlay custom (botones, badges, etc.) */}
          {renderOverlay?.(image.url, index)}
        </div>
      ))}
    </div>
  );
}
