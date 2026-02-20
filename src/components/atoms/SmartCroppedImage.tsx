'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SmartCroppedImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    loading?: 'lazy' | 'eager';
    fetchPriority?: 'high' | 'low' | 'auto';
    disableAnimation?: boolean;
    onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Componente para mostrar imágenes con soporte para crossOrigin,
 * carga perezosa por defecto, prioridades de fetch y una suave
 * transición de fade-in al terminar de cargar.
 */
export function SmartCroppedImage({
    src,
    alt,
    className,
    style,
    loading = 'lazy',
    fetchPriority = 'auto',
    disableAnimation = false,
    onError
}: SmartCroppedImageProps) {
    const [isLoaded, setIsLoaded] = React.useState(disableAnimation);

    if (!src) return null;

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
                // @ts-ignore - fetchPriority is supported in modern browsers
                fetchPriority={fetchPriority}
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={onError}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-700",
                    isLoaded ? "opacity-100" : "opacity-0",
                    className
                )}
                style={style}
                crossOrigin="anonymous"
            />
        </>
    );
}
