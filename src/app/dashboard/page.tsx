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
import { IncompleteProfilesList } from '@/components/molecules/IncompleteProfilesList';
import { getModelApplicationStats } from '@/lib/api/dashboard';
import { ModelRankingsCard } from '@/components/organisms/ModelRankingsCard';

export default async function DashboardPage() {
  const counts = await getProjectStatusCounts();
  const activity = await getRecentActivity(5);
  const lowModels = await getLowCompletenessModels(5);
  const modelStats = await getModelApplicationStats(100);

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
          className="bg-[rgb(var(--sys-bg-secondary))] hover:bg-[rgb(var(--sys-bg-secondary))]"
          href="/dashboard/projects?status=in-review"
        />
        <KPICard
          title="Draft"
          value={String(counts['draft'] ?? 0)}
          description="Proyectos en borrador"
          icon={FileText}
          iconClassName="text-warning"
          className="bg-[rgb(var(--sys-bg-secondary))] hover:bg-[rgb(var(--sys-bg-secondary))]"
          href="/dashboard/projects?status=draft"
        />
        <KPICard
          title="Sent"
          value={String(counts['sent'] ?? 0)}
          description="Proyectos enviados"
          icon={Send}
          iconClassName="text-accent"
          className="bg-[rgb(var(--sys-bg-secondary))] hover:bg-[rgb(var(--sys-bg-secondary))]"
          href="/dashboard/projects?status=sent"
        />
        <KPICard
          title="Completed"
          value={String(counts['completed'] ?? 0)}
          description="Proyectos finalizados"
          icon={CheckCircle2}
          iconClassName="text-success"
          className="bg-[rgb(var(--sys-bg-secondary))] hover:bg-[rgb(var(--sys-bg-secondary))]"
          href="/dashboard/projects?status=completed"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Actividad Reciente */}
        <Card className="bg-[rgb(var(--sys-bg-secondary))]">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription className="text-secondary">Últimos movimientos</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activity.map(a => {
                // Determinar la URL basándose en metadata
                const href = a.metadata?.project_id
                  ? `/dashboard/projects/${a.metadata.project_id}`
                  : a.metadata?.entity_id && a.metadata?.entity_type === 'project'
                    ? `/dashboard/projects/${a.metadata.entity_id}`
                    : a.metadata?.entity_id && a.metadata?.entity_type === 'model'
                      ? `/dashboard/models/${a.metadata.entity_id}`
                      : null;

                const content = (
                  <>
                    <span className="font-medium text-secondary">
                      {a.type === 'model' ? `Talento: ${a.title}` : `Proyecto: ${a.title}`}
                    </span>
                    <span className="text-label text-tertiary">{new Date(a.when).toLocaleString()}</span>
                  </>
                );

                return (
                  <li key={a.id} className="text-body">
                    {href ? (
                      <Link
                        href={href}
                        className="bg-quaternary hover:bg-hover-overlay p-3 rounded-md transition-colors flex flex-col gap-y-1"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="bg-quaternary p-3 rounded-md flex flex-col gap-y-1">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
              {activity.length === 0 && <li className="text-body text-muted-foreground">Sin actividad.</li>}
            </ul>
          </CardContent>
        </Card>

        {/* Talentos que requieren atención */}
        <Card className="bg-[rgb(var(--sys-bg-secondary))]">
          <CardHeader>
            <CardTitle className="text-primary">Perfiles incompletos</CardTitle>
          </CardHeader>
          <CardContent>
            <IncompleteProfilesList models={lowModels} />
          </CardContent>
        </Card>
      </div>

      {/* Rankings de Modelos - Full Width */}
      <ModelRankingsCard initialData={modelStats} />
    </div>
  );
}