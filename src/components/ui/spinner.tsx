import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Spinner - Circular Progress Indicator
 * 
 * M3 Guideline: Use for button loading states and indeterminate progress.
 * Prefer Skeletons for container loading.
 * 
 * Usage:
 * ```tsx
 * <Spinner size="sm" />
 * <Button disabled><Spinner size="sm" className="mr-2" /> Guardando...</Button>
 * ```
 */

export interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
    /** Size of the spinner */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
};

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className={cn('animate-spin text-primary', sizeClasses[size], className)}
            {...props}
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

/**
 * ButtonSpinner - Compact spinner for buttons
 */
export function ButtonSpinner({ className, ...props }: React.HTMLAttributes<SVGSVGElement>) {
    return <Spinner size="sm" className={cn('mr-2', className)} {...props} />;
}
