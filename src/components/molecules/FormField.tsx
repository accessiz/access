import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, children, ...props }, ref) => {
    // Detectar asterisco al final del label para renderizarlo en rojo
    const hasAsterisk = label.endsWith(' *');
    const labelText = hasAsterisk ? label.slice(0, -2) : label;

    return (
      <div
        className={cn("grid w-full items-center gap-2", className)}
        ref={ref}
        {...props}
      >
        <Label htmlFor={htmlFor}>
          {labelText}
          {hasAsterisk && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {children}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }