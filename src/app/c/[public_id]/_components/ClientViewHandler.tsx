'use client';

import { useEffect, useState, useTransition, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
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
import { Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { useClientAnimation } from './ClientAnimationContext';

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

  // Animation Context
  const { animationState, startExitAnimation } = useClientAnimation();

  // Refs for animated elements (Phase 7)
  const navbarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);

  // 2. ESTADOS DE FILTROS Y VISTA
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState({
    query: '',
  });

  // 3. OTROS ESTADOS
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [isUpdatingStatus, startStatusUpdateTransition] = useTransition();
  const { user, loading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // --- EFECTO DE MONTAJE: RECUPERAR ESTADO Y ACTUALIZAR ESTADO DEL PROYECTO ---
  useEffect(() => {
    setIsMounted(true);
    // Trigger Exit Animation (Show Content)
    startExitAnimation();

    const savedView = sessionStorage.getItem(getStorageKey(project.public_id, 'view'));
    if (savedView === 'list' || savedView === 'grid') setViewMode(savedView);

    const savedFilters = sessionStorage.getItem(getStorageKey(project.public_id, 'filters'));
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters({
          query: parsed.query || ''
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

  }, [project.public_id, project.id, project.status, isUpdatingStatus, user, authLoading, startExitAnimation]);

  // --- PHASE 7: ANIMATE CONTENT ELEMENTS (Navbar, Header, Progress, Footer, Submit) ---
  useEffect(() => {
    if (animationState === 'finished' && isMounted) {
      const elements = [
        navbarRef.current,
        headerRef.current,
        progressRef.current,
        footerRef.current,
        submitRef.current
      ].filter(Boolean);

      // Set initial state
      gsap.set(elements, { opacity: 0, y: 20 });

      // Staggered reveal
      gsap.to(elements, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }
  }, [animationState, isMounted]);

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
      return true;
    });
  }, [models, filters]);

  // --- SEGMENTACIÓN DE DATOS (Hombres / Mujeres) ---
  const womenModels = useMemo(() => filteredModels.filter(m => m.gender === 'Female'), [filteredModels]);
  const menModels = useMemo(() => filteredModels.filter(m => m.gender === 'Male'), [filteredModels]);
  const otherModels = useMemo(() => filteredModels.filter(m => m.gender !== 'Female' && m.gender !== 'Male'), [filteredModels]);

  // --- HANDLERS ---
  const handleFilterChange = (newFilter: { key: string; value: string | null }) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (newFilter.key === 'query') updated.query = newFilter.value || '';
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
      <div className="w-full max-w-335 mx-auto px-6 md:px-0">
        <div ref={navbarRef}>
          <ClientNavbar schedule={project.schedule} />
        </div>

        <section className="py-12 sm:py-20 space-y-6">
          <div ref={headerRef}>
            <ClientHeader project={project} clientName={project.client_name} />
          </div>

          {/* BARRA DE PROGRESO (junto al bloque de proyecto/fechas) */}
          <div ref={progressRef} className="client-wow-progress p-4">
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
                <div className="min-w-0">
                  <p className="text-body font-medium text-foreground leading-snug sm:truncate">
                    Selección de talento
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Badge variant="success" size="small" className="gap-1.5">
                    <CheckCircle2 className="size-4" />
                    <span className="sr-only">Aprobados:</span>
                    {progressStats.approved}
                  </Badge>
                  <Badge variant="danger" size="small" className="gap-1.5">
                    <XCircle className="size-4" />
                    <span className="sr-only">Rechazados:</span>
                    {progressStats.rejected}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Progress value={progressStats.percentage} className="h-2 flex-1" />
                <span className="text-label text-foreground tabular-nums">
                  {Math.round(progressStats.percentage)}%
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="w-full flex-1 space-y-8">
          {/* TOOLBAR: Eliminada propiedad gender: null */}
          <ClientToolbar
            onFilterChange={handleFilterChange}
            onViewChange={handleViewChange}
            currentFilters={{
              ...filters,
              view: viewMode
            }}
          />

          {/* CONTENIDO (SECCIONES DIVIDIDAS) */}
          <div className="min-h-100 space-y-16">

            {/* SECCIÓN HOMBRES */}
            {menModels.length > 0 && (
              <section>
                <h2 className="text-title mb-8 border-b pb-4 uppercase tracking-tight">Hombres</h2>
                {viewMode === 'grid' ? (
                  <ClientGrid
                    models={menModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <ClientListView
                    models={menModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                )}
              </section>
            )}

            {/* SECCIÓN MUJERES */}
            {womenModels.length > 0 && (
              <section>
                <h2 className="text-title mb-8 border-b pb-4 uppercase tracking-tight">Mujeres</h2>
                {viewMode === 'grid' ? (
                  <ClientGrid
                    models={womenModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <ClientListView
                    models={womenModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                )}
              </section>
            )}

            {/* SECCIÓN OTROS */}
            {otherModels.length > 0 && (
              <section>
                <h2 className="text-title mb-8 border-b pb-4 uppercase tracking-tight">Otros</h2>
                {viewMode === 'grid' ? (
                  <ClientGrid
                    models={otherModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <ClientListView
                    models={otherModels}
                    projectId={project.public_id}
                    realProjectId={project.id}
                    onSelectionChange={handleSelectionChange}
                  />
                )}
              </section>
            )}

            {/* MENSAJE DE VACÍO GLOBAL */}
            {filteredModels.length === 0 && (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-body text-muted-foreground">No se encontraron talentos con estos filtros.</p>
              </div>
            )}

          </div>

          {/* BOTÓN INFERIOR */}
          <div ref={submitRef} className="flex justify-center pt-4 pb-16 sm:justify-end md:pb-24">
            <Button
              size="lg"
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="w-full text-white sm:w-auto"
            >
              {isFinalizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
            </Button>
          </div>

        </main>

        <div ref={footerRef}>
          <ClientFooter />
        </div>
      </div>
    </div>
  );
}

