import * as React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', loading = false, disabled, children, ...props }, ref) => {
        const baseClass = 'ds-btn';
        
        let variantClass = 'ds-btn-primary';
        if (variant === 'secondary') variantClass = 'ds-btn-secondary';
        else if (variant === 'outline') variantClass = 'ds-btn-outline';
        else if (variant === 'ghost') variantClass = 'ds-btn-ghost';

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`${baseClass} ${variantClass} ${className}`}
                {...props}
            >
                {loading && (
                    <svg className="w-5 h-5 animate-spin shrink-0 text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
