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
      duration={15000}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:backdrop-blur-xl group-[.toaster]:bg-card/70 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-separator group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl",
          title: "group-[.toast]:text-body group-[.toast]:font-medium",
          description: "group-[.toast]:text-label group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-[rgb(var(--purple))] group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-label group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:border group-[.toast]:border-separator group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-label",
          closeButton:
            "group-[.toast]:bg-card/50 group-[.toast]:text-muted-foreground group-[.toast]:border-separator group-[.toast]:backdrop-blur-sm hover:group-[.toast]:bg-hover-overlay",
          // Glassmorphism uniforme para todos los tipos - sin colores
          success:
            "group-[.toaster]:!backdrop-blur-xl group-[.toaster]:!bg-card/70 group-[.toaster]:!border-separator group-[.toaster]:!text-foreground",
          error:
            "group-[.toaster]:!backdrop-blur-xl group-[.toaster]:!bg-card/70 group-[.toaster]:!border-separator group-[.toaster]:!text-foreground",
          warning:
            "group-[.toaster]:!backdrop-blur-xl group-[.toaster]:!bg-card/70 group-[.toaster]:!border-separator group-[.toaster]:!text-foreground",
          info:
            "group-[.toaster]:!backdrop-blur-xl group-[.toaster]:!bg-card/70 group-[.toaster]:!border-separator group-[.toaster]:!text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
