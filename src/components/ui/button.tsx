import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 px-2 text-button-12",        // 28px height, 8px padding
        default: "h-9 px-3 text-button-14",   // 36px height, 12px padding
        lg: "h-11 px-4 text-button-16",       // 44px height, 16px padding
        icon: "h-9 w-9",                      // Cuadrado 36px
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // When rendering a native <button>, default to type="button"
    // unless a type was explicitly provided. Use a properly typed
    // Partial of Button attributes to avoid 'any' casts.
    const nativeProps: Partial<React.ButtonHTMLAttributes<HTMLButtonElement>> =
      Comp === "button"
        ? { type: (type ?? "button") as React.ButtonHTMLAttributes<HTMLButtonElement>["type"] }
        : {};

    // The 'props' value already respects ButtonProps which extends the
    // native button attributes. Narrow it to the native type so we can
    // safely spread without using 'any'. When Comp is Slot (asChild), the
    // Slot component will accept these props as children attributes.
    const restProps = props as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...nativeProps}
        {...restProps}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
