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
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-nav-background px-6">
           <div className="w-full flex-1">
             {/* Placeholder for future breadcrumbs or global search */}
           </div>
           <p className="text-sm text-muted-foreground hidden sm:block">{session.user.email}</p>
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

