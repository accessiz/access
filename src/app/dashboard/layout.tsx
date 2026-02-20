import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// IMPORTANTE: Estamos importando NUESTRO sidebar, no el generico
import { AppSidebar } from "@/components/organisms/AppSidebar"
import { HeaderActions } from "@/components/molecules/HeaderActions"
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
    <SidebarProvider defaultOpen={false}>
      {/* Pasamos el usuario real al componente Sidebar */}
      <AppSidebar user={user} />

      <SidebarInset className="bg-[rgb(var(--sys-bg))] flex flex-col h-svh overflow-hidden">
        {/* Header superior - transparente y alineado */}
        <header className="flex h-16 shrink-0 items-center justify-between px-4 transition-all duration-300">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>

          {/* Iconos de notificaciones y tema */}
          <HeaderActions />
        </header>

        {/* Área de contenido fluida - Mobile: scrollable, Desktop: fixed/hidden (handled by children) */}
        <main className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col px-4 md:px-12">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
