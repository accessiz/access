'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SmartCroppedImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Componente para mostrar imágenes con soporte para crossOrigin
 * y estilos de ajuste para la captura de CompCards.
 */
export function SmartCroppedImage({ src, alt, className, style }: SmartCroppedImageProps) {
    if (!src) return null;

    return (
        <img
            src={src}
            alt={alt}
            className={cn("w-full h-full object-cover", className)}
            style={style}
            crossOrigin="anonymous"
        />
    );
}
