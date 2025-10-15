import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Por ahora, solo preparamos la estructura.
  // En el siguiente paso, haremos la consulta a la base de datos
  // para obtener y mostrar los proyectos aquí.
  const projects: any[] = [];

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      {/* --- Encabezado --- */}
      <header className="flex items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos de Casting</h1>
          <p className="text-muted-foreground">Crea y gestiona las selecciones para tus clientes.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <PlusCircle />
            Nuevo Proyecto
          </Link>
        </Button>
      </header>

      {/* --- Contenido Principal --- */}
      <main className="flex-1 py-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full rounded-lg border border-dashed py-20">
            <p className="text-lg font-semibold">Aún no has creado ningún proyecto</p>
            <p className="text-muted-foreground mb-6">Haz clic en "Nuevo Proyecto" para empezar.</p>
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <PlusCircle />
                Crear tu primer proyecto
              </Link>
            </Button>
          </div>
        ) : (
          <div>
            {/* Aquí listaremos los proyectos más adelante */}
            <p>Aquí se mostrará la lista de proyectos.</p>
          </div>
        )}
      </main>
    </div>
  );
}
