import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/organisms/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    // Se establece una altura fija a la pantalla para controlar el scroll
    <div className="grid h-screen w-full md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
      <Sidebar />
      {/* Este contenedor ahora maneja el overflow para que el scroll no afecte al sidebar */}
      <div className="flex flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <div className="w-full flex-1">
             {/* Aquí podría ir un breadcrumb o título de la página activa */}
           </div>
           <p className="text-sm text-muted-foreground hidden sm:block">{session.user.email}</p>
           <form action="/auth/signout" method="post">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </form>
        </header>
        {/* El 'main' es ahora el único elemento que hará scroll si su contenido es muy largo */}
        <main className="flex-1 overflow-y-auto p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
