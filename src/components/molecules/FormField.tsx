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
    return (
      <div
        className={cn("grid w-full items-center gap-2", className)}
        ref={ref}
        {...props}
      >
        <Label htmlFor={htmlFor}>{label}</Label>
        {children}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }