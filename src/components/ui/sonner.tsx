"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      expand={true}
      richColors={false}
      closeButton={true}
      duration={7000}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:backdrop-blur-xl group-[.toaster]:bg-[rgb(var(--ds-color-surface-container))]/90 group-[.toaster]:text-[rgb(var(--ds-color-on-surface))] group-[.toaster]:border group-[.toaster]:border-[rgb(var(--ds-color-outline-variant))]/20 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3",
          title: "group-[.toast]:ds-text-sm group-[.toast]:font-bold group-[.toast]:text-[rgb(var(--ds-color-on-surface))]",
          description: "group-[.toast]:ds-text-xs group-[.toast]:text-[rgb(var(--ds-color-on-surface-variant))]/85",
          actionButton:
            "group-[.toast]:bg-[rgb(var(--ds-color-primary))] group-[.toast]:text-[rgb(var(--ds-color-primary-foreground))] group-[.toast]:rounded-xl group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:ds-text-xs group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:border group-[.toast]:border-[rgb(var(--ds-color-outline-variant))]/30 group-[.toast]:text-[rgb(var(--ds-color-on-surface-variant))] group-[.toast]:rounded-xl group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:ds-text-xs",
          closeButton:
            "group-[.toast]:!bg-[rgb(var(--ds-color-surface-container-high))] group-[.toast]:!text-[rgb(var(--ds-color-on-surface))] group-[.toast]:!border-0 group-[.toast]:hover:!bg-[rgb(var(--ds-color-surface-container-highest))] group-[.toast]:!shadow-sm transition-colors duration-150",
          success:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-[rgb(var(--ds-color-primary))]",
          error:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-[rgb(var(--ds-color-error))]",
          warning:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-amber-500",
          info:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
