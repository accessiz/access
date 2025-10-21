import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProjectStatusCounts, getRecentActivity, getLowCompletenessModels } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import DashboardQuickSearch from '@/components/organisms/DashboardQuickSearch';
import Link from 'next/link';

export default async function DashboardPage() {
  const counts = await getProjectStatusCounts();
  const activity = await getRecentActivity(5);
  const lowModels = await getLowCompletenessModels(5);

  return (
    <div className="space-y-6 p-8 md:p-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de proyectos, actividad y atajos.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-3 items-stretch">
        {/* Resumen de Estatus de Proyectos (ocupa 2 columnas en md) */}
        <div className="md:col-span-2 h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Resumen de Proyectos</CardTitle>
              <CardDescription>Conteos por estado y acceso rápido.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['in-review','draft','sent','completed'].map((s) => (
                  <Link key={s} href={`/dashboard/projects?status=${s}`} className="p-4 rounded-md border hover:shadow h-full flex flex-col justify-center">
                    <div className="text-sm text-muted-foreground capitalize">{s.replace('-', ' ')}</div>
                    <div className="text-2xl font-bold">{counts[s] ?? 0}</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atajos / Quick Actions */}
        <div className="h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Atajos</CardTitle>
              <CardDescription>Acciones rápidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button asChild>
                  <Link href="/dashboard/models/new"><span className="w-full text-center">Añadir Nuevo Talento</span></Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/projects/new"><span className="w-full text-center">Crear Nuevo Proyecto</span></Link>
                </Button>
                <div className="pt-4">
                  <DashboardQuickSearch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

  <div className="grid gap-8 md:grid-cols-2 mt-8 pb-6">
        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos en tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activity.map(a => (
                <li key={a.id} className="text-sm">
                  {a.type === 'model' ? `Se añadió/actualizó el talento ${a.title}` : `Proyecto: ${a.title} (${a.meta || 'estado'})`} • <span className="text-muted-foreground">{new Date(a.when).toLocaleString()}</span>
                </li>
              ))}
              {activity.length === 0 && <li className="text-sm text-muted-foreground">No hay actividad reciente</li>}
            </ul>
          </CardContent>
        </Card>

        {/* Talentos que requieren atención */}
        <Card>
          <CardHeader>
            <CardTitle>Perfiles por completar</CardTitle>
            <CardDescription>Modelos con menor completitud</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lowModels.map((m: any) => (
                <li key={m.id} className="flex justify-between items-center">
                  <Link href={`/dashboard/models/${m.id}`} className="text-sm font-medium">{m.alias || 'Sin alias'}</Link>
                  <span className="text-sm text-muted-foreground">{Math.round(m.profile_completeness || 0)}%</span>
                </li>
              ))}
              {lowModels.length === 0 && <li className="text-sm text-muted-foreground">No hay perfiles pendientes</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
