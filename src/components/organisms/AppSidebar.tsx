"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GalleryVerticalEnd,
  Users,
  FolderKanban,
  Building2,
  Wallet,
  Settings,
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
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    // Agregamos variant="inset" para lograr el efecto redondeado estilo Sidebar-08
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="ACCESS">
              <Link href="/dashboard" className="flex items-center justify-center">
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

      <SidebarContent>
        <SidebarMenu>
          {navMain.map((item) => {
            // Lógica para determinar si el item está activo
            const isActive = item.url === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
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