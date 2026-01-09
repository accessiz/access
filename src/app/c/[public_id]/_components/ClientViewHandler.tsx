'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Project, Model } from '@/lib/types';
import { finalizeProjectReview } from '@/lib/actions/client_actions';
import { updateProjectStatus } from '@/lib/actions/projects';
import { toast } from 'sonner';
import PasswordProtect from './PasswordProtect';
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientHeader } from '../../_components/ClientHeader';
import { ClientGrid } from '../../_components/ClientGrid';
import { ClientListView } from './ClientListView';
import { ClientToolbar } from './ClientToolbar';
import { ClientFooter } from '../../_components/ClientFooter';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';

type GridModel = Model & {
  selection?: 'pending' | 'approved' | 'rejected' | null
};

interface HandlerProps {
  project: Project;
  initialModels: Model[];
  hasAccessCookie: boolean;
}

const getStorageKey = (id: string, key: string) => `client_${id}_${key}`;

export default function ClientViewHandler({ project, initialModels, hasAccessCookie }: HandlerProps) {
  // 1. ESTADO DE LOS MODELOS (Base)
  const [models, setModels] = useState<GridModel[]>(
    initialModels.map(m => ({
      ...m,
      selection: (m.client_selection as GridModel['selection']) ?? 'pending'
    }))
  );

  // 2. ESTADOS DE FILTROS Y VISTA
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState({
    query: '',
    country: null as string | null,
    minHeight: null as number | null,
    maxHeight: null as number | null,
  });

  // 3. OTROS ESTADOS
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [isUpdatingStatus, startStatusUpdateTransition] = useTransition();
  const { user, loading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // --- EFECTO DE MONTAJE: RECUPERAR ESTADO Y ACTUALIZAR ESTADO DEL PROYECTO ---
  useEffect(() => {
    setIsMounted(true);
    const savedView = sessionStorage.getItem(getStorageKey(project.public_id, 'view'));
    if (savedView === 'list' || savedView === 'grid') setViewMode(savedView);

    const savedFilters = sessionStorage.getItem(getStorageKey(project.public_id, 'filters'));
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters({
          query: parsed.query || '',
          country: parsed.country || null,
          minHeight: parsed.minHeight || null,
          maxHeight: parsed.maxHeight || null
        });
      } catch (e) { console.error("Error parsing filters", e); }
    }

    const scrollKey = `client_scroll_${project.public_id}`;
    const savedScrollY = sessionStorage.getItem(scrollKey);
    if (savedScrollY) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollY, 10));
        sessionStorage.removeItem(scrollKey);
      }, 100);
    }

    // Lógica para actualizar el estado del proyecto a "in-review"
    if (authLoading) return;
    // Se ejecuta si nadie está logueado (es un cliente) y el proyecto está en "sent"
    if (user === null && project.status === 'sent' && !isUpdatingStatus) {
      startStatusUpdateTransition(async () => {
        // La acción ahora también puede registrar la start_date
        const result = await updateProjectStatus(project.id, 'in-review', true);
        if (!result.success) console.error("Error auto-updating status:", result.error);
      });
    }

  }, [project.public_id, project.id, project.status, isUpdatingStatus, user, authLoading]);

  // --- EFECTO: PERSISTENCIA DE ESTADO ---
  useEffect(() => {
    if (!isMounted) return;
    sessionStorage.setItem(getStorageKey(project.public_id, 'view'), viewMode);
    sessionStorage.setItem(getStorageKey(project.public_id, 'filters'), JSON.stringify(filters));
  }, [viewMode, filters, project.public_id, isMounted]);

  // --- LÓGICA DE FILTRADO (useMemo) ---
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      // 1. Filtro de Texto
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matchName = model.full_name?.toLowerCase().includes(q);
        const matchAlias = model.alias?.toLowerCase().includes(q);
        if (!matchName && !matchAlias) return false;
      }
      // 2. Filtro de País
      if (filters.country && model.country !== filters.country) {
        return false;
      }
      // 3. Filtro de Estatura
      if (model.height_cm) {
        if (filters.minHeight && model.height_cm < filters.minHeight) return false;
        if (filters.maxHeight && model.height_cm > filters.maxHeight) return false;
      } else {
        if (filters.minHeight || filters.maxHeight) return false;
      }
      return true;
    });
  }, [models, filters]);

  // --- SEGMENTACIÓN DE DATOS (Hombres / Mujeres) ---
  const womenModels = useMemo(() => filteredModels.filter(m => m.gender === 'Female'), [filteredModels]);
  const menModels = useMemo(() => filteredModels.filter(m => m.gender === 'Male'), [filteredModels]);
  const otherModels = useMemo(() => filteredModels.filter(m => m.gender !== 'Female' && m.gender !== 'Male'), [filteredModels]);

  // Obtener lista única de países para el filtro
  const availableCountries = useMemo(() => {
    const countries = new Set(models.map(m => m.country).filter(Boolean) as string[]);
    return Array.from(countries).sort();
  }, [models]);

  // --- HANDLERS ---
  const handleFilterChange = (newFilter: { key: string; value: string | null }) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (newFilter.key === 'query') updated.query = newFilter.value || '';
      else if (newFilter.key === 'country') updated.country = newFilter.value;
      else if (newFilter.key === 'minHeight') updated.minHeight = newFilter.value ? Number(newFilter.value) : null;
      else if (newFilter.key === 'maxHeight') updated.maxHeight = newFilter.value ? Number(newFilter.value) : null;
      return updated;
    });
  };

  const handleViewChange = (view: 'list' | 'grid') => {
    setViewMode(view);
  };

  // Sync initialModels logic
  useEffect(() => {
    if (models.length === 0 && initialModels.length > 0) {
      setModels(
        initialModels.map(m => ({
          ...m,
          selection: (m.client_selection as GridModel['selection']) ?? 'pending'
        }))
      );
    }
  }, [initialModels, models.length]);

  const handleFinalize = () => {
    startFinalizeTransition(async () => {
      const result = await finalizeProjectReview(project.id, true);
      if (result.success) {
        toast.success('¡Selección enviada!', { description: 'Procesando tus resultados...' });
      } else {
        toast.error('Error al finalizar', { description: result.error || 'No se pudo enviar tu revisión.' });
      }
    });
  };

  // Handler para cambio de selección desde el grid
  const handleSelectionChange = (modelId: string, selection: GridModel['selection']) => {
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, selection } : m
    ));
  };

  // Estadísticas de progreso
  const progressStats = useMemo(() => {
    const total = models.length;
    const approved = models.filter(m => m.selection === 'approved').length;
    const rejected = models.filter(m => m.selection === 'rejected').length;
    const pending = total - approved - rejected;
    const reviewed = approved + rejected;
    const percentage = total > 0 ? (reviewed / total) * 100 : 0;
    return { total, approved, rejected, pending, reviewed, percentage };
  }, [models]);

  if (project.password && !hasAccessCookie) {
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0">
        <ClientNavbar clientName={project.client_name} />

        <div className="py-24 sm:py-56">
          <ClientHeader project={project} />
        </div>

        <main className="w-full flex-1 space-y-8">

          {/* HEADER Y BOTÓN SUPERIOR */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-muted-foreground sm:text-base">
                Revisa el talento disponible. Utiliza los filtros para encontrar perfiles específicos.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="lg"
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="w-full md:w-auto text-white"
              >
                {isFinalizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
              </Button>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Progreso: {progressStats.reviewed}/{progressStats.total} calificados
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="size-4" />
                  {progressStats.approved} aprobados
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <XCircle className="size-4" />
                  {progressStats.rejected} rechazados
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" />
                  {progressStats.pending} pendientes
                </span>
              </div>
            </div>
            <Progress value={progressStats.percentage} className="h-2" />
          </div>

          {/* TOOLBAR: Eliminada propiedad gender: null */}
          <ClientToolbar
            countries={availableCountries}
            onFilterChange={handleFilterChange}
            onViewChange={handleViewChange}
            currentFilters={{
              ...filters,
              view: viewMode
            }}
          />

          {/* CONTENIDO (SECCIONES DIVIDIDAS) */}
          <div className="min-h-[400px] space-y-16">

            {/* SECCIÓN HOMBRES */}
            {menModels.length > 0 && (
              <section>
                <h2 className="text-heading-32 mb-8 border-b pb-4 uppercase tracking-tight">Hombres</h2>
                {viewMode === 'grid' ? (
                  <ClientGrid
                    models={menModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <ClientListView models={menModels} projectId={project.public_id} />
                )}
              </section>
            )}

            {/* SECCIÓN MUJERES */}
            {womenModels.length > 0 && (
              <section>
                <h2 className="text-heading-32 mb-8 border-b pb-4 uppercase tracking-tight">Mujeres</h2>
                {viewMode === 'grid' ? (
                  <ClientGrid
                    models={womenModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <ClientListView models={womenModels} projectId={project.public_id} />
                )}
              </section>
            )}

            {/* SECCIÓN OTROS */}
            {otherModels.length > 0 && (
              <section>
                <h2 className="text-heading-32 mb-8 border-b pb-4 uppercase tracking-tight">Otros</h2>
                {viewMode === 'grid' ? (
                  <ClientGrid
                    models={otherModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <ClientListView models={otherModels} projectId={project.public_id} />
                )}
              </section>
            )}

            {/* MENSAJE DE VACÍO GLOBAL */}
            {filteredModels.length === 0 && (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-copy-14 text-muted-foreground">No se encontraron talentos con estos filtros.</p>
              </div>
            )}

          </div>

          {/* BOTÓN INFERIOR */}
          <div className="flex justify-end pt-4 pb-16 md:pb-24">
            <Button
              size="lg"
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="text-white"
            >
              {isFinalizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
            </Button>
          </div>

        </main>

        <ClientFooter />
      </div>
    </div>
  );
}

