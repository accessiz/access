'use client'

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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

// --- Componente Principal ---
export default function ClientSlider({ project, initialModels }: ClientSliderProps) {
    const [models, setModels] = useState<SliderModel[]>(
        initialModels.map(m => ({ ...m, selection: m.client_selection || 'pending' }))
    );
    const [isAnimating, setIsAnimating] = useState(false);

    const mainRef = useRef<HTMLDivElement>(null);
    const galeriaRef = useRef<HTMLDivElement>(null);
    const cuadrosRef = useRef<HTMLDivElement[]>([]);
    
    const centerIndexRef = useRef(0);

    const animConfig = { duration: 0.7, ease: 'power3.inOut' };
    const sizing = useRef({ largeHeight: 0, largeWidth: 0, smallHeight: 0, smallWidth: 0 });

    const updateSizing = () => {
        const aspectRatio = 3 / 4;
        sizing.current.largeHeight = window.innerHeight * 0.8; 
        sizing.current.largeWidth = sizing.current.largeHeight * aspectRatio;
        sizing.current.smallHeight = 120; 
        sizing.current.smallWidth = sizing.current.smallHeight * aspectRatio;
    };

    const applyState = (targetIndex: number, duration = 0) => {
        if (!galeriaRef.current) return;
        
        const { largeHeight, largeWidth, smallHeight, smallWidth } = sizing.current;
        const gap = 16;
        
        const centerOffset = (window.innerWidth / 2) - (largeWidth / 2);
        let totalWidthBefore = 0;
        for (let i = 0; i < targetIndex; i++) {
            totalWidthBefore += smallWidth + gap;
        }
        const targetX = centerOffset - totalWidthBefore;

        gsap.to(galeriaRef.current, { x: targetX, duration, ease: animConfig.ease });
        
        cuadrosRef.current.forEach((cuadro, index) => {
            const isCenter = index === targetIndex;
            gsap.to(cuadro, {
                height: isCenter ? largeHeight : smallHeight,
                width: isCenter ? largeWidth : smallWidth,
                filter: isCenter ? 'grayscale(0)' : 'grayscale(1)',
                duration,
                ease: animConfig.ease
            });
            gsap.to(cuadro.querySelector('.overlay-content'), {
                opacity: isCenter ? 1 : 0,
                pointerEvents: isCenter ? 'auto' : 'none',
                duration: duration / 2,
                delay: isCenter ? duration / 2 : 0
            });
        });
    };

    const moveTo = (newIndex: number) => {
        if (isAnimating || newIndex < 0 || newIndex >= models.length) return;
        
        setIsAnimating(true);
        centerIndexRef.current = newIndex;
        applyState(newIndex, animConfig.duration);
        
        setTimeout(() => setIsAnimating(false), animConfig.duration * 1000);
    };

    const handleSelection = async (selection: 'approved' | 'rejected') => {
        if (isAnimating) return;
        
        const modelIndex = centerIndexRef.current;
        const modelId = models[modelIndex].id;

        if (models[modelIndex].selection !== 'pending') {
            moveTo(modelIndex + 1);
            return;
        }

        setIsAnimating(true);
        setModels(prev => prev.map((m, i) => i === modelIndex ? { ...m, selection } : m));

        const targetCuadro = cuadrosRef.current[modelIndex];
        const feedbackOverlay = targetCuadro.querySelector('.feedback-overlay') as HTMLDivElement;
        feedbackOverlay.className = `feedback-overlay ${selection}`;
        
        gsap.to(feedbackOverlay, {
            opacity: 1,
            duration: 0.2,
            onComplete: () => {
                updateModelSelection(project.id, modelId, selection).then(result => {
                    if (!result.success) {
                        toast.error("No se pudo guardar la selección.");
                        setModels(prev => prev.map((m, i) => i === modelIndex ? { ...m, selection: 'pending' } : m));
                    }
                });
                
                gsap.to(feedbackOverlay, {
                    opacity: 0,
                    duration: 0.3,
                    delay: 0.1,
                    onComplete: () => moveTo(modelIndex + 1)
                });
            }
        });
    };

    useLayoutEffect(() => {
        updateSizing();
        applyState(0);
        
        const handleResize = () => {
            updateSizing();
            applyState(centerIndexRef.current);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (models.length === 0) {
        return <div className="h-screen w-full flex items-center justify-center">No hay talentos asignados a este proyecto.</div>;
    }

    const currentModel = models[centerIndexRef.current];

    return (
        <main ref={mainRef} className="client-slider-main">
            <div className="info-display" id="modelo-actual">{currentModel?.alias}</div>
            <div className="info-display" id="contador-fotos">{centerIndexRef.current + 1} / {models.length}</div>
            
            <div className="galeria-container">
                <div className="galeria-flex" ref={galeriaRef}>
                    {models.map((model, index) => (
                        <div 
                            key={model.id}
                            // ✅ INICIO DE LA CORRECCIÓN
                            ref={el => { if (el) cuadrosRef.current[index] = el; }}
                            // ✅ FIN DE LA CORRECCIÓN
                            className="cuadro-foto"
                            style={{ backgroundImage: model.coverUrl ? `url(${model.coverUrl})` : 'none' }}
                            onClick={() => index !== centerIndexRef.current && moveTo(index)}
                        >
                            <div className="feedback-overlay"></div>
                            <div className="overlay-content">
                                <Button variant="ghost" size="icon" className="icon-button" onClick={(e) => { e.stopPropagation(); handleSelection('rejected'); }}><X /></Button>
                                <span className="portfolio-link-overlay">Ver Portafolio (Próximamente)</span>
                                <Button variant="ghost" size="icon" className="icon-button" onClick={(e) => { e.stopPropagation(); handleSelection('approved'); }}><Check /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="nav-arrows">
                <Button variant="outline" size="icon" className="arrow" onClick={() => moveTo(centerIndexRef.current - 1)} disabled={isAnimating || centerIndexRef.current === 0}>
                    <ArrowLeft />
                </Button>
                <Button variant="outline" size="icon" className="arrow" onClick={() => moveTo(centerIndexRef.current + 1)} disabled={isAnimating || centerIndexRef.current === models.length - 1}>
                    <ArrowRight />
                </Button>
            </div>
            
            <style jsx global>{`
                /* ... (el CSS no cambia) ... */
            `}</style>
        </main>
    );
}