'use client';

// 1. IMPORTACIONES
import { useEffect, useState, useTransition, useCallback } from 'react';
import { Project, Model } from '@/lib/types';
import { updateProjectStatus } from '@/lib/actions/projects';
import { updateModelSelection } from '@/lib/actions/projects_models';
import { toast } from 'sonner';

// 2. COMPONENTES HIJO
import PasswordProtect from './PasswordProtect';
import ClientSlider, { SliderModel } from './ClientSlider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';

interface HandlerProps {
  project: Project;
  initialModels: Model[];
  hasAccessCookie: boolean;
}

// Simple Theme toggle that toggles the 'dark' class on <html> and persists choice
function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      // default to prefers-color-scheme
      const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefers);
      setIsDark(prefers);
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

// 3. COMPONENTE PRINCIPAL (EL MANEJADOR)
export default function ClientViewHandler({ project, initialModels, hasAccessCookie }: HandlerProps) {
  
  // --- A. LÓGICA DE ESTADO (AHORA VIVE AQUÍ) ---
  
  // El índice del modelo que está en el centro
  const [centerIndex, setCenterIndex] = useState(0);
  
  // El array de todos los modelos (con su estado de 'selection')
  const [models, setModels] = useState<SliderModel[]>(
    initialModels.map(m => ({ 
      ...m, 
      selection: (m.client_selection as 'pending' | 'approved' | 'rejected') ?? 'pending' 
    }))
  );

  // Modelo actual (para mostrar el nombre en DIV 1)
  const currentModel = models[centerIndex];
  
  // Estado de carga para las acciones
  const [isSelecting, setIsSelecting] = useState(false);

  // --- B. EFECTO PARA ACTUALIZAR ESTADO DEL PROYECTO ---
  
  // Se ejecuta una vez para cambiar 'sent' a 'in-review'
  useEffect(() => {
    if (project.status === 'sent') {
      updateProjectStatus(project.id, 'in-review');
    }
  }, [project.id, project.status]);

  // --- C. MANEJADORES DE NAVEGACIÓN (AHORA VIVEN AQUÍ) ---

  const handlePrev = () => {
    if (centerIndex > 0) {
      setCenterIndex(centerIndex - 1);
    }
  };

  const handleNext = () => {
    if (centerIndex < models.length - 1) {
      setCenterIndex(centerIndex + 1);
    }
  };

  // --- D. MANEJADOR DE SELECCIÓN (AHORA VIVE AQUÍ) ---

  const handleSelection = useCallback(async (modelId: string, selection: 'approved' | 'rejected') => {
    setIsSelecting(true); // Bloquea la UI
    
    // Captura el estado *antes* de la actualización
    const currentSelectionState = models.find(m => m.id === modelId)?.selection;

    // 1. Llamar a la Server Action
    const result = await updateModelSelection(project.id, modelId, selection);

    if (result.success) {
      toast.success(`Selección guardada: ${selection === 'approved' ? 'Aprobado' : 'Rechazado'}`);
      
      // 2. Actualizar el estado local de 'models'
      setModels(prevModels => 
        prevModels.map(model => 
          model.id === modelId ? { ...model, selection: selection } : model
        )
      );

      // 3. Mover al siguiente (si estaba pendiente O si se cambió de opinión)
      const shouldMove = (currentSelectionState === 'pending' || currentSelectionState !== selection) && centerIndex < models.length - 1;

      // --- CORRECCIÓN DE "GLITCH" ---
      // Esperamos 1250ms (1.25s) para que la animación de feedback del slider (1.2s) termine
      // antes de cambiar el índice y desbloquear los botones.
      setTimeout(() => {
        if (shouldMove) {
          setCenterIndex(centerIndex + 1);
        }
        setIsSelecting(false); // Desbloquea la UI después de la animación
      }, 1250); // 1.25 segundos de espera
      // --- FIN DE CORRECCIÓN ---

    } else {
      toast.error(result.error || 'No se pudo guardar la selección.');
      setIsSelecting(false); // Desbloquea si hay error
    }
  }, [project.id, models, centerIndex]); // Dependencias actualizadas

  // Sincroniza 'isSelecting' con la animación interna del slider
  // --- E. RENDERIZADO ---

  // 1. Renderizar pantalla de contraseña si es necesario
  if (project.password && !hasAccessCookie) {
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }

  // 2. Renderizar la maquetación principal de 3 divs
  return (
    // Contenedor principal (fondo blanco, texto negro, padding)
    <div className="flex flex-col h-screen w-full p-8 md:p-12 bg-white text-black dark:bg-black dark:text-white">
      
      {/* --- DIV 1: Encabezado (Nombre del modelo) --- */}
      <header className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold uppercase tracking-wider">
            {currentModel?.alias || 'Cargando...'}
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{project.project_name}</p>
      </header>

      {/* --- DIV 2: Slider (Contenido principal) --- */}
      <main className="flex-1 w-full my-4 overflow-hidden">
        <ClientSlider
          project={project}
          models={models} // Pasa los modelos con estado
          centerIndex={centerIndex}
          currentModel={currentModel} // Pasa el modelo central
          onMoveTo={setCenterIndex}
          onSelection={handleSelection} // Pasa el manejador de selección
          isSelecting={isSelecting} // Pasa el estado de bloqueo
        />
      </main>

      {/* --- DIV 3: Pie de página (Paginación y Flechas) --- */}
      <footer className="flex-shrink-0 flex justify-between items-center w-full">
        {/* Paginación */}
        <div className="font-mono text-sm">
          <span>{String(centerIndex + 1).padStart(2, '0')}</span>
          <span className="text-gray-400"> / {String(models.length).padStart(2, '0')}</span>
        </div>

        {/* Flechas de Navegación */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={handlePrev}
            disabled={centerIndex === 0 || isSelecting}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={handleNext}
            disabled={centerIndex === models.length - 1 || isSelecting}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

