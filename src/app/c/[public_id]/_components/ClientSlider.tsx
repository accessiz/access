'use client'

import { useState, useEffect, useRef } from 'react';
import { Project, Model } from '@/lib/types';
import { toast } from 'sonner';
import { updateModelSelection } from '@/lib/actions/projects_models';
import { gsap } from 'gsap';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';

// Tipos locales
type SliderModel = Model & { selection: 'pending' | 'approved' | 'rejected' };

interface ClientSliderProps {
  project: Project;
  initialModels: Model[];
}

// ✅ Componente PhotoCard CORREGIDO
const PhotoCard = ({ model, isActive, onSelect }: { 
    model: SliderModel, 
    isActive: boolean,
    onSelect: (selection: 'approved' | 'rejected') => void 
}) => (
    <div 
      className="cuadro-foto group" 
      style={{ backgroundImage: model.coverUrl ? `url(${model.coverUrl})` : 'none' }}
    >
      <div className="info-container">
        <span className="info-modelo">{model.alias}</span>
      </div>
      <div className={`feedback-overlay ${model.selection}`}></div>
      {isActive && (
        <div className="overlay-content">
          <button className="icon-button reject" onClick={() => onSelect('rejected')}>
            <X size={28} />
          </button>
          <span className="portfolio-link-overlay">Ver Portafolio (Próximamente)</span>
          <button className="icon-button accept" onClick={() => onSelect('approved')}>
            <Check size={28} />
          </button>
        </div>
      )}
    </div>
);

// --- Componente Principal ---
export default function ClientSlider({ project, initialModels }: ClientSliderProps) {
  const [models, setModels] = useState<SliderModel[]>(
    initialModels.map(m => ({ ...m, selection: m.client_selection || 'pending' }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const galeriaRef = useRef<HTMLDivElement>(null);
  
  const handleSelection = (modelId: string, selection: 'approved' | 'rejected') => {
    if (isAnimating) return;
  
    // Prevenimos que se pueda calificar dos veces el mismo modelo
    const currentModel = models.find(m => m.id === modelId);
    if (currentModel?.selection !== 'pending') {
        moveTo(currentIndex + 1);
        return;
    }

    setIsAnimating(true);
    setModels(prev => prev.map(m => m.id === modelId ? { ...m, selection } : m));
    
    gsap.to(`.photo-wrapper[data-id="${modelId}"] .feedback-overlay`, { 
      opacity: 1, 
      duration: 0.2, 
      onComplete: () => {
        updateModelSelection(project.id, modelId, selection).then(result => {
          if (!result.success) {
            toast.error("No se pudo guardar la selección. Intenta de nuevo.");
            setModels(prev => prev.map(m => m.id === modelId ? { ...m, selection: 'pending' } : m));
          }
        });
        moveTo(currentIndex + 1);
      }
    });
  };

  const moveTo = (index: number) => {
    if (!galeriaRef.current) return;

    const newIndex = index >= models.length ? 0 : (index < 0 ? models.length - 1 : index);
    
    gsap.to(galeriaRef.current, {
        x: `-${newIndex * 100}%`,
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
            setCurrentIndex(newIndex);
            setIsAnimating(false);
        }
    });
  };

  if (models.length === 0) {
    return <div className="h-screen w-full flex items-center justify-center">No hay talentos asignados a este proyecto.</div>;
  }

  const currentModel = models[currentIndex];
  
  return (
    <main className="client-slider-main">
        <div className="info-display" id="modelo-actual">{currentModel?.alias}</div>
        <div className="info-display" id="contador-fotos">{currentIndex + 1} / {models.length}</div>

        <div className="galeria-container">
            <div className="galeria-flex" ref={galeriaRef} style={{ width: `${models.length * 100}%` }}>
                {models.map((model, index) => (
                    <div key={model.id} className="photo-wrapper" data-id={model.id}>
                        <PhotoCard 
                            model={model} 
                            isActive={index === currentIndex} 
                            onSelect={(selection) => handleSelection(model.id, selection)}
                        />
                    </div>
                ))}
            </div>
        </div>

         <div className="nav-arrows">
            <Button variant="outline" size="icon" id="prev" onClick={() => moveTo(currentIndex - 1)} disabled={isAnimating}>
                <ArrowLeft />
            </Button>
            <Button variant="outline" size="icon" id="next" onClick={() => moveTo(currentIndex + 1)} disabled={isAnimating}>
                <ArrowRight />
            </Button>
        </div>
        
        <style jsx global>{`
            .client-slider-main { width: 100%; height: 100vh; position: relative; overflow: hidden; background: #fff; font-family: 'Geist', sans-serif; }
            .info-display { position: absolute; font-size: 0.875rem; color: #888; text-transform: uppercase; z-index: 10; }
            #modelo-actual { top: 5vh; left: 5vw; font-size: 1.25rem; font-weight: 600; color: #111; }
            #contador-fotos { top: 5vh; right: 5vw; }
            .galeria-container { overflow: hidden; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 30vw; height: 80vh; max-width: 400px; min-width: 300px; }
            .galeria-flex { display: flex; height: 100%; position: relative; }
            .photo-wrapper { width: 100%; height: 100%; flex-shrink: 0; padding: 0 10px; box-sizing: border-box; }
            .cuadro-foto {
                width: 100%; height: 100%; background-size: cover;
                background-position: center; border-radius: 12px;
                position: relative; overflow: hidden;
                background-color: #f3f4f6; /* ✅ FONDO GRIS CLARO DE FALLBACK */
            }
            .overlay-content { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%); display: flex; justify-content: space-between; align-items: flex-end; padding: 24px; color: white; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
            .cuadro-foto.group:hover .overlay-content { opacity: 1; pointer-events: auto; }
            .icon-button { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; width: 56px; height: 56px; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(4px); transition: background-color 0.2s; }
            .icon-button:hover { background: rgba(255, 255, 255, 0.2); }
            .portfolio-link-overlay { font-size: 0.75rem; text-transform: uppercase; align-self: center; padding-bottom: 12px; }
            .feedback-overlay { position: absolute; inset: 0; opacity: 0; pointer-events: none; border-radius: 12px; }
            .feedback-overlay.approved { background-color: rgba(34, 197, 94, 0.7); }
            .feedback-overlay.rejected { background-color: rgba(239, 68, 68, 0.7); }
            .nav-arrows { position: absolute; right: 5vw; bottom: 5vh; display: flex; gap: 12px; z-index: 10; }
        `}</style>
    </main>
  );
}