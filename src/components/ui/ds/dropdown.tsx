import * as React from 'react';

export type DropdownProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    triggerContent?: React.ReactNode;
};

export const Dropdown = React.forwardRef<HTMLButtonElement, DropdownProps>(
    ({ className = '', triggerContent, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                className={`ds-dropdown-trigger ${className}`}
                {...props}
            >
                {triggerContent}
                <svg className="w-3.5 h-3.5 opacity-60 shrink-0 text-current" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
        );
    }
);

Dropdown.displayName = 'Dropdown';
