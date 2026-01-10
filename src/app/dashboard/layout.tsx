import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// IMPORTANTE: Estamos importando NUESTRO sidebar, no el generico
import { AppSidebar } from "@/components/organisms/AppSidebar"
import { DynamicBreadcrumb } from "@/components/molecules/DynamicBreadcrumb"
import { HeaderActions } from "@/components/molecules/HeaderActions"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      {/* Pasamos el usuario real al componente Sidebar */}
      <AppSidebar user={user} />

      <SidebarInset className="bg-sidebar">
        {/* Header superior flotante */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-x-2 gap-y-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4 bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-x-2 gap-y-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>

          {/* Iconos de notificaciones y tema */}
          <HeaderActions />
        </header>

        {/* Aquí se renderiza tu página (Dashboard, Tabla de modelos, etc) */}
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-background rounded-xl overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
