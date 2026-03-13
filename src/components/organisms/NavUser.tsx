"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { User } from "@supabase/supabase-js"

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Obtiene iniciales o usa "IZ" si no hay email
  const initials = user.email?.substring(0, 2).toUpperCase() || "IZ"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                id="user-menu-trigger"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || ""} />
                  <AvatarFallback className="rounded-lg bg-purple text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-body leading-tight">
                  <span className="truncate font-semibold">Mi Cuenta</span>
                  <span className="truncate text-label">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-body">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || ""} />
                    <AvatarFallback className="rounded-lg bg-purple text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-body leading-tight">
                    <span className="truncate font-semibold">IZ Access</span>
                    <span className="truncate text-label">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Botón de Logout real conectado a tu ruta de auth */}
              <form action="/auth/signout" method="post" className="w-full">
                <button type="submit" className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-body outline-none transition-colors hover:bg-hover-overlay hover:text-primary">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-purple text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-body leading-tight">
              <span className="truncate font-semibold">Mi Cuenta</span>
              <span className="truncate text-label">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}