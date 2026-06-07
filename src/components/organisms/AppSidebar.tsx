"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
  Globe,
  AlertTriangle,
  KeyRound,
  Sparkles,
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

const SIDEBAR_CACHE_TTL_MS = 5 * 60 * 1000

type SidebarCacheValue<T> = {
  value: T
  expiresAt: number
}

function readSidebarCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as SidebarCacheValue<T>
    if (parsed.expiresAt <= Date.now()) {
      try { window.sessionStorage.removeItem(key) } catch {}
      return null
    }
    return parsed.value
  } catch {
    try { window.sessionStorage.removeItem(key) } catch {}
    return null
  }
}

function writeSidebarCache<T>(key: string, value: T) {
  if (typeof window === 'undefined') return

  try {
    const payload: SidebarCacheValue<T> = {
      value,
      expiresAt: Date.now() + SIDEBAR_CACHE_TTL_MS,
    }
    window.sessionStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // Silence errors in environments with disabled storage
  }
}

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
    title: "Generador Compcard",
    url: "/dashboard/compcard-generator",
    icon: Sparkles,
  },
  {
    title: "Accesos",
    url: "/dashboard/models/access",
    icon: KeyRound,
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
    title: "Web",
    url: "/dashboard/web",
    icon: Globe,
  },
  {
    title: "Alertas",
    url: "/dashboard/alerts",
    icon: AlertTriangle,
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile, openMobile } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [hasTodayBirthdays, setHasTodayBirthdays] = useState(false)
  const [alertCount, setAlertCount] = useState(0)

  // Ref para rastrear si hay una navegación pendiente en mobile
  const pendingNavigationRef = useRef(false)

  // Cerrar el sidebar móvil cuando el pathname cambie (página cargada)
  useEffect(() => {
    if (isMobile && pendingNavigationRef.current && openMobile) {
      setOpenMobile(false)
      pendingNavigationRef.current = false
    }
  }, [pathname, isMobile, openMobile, setOpenMobile])

  // Handler para marcar que hay una navegación pendiente en mobile
  const handleNavClick = () => {
    if (isMobile) {
      pendingNavigationRef.current = true
    }
  }

  // Cargar si hay cumpleaños hoy
  useEffect(() => {
    const checkBirthdays = async () => {
      const cached = readSidebarCache<boolean>('sidebar:today-birthdays')
      if (cached !== null) {
        setHasTodayBirthdays(cached)
        return
      }

      const result = await getTodayBirthdays()
      if (result.success && result.data) {
        const hasBirthdays = result.data.length > 0
        setHasTodayBirthdays(hasBirthdays)
        writeSidebarCache('sidebar:today-birthdays', hasBirthdays)
      }
    }
    checkBirthdays()
  }, [])

  // Cargar conteo de alertas - solo cuando pestaña visible
  useEffect(() => {
    const fetchAlertCount = async () => {
      const cached = readSidebarCache<number>('sidebar:alert-count')
      if (cached !== null) {
        setAlertCount(cached)
        return
      }

      try {
        const response = await fetch('/api/alerts', { cache: 'force-cache' })
        if (response.ok) {
          const data = await response.json()
          const nextCount = data.count || 0
          setAlertCount(nextCount)
          writeSidebarCache('sidebar:alert-count', nextCount)
        }
      } catch {
        // Silently fail - alerts are not critical
      }
    }
    fetchAlertCount()

    // Solo refetch cuando la pestaña vuelve a estar activa
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAlertCount()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    // Agregamos variant="inset" para lograr el efecto redondeado estilo Sidebar-08
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="h-16 px-2 py-2 justify-center group-data-[collapsible=icon]:px-1!">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="ACCESS">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                {/* Logo con transición suave */}
                {!isCollapsed && (
                  <span aria-hidden className="h-4 w-4 shrink-0" />
                )}

                <div className="relative flex items-center overflow-hidden">
                  {/* Logo pequeño - visible cuando colapsado */}
                  <LogoIcon
                    className={`h-5 w-5 sidebar-transition ${isCollapsed
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

      <SidebarContent className="overflow-visible px-2 pt-5">
        <SidebarMenu className="overflow-visible">
          {navMain.map((item) => {
            // Lógica para determinar si el item está activo
            // Rutas que tienen sub-rutas como ítems separados en el sidebar
            const siblingUrls = navMain
              .filter(n => n.url !== item.url && n.url.startsWith(item.url))
              .map(n => n.url)

            const isActive = item.url === '/dashboard'
              ? pathname === '/dashboard'
              : siblingUrls.length > 0
                ? pathname.startsWith(item.url) && !siblingUrls.some(s => pathname.startsWith(s))
                : pathname.startsWith(item.url)

            // Determinar si mostrar indicador de cumpleaños
            const showBirthdayIndicator = item.url === '/dashboard/birthdays' && hasTodayBirthdays

            // Determinar si mostrar indicador de alertas
            const showAlertIndicator = item.url === '/dashboard/alerts' && alertCount > 0

            return (
              <SidebarMenuItem key={item.title} className="relative overflow-visible">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={isActive ? 'group-data-[collapsible=icon]:rounded-full' : ''}
                >
                  <Link href={item.url} onClick={handleNavClick}>
                    <item.icon />
                    <span>{item.title}</span>
                    {/* Indicador de cumpleaños en modo expandido */}
                    {showBirthdayIndicator && !isCollapsed && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[rgb(var(--primary))] animate-pulse" />
                    )}
                    {/* Indicador de alertas con contador en modo expandido */}
                    {showAlertIndicator && !isCollapsed && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-semibold text-warning-foreground">
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
                {/* Indicador en modo colapsado - encima del cuadro */}
                {showBirthdayIndicator && isCollapsed && (
                  <span className="absolute top-0 right-2 h-2 w-2 rounded-full bg-[rgb(var(--primary))] animate-pulse pointer-events-none" />
                )}
                {/* Indicador de alertas en modo colapsado */}
                {showAlertIndicator && isCollapsed && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground pointer-events-none">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
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