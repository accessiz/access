"use client"

import { usePathname } from "next/navigation"
import React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Mapa para traducir las rutas de inglés a español en la UI
const routeNames: Record<string, string> = {
    "dashboard": "Dashboard",
    "models": "Talento",
    "projects": "Proyectos",
    "settings": "Configuración",
    "new": "Nuevo",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  // Separa la URL en partes (ej: dashboard, models, new)
  const segments = pathname.split("/").filter((item) => item !== "")

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = `/${segments.slice(0, index + 1).join("/")}`
          
          // Obtiene nombre bonito o usa el segmento original
          let name = routeNames[segment] || segment
          
          // Si es un ID largo (ej: uuid), mostrar "Detalle"
          if (segment.length > 20 && /\d/.test(segment)) name = "Detalle"
          
          // Capitalizar primera letra
          if (!routeNames[segment] && name !== "Detalle") {
             name = name.charAt(0).toUpperCase() + name.slice(1)
          }

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}