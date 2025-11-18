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
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type GridModel = Model & {
    selection?: 'pending' | 'approved' | 'rejected' | null
};

interface HandlerProps {
  project: Project;
  initialModels: Model[];
  hasAccessCookie: boolean;
}

// Claves para sessionStorage
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
  // Inicializamos leyendo de sessionStorage si existe, o usamos valores por defecto
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    query: '',
    country: null as string | null,
    gender: null as string | null, // Inicializado correctamente para evitar error TS
    minHeight: null as number | null,
    maxHeight: null as number | null,
  });

  // 3. OTROS ESTADOS
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [isUpdatingStatus, startStatusUpdateTransition] = useTransition();
  const { user, loading: authLoading } = useAuth(); 
  const [isMounted, setIsMounted] = useState(false);

  // --- EFECTO DE MONTAJE: RECUPERAR ESTADO ---
  useEffect(() => {
    setIsMounted(true);
    // Recuperar filtros y vista guardados
    const savedView = sessionStorage.getItem(getStorageKey(project.public_id, 'view'));
    if (savedView === 'list' || savedView === 'grid') setViewMode(savedView);

    const savedFilters = sessionStorage.getItem(getStorageKey(project.public_id, 'filters'));
    if (savedFilters) {
        try {
            setFilters(JSON.parse(savedFilters));
        } catch (e) { console.error("Error parsing filters", e); }
    }

    // Restaurar Scroll (Lógica existente)
    const scrollKey = `client_scroll_${project.public_id}`;
    const savedScrollY = sessionStorage.getItem(scrollKey);
    if (savedScrollY) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollY, 10));
        sessionStorage.removeItem(scrollKey); 
      }, 100); // Un pequeño delay extra para asegurar que el grid filtrado se renderice
    }
  }, [project.public_id]);

  // --- EFECTO: PERSISTENCIA DE ESTADO ---
  // Guardamos en sessionStorage cada vez que cambian los filtros o la vista
  useEffect(() => {
    if (!isMounted) return;
    sessionStorage.setItem(getStorageKey(project.public_id, 'view'), viewMode);
    sessionStorage.setItem(getStorageKey(project.public_id, 'filters'), JSON.stringify(filters));
  }, [viewMode, filters, project.public_id, isMounted]);


  // --- LÓGICA DE FILTRADO (useMemo) ---
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      // 1. Filtro de Texto (Nombre/Alias)
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
      // 3. Filtro de Género
      if (filters.gender && model.gender !== filters.gender) {
        return false;
      }
      // 4. Filtro de Estatura
      if (model.height_cm) {
          if (filters.minHeight && model.height_cm < filters.minHeight) return false;
          if (filters.maxHeight && model.height_cm > filters.maxHeight) return false;
      } else {
          // Si no tiene estatura y hay filtro de estatura activo, ¿lo mostramos?
          // Por lo general, si se filtra por un rango, se excluyen los nulos.
          if (filters.minHeight || filters.maxHeight) return false;
      }
      
      return true;
    });
  }, [models, filters]);

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
        else if (newFilter.key === 'gender') updated.gender = newFilter.value;
        else if (newFilter.key === 'minHeight') updated.minHeight = newFilter.value ? Number(newFilter.value) : null;
        else if (newFilter.key === 'maxHeight') updated.maxHeight = newFilter.value ? Number(newFilter.value) : null;
        return updated;
    });
  };

  const handleViewChange = (view: 'list' | 'grid') => {
    setViewMode(view);
  };

  // Auto-update status logic
  useEffect(() => {
    if (authLoading) return; 
    if (user === null && project.status === 'sent' && !isUpdatingStatus) {
      startStatusUpdateTransition(async () => {
        const result = await updateProjectStatus(project.id, 'in-review'); 
        if (!result.success) console.error("Error auto-updating status:", result.error);
      });
    }
  }, [project.id, project.status, isUpdatingStatus, user, authLoading]);

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

  if (project.password && !hasAccessCookie) {
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0">
        <ClientNavbar clientName={project.client_name} />

        <div className="py-24 sm:py-56">
          <ClientHeader projectName={project.project_name} />
        </div>

        <main className="w-full flex-1 space-y-8">
          
          {/* 1. HEADER Y BOTÓN SUPERIOR */}
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
                  className="w-full md:w-auto text-white" // <-- AÑADIDO: text-white
                >
                  {isFinalizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                  {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
                </Button>
             </div>
          </div>

          {/* 2. TOOLBAR DE FILTROS */}
          <ClientToolbar 
             countries={availableCountries}
             onFilterChange={handleFilterChange}
             onViewChange={handleViewChange}
             currentFilters={{
                 ...filters,
                 view: viewMode
             }}
          />

          {/* 3. CONTENIDO (GRID O LISTA) */}
          <div className="min-h-[400px]">
             {viewMode === 'grid' ? (
                 <ClientGrid models={filteredModels} projectId={project.public_id} />
             ) : (
                 <ClientListView models={filteredModels} projectId={project.public_id} />
             )}
          </div>

          {/* 4. BOTÓN INFERIOR */}
          <div className="flex justify-end pt-4 pb-16 md:pb-24">
            <Button 
              size="lg" 
              onClick={handleFinalize} 
              disabled={isFinalizing}
              className="text-white" // <-- AÑADIDO: text-white
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