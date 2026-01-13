import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold text-body whitespace-nowrap transition-colors focus:outline-2 focus:outline-ring focus:outline-offset-2",
  {
    variants: {
      variant: {
        // Base variants (keep for compatibility)
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "bg-transparent border-border text-foreground",

        // Semantic variants (new color system)
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning",
        info: "border-info/30 bg-info/15 text-info",
        danger: "border-destructive/30 bg-destructive/15 text-destructive",
        neutral: "border-separator/50 bg-secondary/15 text-muted-foreground",
        // New semantic variants (No Gray system)
        purple: "border-purple/30 bg-purple/15 text-purple",
        cyan: "border-cyan/30 bg-cyan/15 text-cyan",
        indigo: "border-indigo/30 bg-indigo/15 text-indigo",
        orange: "border-orange/30 bg-orange/15 text-orange",
        blue: "border-blue/30 bg-blue/15 text-blue",
      },
      size: {
        small: "h-6 px-2", // 24px height
        medium: "h-7 px-3", // 28px height (default)
        large: "h-8 px-4", // 32px height
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
