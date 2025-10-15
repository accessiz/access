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
  const supabase = await createClient();

  // SOLUCIÓN: Se cambia getSession() por getUser() para validar
  // la sesión de forma segura contra el servidor de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-nav-background px-8">
           <div className="w-full flex-1">
             {/* Placeholder for future breadcrumbs or global search */}
           </div>
           {/* Se actualiza para usar el objeto 'user' en lugar de 'session' */}
           <p className="text-sm text-muted-foreground hidden sm:block">{user.email}</p>
           <form action="/auth/signout" method="post">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </form>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
