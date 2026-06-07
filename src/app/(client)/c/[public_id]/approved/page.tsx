import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientFooter } from '../../_components/ClientFooter';
import { ClientTalentCard } from '../../_components/ClientTalentCard';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { public_id: publicId } = await params;
  const project = await getProjectById(publicId);
  return {
    title: project ? `Aprobados — ${project.project_name}` : 'Modelos Aprobados',
    description: project
      ? `Lista de modelos aprobados para el proyecto ${project.project_name} de ${
          project.client_name || 'Cliente'
        }.`
      : 'Modelos aprobados',
  };
}

export default async function ApprovedModelsPage({ params }: PageProps) {
  const { public_id: publicId } = await params;
  const project = await getProjectById(publicId);

  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center p-4 bg-background text-foreground">
        <div>
          <h1 className="text-display mb-2">Proyecto no encontrado</h1>
          <p className="text-body text-muted-foreground">
            El enlace puede ser incorrecto o el proyecto ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  const models = await getModelsForProject(project.id);
  const approved = models.filter(m => m.client_selection === 'approved');

  // Segregar por género
  const men = approved.filter(m => m.gender?.toLowerCase() === 'male');
  const women = approved.filter(m => m.gender?.toLowerCase() === 'female');
  const other = approved.filter(
    m => m.gender?.toLowerCase() !== 'male' && m.gender?.toLowerCase() !== 'female'
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="w-full max-w-335 mx-auto px-6 md:px-0 flex flex-col flex-1">
        <ClientNavbar schedule={project.schedule} />

        <main className="flex-1 py-12 md:py-16 flex flex-col">
          {/* Header del Proyecto */}
          <div className="mb-12 space-y-3">
            <p className="text-label text-muted-foreground uppercase tracking-widest font-medium">
              IZ ACCESS • Galería de Aprobados
            </p>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <h1 className="text-display text-4xl sm:text-5xl font-semibold uppercase tracking-tighter text-foreground">
                  {project.project_name}
                </h1>
                {project.client_name && (
                  <p className="text-title text-muted-foreground mt-1">
                    Cliente: <span className="text-foreground font-medium">{project.client_name}</span>
                  </p>
                )}
              </div>
              <div className="self-start sm:self-auto">
                <Badge variant="success" className="gap-2 px-4 py-1.5 rounded-full text-sm font-semibold select-none">
                  <CheckCircle2 className="size-4" />
                  {approved.length} {approved.length === 1 ? 'Talento Aprobado' : 'Talentos Aprobados'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-16">
            {/* Mujeres Section */}
            {women.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-title font-semibold uppercase tracking-wider text-foreground">
                    Mujeres
                  </h2>
                  <span className="text-sm font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {women.length}
                  </span>
                  <div className="h-px flex-1 bg-border/60"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {women.map(model => (
                    <ClientTalentCard
                      key={model.id}
                      title={model.alias || 'Sin Alias'}
                      modelId={model.id}
                      coverUrl={model.coverUrl}
                      imageHref={`/c/${project.public_id}/${model.id}`}
                      showMobilePeekIcon
                    >
                      <p className="text-label text-muted-foreground mt-0.5 truncate">
                        {model.country || model.birth_country || '—'}
                      </p>
                    </ClientTalentCard>
                  ))}
                </div>
              </section>
            )}

            {/* Hombres Section */}
            {men.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-title font-semibold uppercase tracking-wider text-foreground">
                    Hombres
                  </h2>
                  <span className="text-sm font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {men.length}
                  </span>
                  <div className="h-px flex-1 bg-border/60"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {men.map(model => (
                    <ClientTalentCard
                      key={model.id}
                      title={model.alias || 'Sin Alias'}
                      modelId={model.id}
                      coverUrl={model.coverUrl}
                      imageHref={`/c/${project.public_id}/${model.id}`}
                      showMobilePeekIcon
                    >
                      <p className="text-label text-muted-foreground mt-0.5 truncate">
                        {model.country || model.birth_country || '—'}
                      </p>
                    </ClientTalentCard>
                  ))}
                </div>
              </section>
            )}

            {/* Otros Section */}
            {other.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-title font-semibold uppercase tracking-wider text-foreground">
                    Otros
                  </h2>
                  <span className="text-sm font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {other.length}
                  </span>
                  <div className="h-px flex-1 bg-border/60"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {other.map(model => (
                    <ClientTalentCard
                      key={model.id}
                      title={model.alias || 'Sin Alias'}
                      modelId={model.id}
                      coverUrl={model.coverUrl}
                      imageHref={`/c/${project.public_id}/${model.id}`}
                      showMobilePeekIcon
                    >
                      <p className="text-label text-muted-foreground mt-0.5 truncate">
                        {model.country || model.birth_country || '—'}
                      </p>
                    </ClientTalentCard>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {approved.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-border rounded-2xl text-center">
                <p className="text-title font-medium text-foreground">No se encontraron modelos aprobados</p>
                <p className="text-body text-muted-foreground mt-1">El cliente no seleccionó ningún talento en este proyecto.</p>
              </div>
            )}
          </div>
        </main>

        <ClientFooter />
      </div>
    </div>
  );
}
