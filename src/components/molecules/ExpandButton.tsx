'use client';

import { forwardRef, ComponentPropsWithoutRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandButtonProps extends ComponentPropsWithoutRef<'button'> {
    isOpen?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * ExpandButton - Botón de expansión/colapso reutilizable
 * 
 * Estilos según Design System:
 * - Sin fondo por defecto
 * - Borde con --separator
 * - Hover con --hover-overlay
 * - Border radius 8px (rounded-lg)
 */
const ExpandButton = forwardRef<HTMLButtonElement, ExpandButtonProps>(
    ({ isOpen = false, size = 'md', className, ...props }, ref) => {
        const sizeClasses = {
            sm: 'h-8 w-8',
            md: 'h-10 w-10',
            lg: 'h-12 w-12',
        };

        const iconSizes = {
            sm: 'h-4 w-4',
            md: 'h-5 w-5',
            lg: 'h-6 w-6',
        };

        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center',
                    // Background & border
                    'bg-transparent border border-separator rounded-lg',
                    // Hover state
                    'hover:bg-hover-overlay',
                    // Transition
                    'transition-colors duration-200',
                    // Focus
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    // Size
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                <ChevronDown
                    className={cn(
                        iconSizes[size],
                        'transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>
        );
    }
);

ExpandButton.displayName = 'ExpandButton';

export { ExpandButton };
