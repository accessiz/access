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
import { KPICard } from '@/components/molecules/KPICard';
import { CheckCircle2, Eye, FileText, Send } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const counts = await getProjectStatusCounts();
  const activity = await getRecentActivity(5);
  const lowModels = await getLowCompletenessModels(5);

  return (
    <div className="grid gap-6">

      <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display font-semibold">Dashboard</h1>
        </div>

        <div className="flex w-full sm:w-auto sm:ml-auto flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-wrap">
          <div className="w-full sm:w-95 order-1 sm:order-0">
            <DashboardQuickSearch />
          </div>

          <div className="w-full flex items-stretch gap-3 order-2 sm:order-0 sm:w-auto">
            <Button asChild className="flex-1 sm:flex-none">
              <Link href="/dashboard/models/new">Añadir Talento</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link href="/dashboard/projects/new">Crear Proyecto</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Resumen de Proyectos - Full width row like Finanzas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="In Review"
          value={String(counts['in-review'] ?? 0)}
          description="Proyectos en revisión"
          icon={Eye}
          iconClassName="text-info"
          href="/dashboard/projects?status=in-review"
        />
        <KPICard
          title="Draft"
          value={String(counts['draft'] ?? 0)}
          description="Proyectos en borrador"
          icon={FileText}
          iconClassName="text-warning"
          href="/dashboard/projects?status=draft"
        />
        <KPICard
          title="Sent"
          value={String(counts['sent'] ?? 0)}
          description="Proyectos enviados"
          icon={Send}
          iconClassName="text-accent"
          href="/dashboard/projects?status=sent"
        />
        <KPICard
          title="Completed"
          value={String(counts['completed'] ?? 0)}
          description="Proyectos finalizados"
          icon={CheckCircle2}
          iconClassName="text-success"
          href="/dashboard/projects?status=completed"
        />
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
                <li key={a.id} className="text-body flex flex-col gap-x-1 gap-y-1 border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">
                    {a.type === 'model' ? `Talento: ${a.title}` : `Proyecto: ${a.title}`}
                  </span>
                  <span className="text-label text-muted-foreground">{new Date(a.when).toLocaleString()}</span>
                </li>
              ))}
              {activity.length === 0 && <li className="text-body text-muted-foreground">Sin actividad.</li>}
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
                <li key={m.id} className="flex justify-between items-center text-body">
                  <Link href={`/dashboard/models/${m.id}`} className="hover:underline font-medium">{m.alias || 'Sin alias'}</Link>
                  <span
                    className={
                      `px-2 py-1 rounded-full text-label ` +
                      ((m.profile_completeness || 0) < 50
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning')
                    }
                  >
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