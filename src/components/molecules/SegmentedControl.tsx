"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** When true, renders as an icon-only segmented button (label is sr-only). */
  iconOnly?: boolean;
  disabled?: boolean;
  /** Only applies on mobile grid layout. */
  mobileColSpan?: 1 | 2 | 3 | 4;
  /** Custom className for this option (e.g., for responsive visibility). */
  className?: string;
};

type Props<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: Array<SegmentedOption<T>>;
  /** Accessible label for the group. */
  ariaLabel: string;
  /** Mobile grid columns; defaults to 2 for 4+ options, otherwise options length. */
  mobileColumns?: 2 | 3 | 4;
  className?: string;
};

function getGridColsClass(cols: 2 | 3 | 4) {
  if (cols === 2) return "grid-cols-2";
  if (cols === 3) return "grid-cols-3";
  return "grid-cols-4";
}

function getColSpanClass(span?: 1 | 2 | 3 | 4) {
  if (!span || span === 1) return "";
  if (span === 2) return "col-span-2";
  if (span === 3) return "col-span-3";
  return "col-span-4";
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  mobileColumns,
  className,
}: Props<T>) {
  const cols: 2 | 3 | 4 =
    mobileColumns ??
    (options.length <= 3 ? (options.length as 2 | 3) : 2);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn(
          "grid",
          getGridColsClass(cols),
          "sm:flex sm:items-center",
          "gap-1",
          "w-full sm:w-fit",
          "rounded-md bg-transparent p-1 ring-1 ring-separator ring-inset",
          className
        )}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          const isIconOnly = Boolean(opt.icon) && opt.iconOnly === true;

          const button = (
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              data-active={isActive ? "true" : "false"}
              disabled={opt.disabled}
              onClick={() => onValueChange(opt.value)}
              className={cn(
                "min-w-0 shrink-0",
                getColSpanClass(opt.mobileColSpan),
                "sm:col-span-1",
                "inline-flex items-center",
                isIconOnly ? "justify-center" : "justify-start sm:justify-center",
                isIconOnly ? "gap-0" : "gap-2",
                "h-12 sm:h-8",
                "rounded-md",
                isIconOnly ? "w-12 sm:w-8 px-0" : "px-3",
                "text-body",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                isActive
                  ? "bg-[rgb(var(--light-purple))] text-primary"
                  : "text-muted-foreground hover:bg-hover-overlay hover:text-foreground",
                opt.className
              )}
            >
              {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
              {isIconOnly ? (
                <span className="sr-only">{opt.label}</span>
              ) : (
                <span className="min-w-0 truncate">{opt.label}</span>
              )}
            </button>
          );

          if (!isIconOnly) return <React.Fragment key={opt.value}>{button}</React.Fragment>;

          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="top" align="center">
                {opt.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
