import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectsForUser } from '@/lib/api/projects';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from 'lucide-react';

// Función para formatear fechas de una manera más amigable
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Componente para mostrar un badge de color según el estado del proyecto
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return <Badge variant="outline" className={`capitalize ${statusStyles[status] || ''}`}>{status}</Badge>;
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  // Usamos nuestra nueva función para obtener los proyectos del usuario
  const projects = await getProjectsForUser();

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      {/* --- Encabezado de la página --- */}
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
          // Vista para cuando no hay proyectos
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
          // Vista para cuando sí hay proyectos
          <Card>
            <CardHeader>
                <CardTitle>Tus Proyectos</CardTitle>
                <CardDescription>
                    Aquí tienes una lista de todos tus castings activos y pasados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre del Proyecto</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha de Creación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((project) => (
                        <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-primary hover:underline">
                                {project.project_name}
                              </Link>
                            </TableCell>
                            <TableCell>{project.client_name || 'N/A'}</TableCell>
                            <TableCell><StatusBadge status={project.status} /></TableCell>
                            <TableCell>{formatDate(project.created_at)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

