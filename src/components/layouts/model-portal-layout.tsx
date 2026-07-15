'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User, CalendarCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import LogoIcon from '@/components/LogoIcon';
import Logo from '@/components/LogoDark';
import { logoutModel, checkActiveApplicationsAction } from '@/lib/actions/models_portal';
import gsap from 'gsap';

export function ModelPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [hasActive, setHasActive] = React.useState(false);

  const indicatorRef = React.useRef<HTMLDivElement>(null);
  const buttonRefs = React.useRef<{ [key: string]: HTMLElement | null }>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const checkActive = async () => {
      try {
        const res = await checkActiveApplicationsAction();
        setHasActive(res.hasActive);
      } catch (err) {
        console.error('Error checking active applications:', err);
      }
    };
    checkActive();
  }, [pathname]);

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

  React.useEffect(() => {
    if (!mounted) return;

    let activeKey = '';
    if (isActive('/model/profile')) activeKey = '/model/profile';
    else if (isActive('/model/apply') || isProjectPage) activeKey = '/model/apply';

    const activeEl = buttonRefs.current[activeKey];
    const indicator = indicatorRef.current;

    if (activeEl && indicator) {
      const activeLeft = activeEl.offsetLeft;
      const activeWidth = activeEl.offsetWidth;
      const activeHeight = activeEl.offsetHeight;

      // Animar posición y tamaño del indicador usando GSAP para transiciones fluidas y orgánicas
      gsap.to(indicator, {
        x: activeLeft,
        width: activeWidth,
        height: activeHeight,
        duration: 0.45,
        ease: 'power3.out',
        opacity: 1,
        scale: 1,
      });
    } else if (indicator) {
      // Ocultar si no hay ninguna opción activa elegible para el slide
      gsap.to(indicator, {
        opacity: 0,
        scale: 0.8,
        duration: 0.25,
      });
    }
  }, [pathname, isProjectPage, hasActive, mounted]);

  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground ${isLoginPage ? '' : 'pb-24 md:pb-28'}`}>
      {/* Estructura Principal del Workspace */}
      <div className="flex flex-grow flex-col w-full min-h-screen">
        
        {/* Contenedor Principal de Contenido */}
        <div className="flex-grow flex flex-col w-full overflow-hidden">
          <div className={`flex-grow flex flex-col justify-start z-10 w-full ${isLoginPage ? 'max-w-none p-0 gap-0' : 'max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 pb-28 md:pb-32 gap-8'}`}>
            
            {/* Mobile Top Header */}
            {!isLoginPage && (
              <header className="lg:hidden flex items-center justify-center border-b border-border pb-3">
                <Logo className="h-6 w-auto text-foreground" />
              </header>
            )}

            {/* Workspace Wrapper */}
            <div className="w-full flex-grow flex flex-col items-center justify-start">
              {children}
            </div>

          </div>
        </div>

        {/* Floating Capsule Toolbar Navigation */}
        {!isLoginPage && (
          <nav
            className="ds-floating-toolbar fixed bottom-6 left-0 right-0 mx-auto w-max z-50 flex items-center gap-4 rounded-full px-6 py-3"
            style={{
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              background: 'rgba(var(--ds-color-surface-container-high), 0.78)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="relative flex items-center gap-4">
              
              {/* GSAP Sliding Indicator Circle Background */}
              <div 
                ref={indicatorRef}
                className="absolute left-0 top-0 rounded-full bg-[rgb(var(--ds-color-primary))] shadow-md pointer-events-none z-0"
                style={{ opacity: 0, width: '48px', height: '48px' }}
              />

              {/* Workspace */}
              <Link
                ref={el => { buttonRefs.current['/model/profile'] = el; }}
                href="/model/profile"
                className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-90 border-0 ${
                  isActive('/model/profile')
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[rgb(var(--ds-color-surface-container-highest))]/80 bg-[rgb(var(--ds-color-surface-container-lowest))]/60'
                }`}
                title="Mi Perfil"
              >
                <User className="h-5.5 w-5.5" />
              </Link>

              {/* Aplicar */}
              {hasActive ? (
                <Link
                  ref={el => { buttonRefs.current['/model/apply'] = el; }}
                  href="/model/apply"
                  className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-90 border-0 ${
                    isActive('/model/apply') || isProjectPage
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[rgb(var(--ds-color-surface-container-highest))]/80 bg-[rgb(var(--ds-color-surface-container-lowest))]/60'
                  }`}
                  title="Aplicaciones Activas"
                >
                  <CalendarCheck className="h-5.5 w-5.5" />
                </Link>
              ) : (
                <div
                  className="relative z-10 h-12 w-12 rounded-full flex items-center justify-center text-muted-foreground/35 bg-[rgb(var(--ds-color-surface-container-lowest))]/60 cursor-not-allowed"
                  title="Ninguna postulación activa disponible"
                >
                  <CalendarCheck className="h-5.5 w-5.5 opacity-30" />
                </div>
              )}

              {/* Tema */}
              <button
                onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative z-10 h-12 w-12 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[rgb(var(--ds-color-surface-container-highest))]/80 bg-[rgb(var(--ds-color-surface-container-lowest))]/60 transition-all active:scale-90 border-0 cursor-pointer"
                title="Cambiar Tema"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="h-5.5 w-5.5" />
                ) : (
                  <Moon className="h-5.5 w-5.5" />
                )}
              </button>

              {/* Salir (Fondo igual al solecito con icono destacado en rojo) */}
              <button
                type="button"
                onClick={handleLogout}
                className="relative z-10 h-12 w-12 rounded-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-[rgb(var(--ds-color-surface-container-highest))]/80 bg-[rgb(var(--ds-color-surface-container-lowest))]/60 transition-all active:scale-90 border-0 cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5.5 w-5.5" />
              </button>

            </div>
          </nav>
        )}

      </div>
    </div>
  );
}
