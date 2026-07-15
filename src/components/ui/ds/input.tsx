import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
    leftPadding?: string;  // CSS value, e.g. "4.5rem" or "72px"
    rightPadding?: string; // CSS value, e.g. "3rem" or "48px"
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error = false, leftElement, rightElement, leftPadding, rightPadding, style, ...props }, ref) => {
        const hasLeft = !!leftElement;
        const hasRight = !!rightElement;
        
        // Default padding offsets based on whether left/right elements are present
        const defaultLeftPadding = hasLeft ? '4.5rem' : '1rem';
        const defaultRightPadding = hasRight ? '3rem' : '1rem';

        return (
            <div className="ds-input-container">
                {leftElement && (
                    <div className="absolute left-4 flex items-center justify-center select-none pointer-events-none">
                        {leftElement}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`ds-input ${error ? 'ds-input-error' : ''} ${className}`}
                    style={{
                        paddingLeft: leftPadding || defaultLeftPadding,
                        paddingRight: rightPadding || defaultRightPadding,
                        ...style
                    }}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-4 flex items-center justify-center">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
