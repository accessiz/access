import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded border font-semibold text-body whitespace-nowrap transition-colors focus:outline-2 focus:outline-ring focus:outline-offset-2",
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

        // Semantic variants (new)
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning",
        info: "border-info/30 bg-info/15 text-info",
        danger: "border-destructive/30 bg-destructive/10 text-destructive",
        neutral: "border-border bg-muted/30 text-muted-foreground",
        accent: "border-accent/30 bg-accent/20 text-foreground",
        review: "border-primary/30 bg-primary/15 text-primary",
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
