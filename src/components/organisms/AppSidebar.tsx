"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GalleryVerticalEnd,
  Users,
  FolderKanban,
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
} from "@/components/ui/sidebar"
import { User } from "@supabase/supabase-js"
import LogoDark from "@/components/LogoDark"

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
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const pathname = usePathname()

  return (
    // Agregamos variant="inset" para lograr el efecto redondeado estilo Sidebar-08
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                {/* Logo limpio sin contenedor de fondo */}
                <div className="flex flex-col gap-0.5 leading-none pl-2">
                   <LogoDark className="h-4 w-auto" />
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