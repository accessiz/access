'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User, CalendarCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import LogoIcon from '@/components/LogoIcon';
import Logo from '@/components/LogoDark';
import { logoutModel } from '@/lib/actions/models_portal';

export function ModelPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const result = await logoutModel();
      if (result.success) {
        window.location.href = '/model/login';
      }
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const isProjectPage = pathname.startsWith('/m/');
  const projectPublicId = isProjectPage ? pathname.split('/')[2] : null;

  const isActive = (path: string) => pathname === path;
  const isLoginPage = pathname === '/model/login';

  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground ${isLoginPage ? '' : 'pb-20 lg:pb-0'}`}>
      {/* Estructura Principal del Workspace */}
      <div className="flex flex-grow flex-col lg:flex-row w-full min-h-screen">
        
        {/* Sidebar de Navegación Lateral (Oculto en móvil, activo en Desktop lg:) */}
        {!isLoginPage && (
          <aside className="hidden lg:flex w-20 bg-card h-screen sticky top-0 border-r border-border flex-col items-center justify-between py-8 shrink-0 transition-colors duration-200 z-20">
            
            {/* Logo Access Isotype */}
            <LogoIcon className="h-7 w-auto transition-transform hover:scale-105 cursor-pointer" />

            {/* Grupo Central de Navegación */}
            <nav className="flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={handleLogout}
                className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-hover-overlay/15 transition-all duration-200 cursor-pointer border-0 bg-transparent"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>

              <Link
                href="/model/profile"
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive('/model/profile') 
                    ? 'bg-purple text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-hover-overlay/15'
                }`}
                title="Mi Perfil"
              >
                <User className="h-5 w-5" />
              </Link>

              {isProjectPage && projectPublicId ? (
                <Link
                  href={`/m/${projectPublicId}`}
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive(`/m/${projectPublicId}`) 
                      ? 'bg-purple text-white shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-hover-overlay/15'
                  }`}
                  title="Detalle del Trabajo Pendiente"
                >
                  <CalendarCheck className="h-5 w-5" />
                </Link>
              ) : (
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
                  title="Ningún detalle de proyecto activo"
                >
                  <CalendarCheck className="h-5 w-5" />
                </div>
              )}
            </nav>

            {/* Selector de Tema */}
            <div className="flex flex-col items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-hover-overlay/15 flex items-center justify-center cursor-pointer border-0"
                title="Cambiar Tema"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </aside>
        )}

        {/* Barra de Navegación Móvil (Bottom Tab Bar - 100% Mobile-First) */}
        {!isLoginPage && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex justify-around items-center py-3 px-4 shadow-sm transition-colors duration-200">
            {/* 1. Workspace */}
            <Link
              href="/model/profile"
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive('/model/profile') ? 'text-purple' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Workspace</span>
            </Link>

            {/* 2. Aplicar */}
            {isProjectPage && projectPublicId ? (
              <Link
                href={`/m/${projectPublicId}`}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isActive(`/m/${projectPublicId}`) ? 'text-purple' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarCheck className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Aplicar</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground/30 pointer-events-none">
                <CalendarCheck className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Aplicar</span>
              </div>
            )}

            {/* 3. Tema */}
            <button 
              onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all bg-transparent border-0 cursor-pointer"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider">Tema</span>
            </button>

            {/* 4. Salir */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all bg-transparent border-0 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Salir</span>
            </button>
          </nav>
        )}

        {/* Contenedor Principal de Contenido */}
        <div className="flex-grow flex flex-col w-full overflow-hidden">
          <div className="flex-grow flex flex-col p-4 md:p-8 lg:p-10 justify-between gap-8 z-10 w-full max-w-[1600px] mx-auto">
            
            {/* Mobile Top Header */}
            {!isLoginPage && (
              <header className="lg:hidden flex items-center justify-between border-b border-border pb-3">
                <Logo className="h-6 w-auto text-foreground" />
              </header>
            )}

            {/* Workspace Wrapper */}
            <div className="w-full flex-grow flex flex-col items-center justify-center">
              {children}
            </div>

            {/* Footer removed */}
          </div>
        </div>

      </div>
    </div>
  );
}
