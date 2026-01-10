'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export type SearchBarProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  placeholder?: string;
  ariaLabel?: string;
  name?: string;
  autoFocus?: boolean;
  disabled?: boolean;

  /** Show a clear (X) button when `value` is non-empty (controlled usage). */
  onClear?: () => void;
  clearAriaLabel?: string;

  onSubmit?: (value: string) => void;

  className?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  showIcon?: boolean;
  action?: React.ReactNode;

  /** When used inside a flex row, let the input grow and avoid shrinking text. */
  expand?: boolean;
};

export function SearchBar({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Buscar...',
  ariaLabel,
  name,
  autoFocus,
  disabled,
  onClear,
  clearAriaLabel = 'Limpiar búsqueda',
  onSubmit,
  className,
  inputWrapperClassName,
  inputClassName,
  iconClassName,
  showIcon = true,
  action,
  expand = true,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const showClear = Boolean(
    onClear &&
      !disabled &&
      typeof value === 'string' &&
      value.trim().length > 0
  );

  const input = (
    <div
      className={cn(
        'relative w-full min-w-0',
        expand && action ? 'flex-1' : '',
        inputWrapperClassName
      )}
    >
      {showIcon ? (
        <Search
          className={cn(
            'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
            iconClassName
          )}
        />
      ) : null}
      <Input
        ref={inputRef}
        type="search"
        name={name}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          'w-full min-w-0',
          showIcon ? 'pl-9' : '',
          showClear ? 'pr-9' : '',
          inputClassName
        )}
      />
      {showClear ? (
        <button
          type="button"
          aria-label={clearAriaLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            onClear?.();
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );

  if (!onSubmit && !action) return <div className={className}>{input}</div>;

  return (
    <form
      className={cn('flex items-center gap-2 w-full min-w-0', className)}
      onSubmit={(e) => {
        e.preventDefault();
        const nextValue = value ?? inputRef.current?.value ?? '';
        onSubmit?.(nextValue);
      }}
    >
      {input}
      {action}
    </form>
  );
}
