import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ref, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground", className)}
      {...props}
    />
  )
}
Card.displayName = "Card"

function CardHeader({ className, ref, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}
CardHeader.displayName = "CardHeader"

function CardTitle({ className, ref, ...props }: React.ComponentPropsWithRef<"h3">) {
  return <h3 ref={ref} className={cn("text-title", className)} {...props} />
}
CardTitle.displayName = "CardTitle"

// ✅ INICIO DE LA CORRECCIÓN
// Cambiamos la etiqueta <p> por una <div> para permitir contenido más complejo.
function CardDescription({ className, ref, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div ref={ref} className={cn("text-body text-muted-foreground", className)} {...props} />
}
// ✅ FIN DE LA CORRECCIÓN
CardDescription.displayName = "CardDescription"

function CardContent({ className, ref, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
}
CardContent.displayName = "CardContent"

function CardFooter({ className, ref, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
}
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
