'use client';

import { useEffect, useState, useTransition, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { Project, Model } from '@/lib/types';
import { finalizeProjectReview, markProjectInReview } from '@/lib/actions/client_actions';
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
import { Progress } from '@/components/ui/progress';
import { useClientAnimation } from './ClientAnimationContext';
import { readVersionedStorage, removeVersionedStorage, writeVersionedStorage } from '@/lib/client-storage';

type GridModel = Model & {
  selection?: 'pending' | 'approved' | 'rejected' | null
};

interface HandlerProps {
  project: Project;
  initialModels: Model[];
  hasAccessCookie: boolean;
  isAdmin: boolean;
}

const CLIENT_VIEW_STORAGE_VERSION = 1;
const getStorageKey = (id: string, key: string) => `client:${id}:${key}`;

export default function ClientViewHandler({ project, initialModels, hasAccessCookie, isAdmin }: HandlerProps) {
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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'single'>('grid');
  const [groupBy, setGroupBy] = useState<'gender' | 'date'>('gender');

  const [filters, setFilters] = useState({
    query: '',
  });

  // 3. OTROS ESTADOS
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const statusUpdateAttempted = useRef(false);

  // --- EFECTO DE MONTAJE: RECUPERAR ESTADO Y ACTUALIZAR ESTADO DEL PROYECTO ---
  useEffect(() => {
    setIsMounted(true);
    // Trigger Exit Animation (Show Content)
    startExitAnimation();

    const savedView = readVersionedStorage<'list' | 'grid' | 'single'>('session', getStorageKey(project.public_id, 'view'), CLIENT_VIEW_STORAGE_VERSION);
    if (savedView === 'list' || savedView === 'grid' || savedView === 'single') setViewMode(savedView);

    const savedGroupBy = readVersionedStorage<'gender' | 'date'>('session', getStorageKey(project.public_id, 'groupBy'), CLIENT_VIEW_STORAGE_VERSION);
    if (savedGroupBy === 'gender' || savedGroupBy === 'date') setGroupBy(savedGroupBy);

    const savedFilters = readVersionedStorage<typeof filters>('session', getStorageKey(project.public_id, 'filters'), CLIENT_VIEW_STORAGE_VERSION);
    if (savedFilters) {
      setFilters({
        query: savedFilters.query || ''
      });
    }

    const scrollKey = getStorageKey(project.public_id, 'scroll');
    const savedScrollY = readVersionedStorage<number>('session', scrollKey, CLIENT_VIEW_STORAGE_VERSION);
    if (typeof savedScrollY === 'number') {
      setTimeout(() => {
        window.scrollTo(0, savedScrollY);
        removeVersionedStorage('session', scrollKey);
      }, 100);
    }

    // Recuperar selecciones guardadas de sessionStorage para evitar desfases con la caché de Next.js
    const storageKey = getStorageKey(project.public_id, 'selections');
    const cachedSelections = readVersionedStorage<Record<string, GridModel['selection']>>('session', storageKey, CLIENT_VIEW_STORAGE_VERSION);
    if (cachedSelections) {
      setModels(prev =>
        prev.map(m => {
          if (cachedSelections[m.id] !== undefined) {
            return { ...m, selection: cachedSelections[m.id] };
          }
          return m;
        })
      );
    }

    // Lógica para actualizar el estado del proyecto a "in-review"
    // Se ejecuta una sola vez si el cliente (no admin) abre un proyecto en estado "sent"
    if (!isAdmin && project.status === 'sent' && !statusUpdateAttempted.current) {
      statusUpdateAttempted.current = true;
      markProjectInReview(project.id).then((result) => {
        if (!result.success) console.error("Error auto-updating status:", result.error);
      });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    writeVersionedStorage('session', getStorageKey(project.public_id, 'view'), CLIENT_VIEW_STORAGE_VERSION, viewMode);
    writeVersionedStorage('session', getStorageKey(project.public_id, 'groupBy'), CLIENT_VIEW_STORAGE_VERSION, groupBy);
    writeVersionedStorage('session', getStorageKey(project.public_id, 'filters'), CLIENT_VIEW_STORAGE_VERSION, filters);
  }, [viewMode, groupBy, filters, project.public_id, isMounted]);

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

  // --- SUB-SEGMENTACIÓN POR NACIONALIDAD ---
  const modelsByGenderAndCountry = useMemo(() => {
    const group = (list: GridModel[]) => {
      const countries: Record<string, GridModel[]> = {};
      list.forEach(m => {
        const c = m.birth_country || 'Sin Nacionalidad';
        if (!countries[c]) countries[c] = [];
        countries[c].push(m);
      });
      // Ordenar países: Guatemala primero, luego el resto alfabético
      return Object.entries(countries).sort(([a], [b]) => {
        if (a === 'Guatemala') return -1;
        if (b === 'Guatemala') return 1;
        return a.localeCompare(b);
      });
    };

    return {
      men: group(menModels),
      women: group(womenModels),
      other: group(otherModels)
    };
  }, [menModels, womenModels, otherModels]);

  // --- AGRUPACIÓN POR FECHAS / DISPONIBILIDAD ---
  const modelsByDate = useMemo(() => {
    if (!project.schedule || project.schedule.length === 0) return [];

    const sortedSched = [...project.schedule].sort((a, b) => {
      const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (cmp !== 0) return cmp;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    return sortedSched.map((sched) => {
      const availableModels = filteredModels.filter((m) => {
        if (m.model_available_schedules && m.model_available_schedules.length > 0) {
          return m.model_available_schedules.includes(sched.id!);
        }
        if (m.assignments && m.assignments.length > 0) {
          return m.assignments.some((a) => a.schedule_id === sched.id);
        }
        return true;
      });

      return {
        schedule: sched,
        models: availableModels,
      };
    });
  }, [project.schedule, filteredModels]);

  // Subtítulo de disponibilidad para tarjetas/filas
  const getModelAvailableDatesLabel = useMemo(() => {
    return (model: GridModel) => {
      if (!project.schedule || project.schedule.length <= 1) return null;

      const availableScheds = project.schedule.filter((s) => {
        if (model.model_available_schedules && model.model_available_schedules.length > 0) {
          return model.model_available_schedules.includes(s.id!);
        }
        if (model.assignments && model.assignments.length > 0) {
          return model.assignments.some((a) => a.schedule_id === s.id);
        }
        return true;
      });

      if (availableScheds.length === 0) return 'Sin fecha confirmada';
      if (availableScheds.length === project.schedule.length) return 'Disponible todas las fechas';

      const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const shortDates = availableScheds.map((s) => {
        try {
          const d = new Date(`${s.date}T00:00:00`);
          return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        } catch {
          return s.date;
        }
      });

      return `Disponible: ${shortDates.join(', ')}`;
    };
  }, [project.schedule]);

  // --- HANDLERS ---
  const handleFilterChange = (newFilter: { key: string; value: string | null }) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (newFilter.key === 'query') updated.query = newFilter.value || '';
      return updated;
    });
  };

  const handleViewChange = (view: 'list' | 'grid' | 'single') => {
    setViewMode(view);
  };

  const handleGroupByChange = (mode: 'gender' | 'date') => {
    setGroupBy(mode);
  };

  // Sync initialModels logic
  useEffect(() => {
    if (models.length === 0 && initialModels.length > 0) {
      const baseModels = initialModels.map(m => ({
        ...m,
        selection: (m.client_selection as GridModel['selection']) ?? 'pending'
      }));
      
      const storageKey = getStorageKey(project.public_id, 'selections');
      const cachedSelections = readVersionedStorage<Record<string, GridModel['selection']>>(
        'session',
        storageKey,
        CLIENT_VIEW_STORAGE_VERSION
      );
      
      if (cachedSelections) {
        setModels(
          baseModels.map(m => {
            if (cachedSelections[m.id] !== undefined) {
              return { ...m, selection: cachedSelections[m.id] };
            }
            return m;
          })
        );
      } else {
        setModels(baseModels);
      }
    }
  }, [initialModels, models.length, project.public_id]);

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
    setModels(prev => {
      const updated = prev.map(m =>
        m.id === modelId ? { ...m, selection } : m
      );
      
      // Persistir las selecciones actualizadas en sessionStorage
      const selectionsMap: Record<string, GridModel['selection']> = {};
      updated.forEach(m => {
        selectionsMap[m.id] = m.selection || 'pending';
      });
      writeVersionedStorage(
        'session',
        getStorageKey(project.public_id, 'selections'),
        CLIENT_VIEW_STORAGE_VERSION,
        selectionsMap
      );
      
      return updated;
    });
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
          <div ref={progressRef} className="client-wow-progress dark-solid rounded-2xl! bg-white p-5">
            <div className="relative z-10 flex flex-col gap-4">
              {/* Título */}
              <p className="text-title font-semibold text-foreground capitalize">
                Selección De Talento
              </p>

              {/* Badges de aprobados/rechazados */}
              <div className="flex items-center justify-between gap-3">
                <Badge variant="success" size="medium" className="gap-2 rounded-lg px-3">
                  <CheckCircle2 className="size-4" />
                  <span className="sr-only">Aprobados:</span>
                  {progressStats.approved}
                </Badge>
                <Badge variant="danger" size="medium" className="gap-2 rounded-lg px-3">
                  <XCircle className="size-4" />
                  <span className="sr-only">Rechazados:</span>
                  {progressStats.rejected}
                </Badge>
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-3">
                <Progress value={progressStats.percentage} className="h-2 flex-1" />
                <span className="text-label text-muted-foreground tabular-nums">
                  {Math.round(progressStats.percentage)}%
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="w-full flex-1 space-y-8">
          <ClientToolbar
            onFilterChange={handleFilterChange}
            onViewChange={handleViewChange}
            onGroupByChange={handleGroupByChange}
            hasSchedule={Boolean(project.schedule && project.schedule.length > 0)}
            currentFilters={{
              ...filters,
              view: viewMode,
              groupBy
            }}
          />

          {/* CONTENIDO (SECCIONES DIVIDIDAS) */}
          <div className="min-h-100 space-y-16">

            {/* MODO 1: AGRUPACIÓN POR FECHAS / DISPONIBILIDAD */}
            {groupBy === 'date' && modelsByDate.length > 0 && (
              <div className="space-y-16">
                {modelsByDate.map(({ schedule, models: dateModels }) => {
                  const fullDateTitle = (() => {
                    const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    try {
                      const d = new Date(`${schedule.date}T00:00:00`);
                      const dayOfWeek = WEEKDAYS[d.getDay()];
                      const dayNumber = d.getDate();
                      const month = MONTHS[d.getMonth()];
                      return `${dayOfWeek}, ${dayNumber} de ${month}`;
                    } catch {
                      return schedule.date;
                    }
                  })();

                  const timeInfo = !project.hide_schedule && schedule.startTime && schedule.endTime ? `${schedule.startTime} - ${schedule.endTime}` : null;
                  const genderTargetInfo = schedule.gender_target && schedule.gender_target !== 'Todos' ? `Solo ${schedule.gender_target.toLowerCase()}` : null;

                  return (
                    <section key={schedule.id || schedule.date} className="space-y-6">
                      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <div>
                          <h2 className="text-display tracking-tight capitalize">{fullDateTitle}</h2>
                          <div className="flex items-center gap-3 text-label text-muted-foreground mt-1">
                            {timeInfo && <span>{timeInfo}</span>}
                            {genderTargetInfo && (
                              <span className="font-semibold text-primary">({genderTargetInfo})</span>
                            )}
                          </div>
                        </div>
                        <span className="text-label text-muted-foreground font-medium shrink-0">
                          {dateModels.length} {dateModels.length === 1 ? 'talento disponible' : 'talentos disponibles'}
                        </span>
                      </div>

                      {dateModels.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                          <p className="text-body text-muted-foreground">No hay talentos disponibles registrados para esta fecha.</p>
                        </div>
                      ) : viewMode === 'list' ? (
                        <ClientListView
                          models={dateModels}
                          projectId={project.public_id}
                          realProjectId={project.id}
                          onSelectionChange={handleSelectionChange}
                          getModelSubtitle={getModelAvailableDatesLabel}
                        />
                      ) : (
                        <ClientGrid
                          models={dateModels}
                          projectId={project.public_id}
                          realProjectId={project.id}
                          onSelectionChange={handleSelectionChange}
                          viewMode={viewMode === 'single' ? 'single' : 'grid'}
                          getModelSubtitle={getModelAvailableDatesLabel}
                        />
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {/* MODO 2: AGRUPACIÓN POR GÉNERO Y PAÍS */}
            {groupBy === 'gender' && (
              <>
                {/* SECCIÓN HOMBRES */}
                {menModels.length > 0 && (
                  <section className="space-y-12">
                    <h2 className="text-display border-b pb-4 uppercase tracking-tighter">Hombres</h2>
                    {modelsByGenderAndCountry.men.map(([country, countryModels]) => (
                      <div key={country} className="space-y-6">
                        <h3 className="text-title flex items-center gap-3 text-muted-foreground/80 font-medium">
                          <span className="h-px flex-1 bg-border/60"></span>
                          <span className="uppercase tracking-widest text-label">{country}</span>
                          <span className="h-px flex-1 bg-border/60"></span>
                        </h3>
                        {viewMode === 'list' ? (
                          <ClientListView
                            models={countryModels}
                            projectId={project.public_id}
                            realProjectId={project.id}
                            onSelectionChange={handleSelectionChange}
                            getModelSubtitle={getModelAvailableDatesLabel}
                          />
                        ) : (
                          <ClientGrid
                            models={countryModels}
                            projectId={project.public_id}
                            realProjectId={project.id}
                            onSelectionChange={handleSelectionChange}
                            viewMode={viewMode === 'single' ? 'single' : 'grid'}
                            getModelSubtitle={getModelAvailableDatesLabel}
                          />
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {/* SECCIÓN MUJERES */}
                {womenModels.length > 0 && (
                  <section className="space-y-12">
                    <h2 className="text-display border-b pb-4 uppercase tracking-tighter">Mujeres</h2>
                    {modelsByGenderAndCountry.women.map(([country, countryModels]) => (
                      <div key={country} className="space-y-6">
                        <h3 className="text-title flex items-center gap-3 text-muted-foreground/80 font-medium">
                          <span className="h-px flex-1 bg-border/60"></span>
                          <span className="uppercase tracking-widest text-label">{country}</span>
                          <span className="h-px flex-1 bg-border/60"></span>
                        </h3>
                        {viewMode === 'list' ? (
                          <ClientListView
                            models={countryModels}
                            projectId={project.public_id}
                            realProjectId={project.id}
                            onSelectionChange={handleSelectionChange}
                            getModelSubtitle={getModelAvailableDatesLabel}
                          />
                        ) : (
                          <ClientGrid
                            models={countryModels}
                            projectId={project.public_id}
                            realProjectId={project.id}
                            onSelectionChange={handleSelectionChange}
                            viewMode={viewMode === 'single' ? 'single' : 'grid'}
                            getModelSubtitle={getModelAvailableDatesLabel}
                          />
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {/* SECCIÓN OTROS */}
                {otherModels.length > 0 && (
                  <section className="space-y-12">
                    <h2 className="text-display border-b pb-4 uppercase tracking-tighter">Otros</h2>
                    {modelsByGenderAndCountry.other.map(([country, countryModels]) => (
                      <div key={country} className="space-y-6">
                        <h3 className="text-title flex items-center gap-3 text-muted-foreground/80 font-medium">
                          <span className="h-px flex-1 bg-border/60"></span>
                          <span className="uppercase tracking-widest text-label">{country}</span>
                          <span className="h-px flex-1 bg-border/60"></span>
                        </h3>
                        {viewMode === 'list' ? (
                          <ClientListView
                            models={countryModels}
                            projectId={project.public_id}
                            realProjectId={project.id}
                            onSelectionChange={handleSelectionChange}
                            getModelSubtitle={getModelAvailableDatesLabel}
                          />
                        ) : (
                          <ClientGrid
                            models={countryModels}
                            projectId={project.public_id}
                            realProjectId={project.id}
                            onSelectionChange={handleSelectionChange}
                            viewMode={viewMode === 'single' ? 'single' : 'grid'}
                            getModelSubtitle={getModelAvailableDatesLabel}
                          />
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </>
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

