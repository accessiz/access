"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GalleryVerticalEnd,
  Users,
  FolderKanban,
  Building2,
  Wallet,
  Settings,
  Cake,
} from "lucide-react"

import { NavUser } from "@/components/organisms/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { User } from "@supabase/supabase-js"
import LogoDark from "@/components/LogoDark"
import LogoIcon from "@/components/LogoIcon"
import { getTodayBirthdays } from "@/lib/actions/birthdays"

// Definición de tus rutas reales
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: GalleryVerticalEnd,
  },
  {
    title: "Talento",
    url: "/dashboard/models",
    icon: Users,
  },
  {
    title: "Proyectos",
    url: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "Clientes",
    url: "/dashboard/clients",
    icon: Building2,
  },
  {
    title: "Finanzas",
    url: "/dashboard/finances",
    icon: Wallet,
  },
  {
    title: "Cumpleaños",
    url: "/dashboard/birthdays",
    icon: Cake,
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [hasTodayBirthdays, setHasTodayBirthdays] = useState(false)

  // Cargar si hay cumpleaños hoy
  useEffect(() => {
    const checkBirthdays = async () => {
      const result = await getTodayBirthdays()
      if (result.success && result.data) {
        setHasTodayBirthdays(result.data.length > 0)
      }
    }
    checkBirthdays()
  }, [])

  return (
    // Agregamos variant="inset" para lograr el efecto redondeado estilo Sidebar-08
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="ACCESS">
              <Link href="/dashboard" className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
                {/* Logo con transición suave */}
                <div className="relative flex items-center justify-center overflow-hidden">
                  {/* Logo pequeño - visible cuando colapsado */}
                  <LogoIcon
                    className={`h-6 w-auto sidebar-transition ${isCollapsed
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-75 absolute'
                      }`}
                  />
                  {/* Logo completo - visible cuando expandido */}
                  <LogoDark
                    className={`h-4 w-auto sidebar-transition ${isCollapsed
                      ? 'opacity-0 scale-75 absolute'
                      : 'opacity-100 scale-100'
                      }`}
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-visible">
        <SidebarMenu className="overflow-visible">
          {navMain.map((item) => {
            // Lógica para determinar si el item está activo
            const isActive = item.url === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.url)

            // Determinar si mostrar indicador de cumpleaños
            const showBirthdayIndicator = item.url === '/dashboard/birthdays' && hasTodayBirthdays

            return (
              <SidebarMenuItem key={item.title} className="relative overflow-visible">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={isActive ? 'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground group-data-[collapsible=icon]:rounded-full' : ''}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                    {/* Indicador en modo expandido - al final de la fila */}
                    {showBirthdayIndicator && !isCollapsed && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
                {/* Indicador en modo colapsado - encima del cuadro */}
                {showBirthdayIndicator && isCollapsed && (
                  <span className="absolute top-0 right-2 h-2 w-2 rounded-full bg-primary animate-pulse pointer-events-none" />
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}