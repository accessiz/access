'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Quality context for the two-tier image strategy:
 * - 'display'  → Portfolio/gallery: aggressive compression (q=75, small srcSet)
 * - 'print'    → CompCard/cover for PDF: high quality (q=95, large srcSet)
 *
 * Default is 'display' — the common case for browsing.
 */
type ImageQualityContext = 'display' | 'print';

/** Preset quality values aligned with Next.js Image `quality` prop (1-100). */
const QUALITY_MAP: Record<ImageQualityContext, number> = {
    display: 75,
    print: 95,
} as const;

/** Default responsive sizes hints per context. */
const SIZES_MAP: Record<ImageQualityContext, string> = {
    display: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    print: '100vw',
} as const;

interface SmartCroppedImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    loading?: 'lazy' | 'eager';
    /** Marca como prioritaria (LCP). Reemplaza fetchPriority. */
    priority?: boolean;
    /** @deprecated Use `priority` en su lugar */
    fetchPriority?: 'high' | 'low' | 'auto';
    /**
     * Responsive sizes hint para next/image.
     * If omitted, uses the context-appropriate default from SIZES_MAP.
     */
    sizes?: string;
    /**
     * Bypass next/image — renderiza un <img> nativo.
     * Usar SOLO para export (html-to-image, jsPDF, comp-cards).
     */
    native?: boolean;
    /**
     * Image quality context: 'display' (default) or 'print'.
     * Controls Next.js Image quality and default responsive sizes.
     */
    context?: ImageQualityContext;
    /**
     * Base64 data URI for blur placeholder (tiny ~200 byte image).
     * When provided, next/image renders a blurred version instantly
     * while the full image loads. Eliminates layout shift.
     */
    blurDataURL?: string | null;
    disableAnimation?: boolean;
    onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Universal optimized image component with two-tier quality strategy.
 *
 * - **display** (default): Portfolio/gallery browsing — q=75, tight sizes hints
 *   for aggressive AVIF/WebP delivery. Keeps LCP < 800ms.
 * - **print**: CompCard cover/slots for PDF export — q=95, full-width sizes
 *   to preserve detail at 300 DPI.
 * - `native` mode: raw <img> for html-to-image/export pipelines.
 * - Fade-in animation on load (desactivable).
 */
export function SmartCroppedImage({
    src,
    alt,
    className,
    style,
    loading = 'lazy',
    priority = false,
    fetchPriority,
    sizes,
    native = false,
    context = 'display',
    blurDataURL,
    disableAnimation = false,
    onError,
}: SmartCroppedImageProps) {
    const [isLoaded, setIsLoaded] = React.useState(disableAnimation);

    if (!src) return null;

    // Infer priority from legacy fetchPriority prop
    const isPriority = priority || fetchPriority === 'high';

    // Resolve quality and sizes from context
    const resolvedQuality = QUALITY_MAP[context];
    const resolvedSizes = sizes ?? SIZES_MAP[context];

    const fadeClasses = cn(
        'transition-opacity duration-700',
        isLoaded ? 'opacity-100' : 'opacity-0',
    );

    // ─── Native mode: raw <img> for export pipelines ───
    if (native) {
        return (
            <>
                {!isLoaded && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted/10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
                    </div>
                )}
                <img
                    src={src}
                    alt={alt}
                    loading={loading}
                    fetchPriority={isPriority ? 'high' : 'auto'}
                    decoding="async"
                    crossOrigin={src.startsWith('/') ? undefined : "anonymous"}
                    onLoad={() => setIsLoaded(true)}
                    onError={onError}
                    className={cn('w-full h-full object-cover', fadeClasses, className)}
                    style={style}
                />
            </>
        );
    }

    // ─── Optimized mode: next/image with fill ───
    return (
        <>
            {!isLoaded && (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted/10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                fill
                sizes={resolvedSizes}
                priority={isPriority}
                loading={isPriority ? undefined : loading}
                quality={resolvedQuality}
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL ?? undefined}
                onLoad={() => setIsLoaded(true)}
                onError={onError}
                className={cn('object-cover', fadeClasses, className)}
                style={style}
            />
        </>
    );
}
