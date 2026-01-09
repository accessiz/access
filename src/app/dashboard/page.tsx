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
    <div className="grid gap-6">

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {/* Resumen de Estatus de Proyectos */}
        <div className="md:col-span-2 h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Resumen de Proyectos</CardTitle>
              <CardDescription>Conteos por estado actual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['in-review', 'draft', 'sent', 'completed'].map((s) => (
                  <Link key={s} href={`/dashboard/projects?status=${s}`} className="p-4 rounded-md border hover:bg-muted/50 transition-colors h-full flex flex-col justify-center">
                    <div className="text-label-13 text-muted-foreground capitalize">{s.replace('-', ' ')}</div>
                    <div className="text-heading-24 font-semibold">{counts[s] ?? 0}</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atajos */}
        <div className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Crear y buscar</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/dashboard/models/new">Añadir Talento</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/projects/new">Crear Proyecto</Link>
              </Button>
              <div className="mt-auto pt-4">
                <DashboardQuickSearch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activity.map(a => (
                <li key={a.id} className="text-copy-14 flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">
                    {a.type === 'model' ? `Talento: ${a.title}` : `Proyecto: ${a.title}`}
                  </span>
                  <span className="text-label-12 text-muted-foreground">{new Date(a.when).toLocaleString()}</span>
                </li>
              ))}
              {activity.length === 0 && <li className="text-copy-14 text-muted-foreground">Sin actividad.</li>}
            </ul>
          </CardContent>
        </Card>

        {/* Talentos que requieren atención */}
        <Card>
          <CardHeader>
            <CardTitle>Perfiles incompletos</CardTitle>
            <CardDescription>Atención requerida</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {lowModels.map((m: { id: string; alias: string | null; profile_completeness: number | null }) => (
                <li key={m.id} className="flex justify-between items-center text-copy-14">
                  <Link href={`/dashboard/models/${m.id}`} className="hover:underline font-medium">{m.alias || 'Sin alias'}</Link>
                  <span className={`px-2 py-1 rounded-full text-label-12 ${(m.profile_completeness || 0) < 50 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {Math.round(m.profile_completeness || 0)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}