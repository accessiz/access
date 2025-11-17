import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
// IMPORTA TU LOGO OSCURO
import LogoDark from '@/components/LogoDark';
import { LogOut, Menu, Settings, Users, FolderKanban, GalleryVerticalEnd } from 'lucide-react';
import DashboardNavLink from '@/components/organisms/DashboardNavLink';
import NotificationBell from '@/components/organisms/NotificationBell';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Definimos los links aquí para reusarlos
  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: GalleryVerticalEnd },
    { href: "/dashboard/models", label: "Talento", icon: Users },
    { href: "/dashboard/projects", label: "Proyectos", icon: FolderKanban },
  ];
  const settingsLink = { href: "/dashboard/settings", label: "Configuración", icon: Settings };

  return (
    // Grid solo aplica en 'md' y superior
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">

      {/* --- Sidebar de Escritorio --- */}
      <div className="hidden border-r bg-sidebar-background md:block">
            <div className="flex h-full max-h-screen flex-col">
                {/* --- DIV MODIFICADO: Se quitó border-b --- */}
                <div className="flex h-16 items-center px-6">
                    {/* --- LOGO REEMPLAZADO --- */}
                    <Link href="/dashboard/models" className="flex items-center gap-2 font-semibold">
                       {/* Usa el componente LogoDark y ajusta el tamaño con className */}
                       <LogoDark className="h-[1.4rem]" />
                    </Link>
                    {/* --- FIN LOGO REEMPLAZADO --- */}
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start pt-8 px-4 pb-4">
                      {navLinks.map((link) => (
                        <DashboardNavLink key={link.href} href={link.href}>
                          <span className="flex items-center gap-3 text-label-14"> {/* Aplicar clase de texto aquí */}
                            <link.icon className="h-4 w-4" />
                            {link.label}
                          </span>
                        </DashboardNavLink>
                      ))}
                    </nav>
                </div>
                 <div className="mt-auto px-4 pb-12">
                    <nav className="grid items-start">
                         <Link
                            href={settingsLink.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-label-14 text-muted-foreground transition-all hover:text-primary"
                        >
                            <settingsLink.icon className="h-4 w-4" />
                            {settingsLink.label}
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
      {/* --- FIN: Sidebar de Escritorio --- */}

      <div className="flex flex-col overflow-hidden">
        {/* --- Cabecera Modificada --- */}
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-nav-background px-4 md:px-8">

           {/* Botón Hamburguesa (Solo móvil) */}
           <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                {/* 1. Header del Sheet (con título oculto) */}
                <SheetHeader className="h-16 flex flex-row items-center border-b px-6">
                  {/* --- LOGO REEMPLAZADO (Sheet) --- */}
                   <Link href="/dashboard/models" className="flex items-center gap-2 font-semibold">
                       {/* Usa el componente LogoDark y ajusta el tamaño con className */}
                       <LogoDark className="h-[1.4rem]" />
                   </Link>
                   {/* --- FIN LOGO REEMPLAZADO (Sheet) --- */}
                  <div className="ml-auto flex items-center gap-2">
                    <NotificationBell showDotOnly />
                  </div>
                  <SheetTitle className="sr-only">Menú Principal</SheetTitle>
                </SheetHeader>

                {/* 2. Navegación (ahora flex-col) */}
                <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <DashboardNavLink href={link.href}>
                        <span className="flex items-center gap-3 text-label-16"> {/* Aplicar clase de texto aquí */}
                          <link.icon className="h-5 w-5" />
                          {link.label}
                        </span>
                      </DashboardNavLink>
                    </SheetClose>
                  ))}
                </nav>

                {/* 3. Footer del Sheet */}
                <div className="mt-auto border-t p-4 space-y-4">
                   <SheetClose asChild>
                      <Link
                          href={settingsLink.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-label-14 text-muted-foreground transition-all hover:text-primary"
                      >
                          <settingsLink.icon className="h-5 w-5" />
                          {settingsLink.label}
                      </Link>
                   </SheetClose>
                   <div className="flex flex-col gap-2 items-start px-3 py-2">
                      <p className="text-copy-14 text-foreground">{user.email}</p>
                      <form action="/auth/signout" method="post" className="w-full">
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start text-label-14 text-muted-foreground hover:text-primary p-0 h-auto"> {/* Aplicar clase de texto aquí */}
                            <LogOut className="mr-3 h-5 w-5" />
                            Cerrar sesión
                          </Button>
                        </SheetClose>
                      </form>
                   </div>
                </div>
              </SheetContent>
            </Sheet>

           {/* Placeholder central (oculto en móvil) */}
           <div className="flex-1 hidden md:block">
             {/* Espacio para breadcrumbs, etc. */}
           </div>

           {/* Info de Usuario, Notificaciones y Logout (Solo escritorio) */}
           <div className="hidden md:flex items-center gap-4">
             <p className="text-copy-13 text-muted-foreground hidden sm:block">{user.email}</p>
             <div className="hidden sm:block">
               <NotificationBell />
             </div>
             <form action="/auth/signout" method="post">
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Cerrar sesión</span>
                </Button>
              </form>
            </div>
        </header>
        {/* --- FIN: Cabecera Modificada --- */}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}