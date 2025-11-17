// src/components/organisms/DashboardNavLink.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // Asegúrate de importar cn

export default function DashboardNavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number | null }) {
  const pathname = usePathname();
  let isActive = false;
  if (!pathname) isActive = false;
  else if (href === '/dashboard') {
    isActive = pathname === '/dashboard';
  } else {
    // Asegura que /dashboard/models no marque /dashboard como activo
    isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
  }

  return (
    <Link
      href={href}
      // --- INICIO MODIFICACIÓN ---
      className={cn(
        // Clases base para TODOS los links
        "relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all overflow-hidden", // Añadido relative y overflow-hidden
        // Clases condicionales para ACTIVO vs INACTIVO
        isActive
          ? "bg-accent text-foreground active-nav-glow" // Clase base activa + NUEVA clase para el brillo
          : "text-muted-foreground hover:text-foreground" // Clases para inactivo + hover
      )}
      // --- FIN MODIFICACIÓN ---
    >
      <span className="flex-1">{children}</span>
      {typeof badge === 'number' && badge > 0 && <Badge>{badge}</Badge>}
    </Link>
  );
}