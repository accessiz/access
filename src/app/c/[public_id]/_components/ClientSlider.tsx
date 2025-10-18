'use client'

import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { Project, Model } from '@/lib/types';
import { toast } from 'sonner';
import { updateModelSelection } from '@/lib/actions/projects_models';
import { updateProjectStatus } from '@/lib/actions/projects';
import { gsap } from 'gsap';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X, Check, Send } from 'lucide-react';

type SliderModel = Model & { selection: 'pending' | 'approved' | 'rejected' };

interface ClientSliderProps {
  project: Project;
  initialModels: Model[];
}

export default function ClientSlider({ project, initialModels }: ClientSliderProps) {
    const [models, setModels] = useState<SliderModel[]>(
        initialModels.map(m => ({ ...m, selection: m.client_selection || 'pending' }))
    );
    const [isAnimating, setIsAnimating] = useState(false);
    
    const mainRef = useRef<HTMLDivElement>(null);
    const galeriaRef = useRef<HTMLDivElement>(null);
    const cuadrosRef = useRef<(HTMLDivElement | null)[]>([]);
    const centerIndexRef = useRef(0);

    const animConfig = { duration: 0.7, ease: 'power3.inOut' };
    const sizing = useRef({ largeHeight: 0, largeWidth: 0, smallHeight: 0, smallWidth: 0 });

    const allModelsReviewed = models.every(m => m.selection !== 'pending');

    const updateSizing = () => {
        const aspectRatio = 3 / 4;
        sizing.current.largeHeight = window.innerHeight * 0.8; 
        sizing.current.largeWidth = sizing.current.largeHeight * aspectRatio;
        sizing.current.smallHeight = 120; 
        sizing.current.smallWidth = sizing.current.smallHeight * aspectRatio;
    };

    const applyState = useCallback((targetIndex: number, duration = 0) => {
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
            if (!cuadro) return;
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
    }, [animConfig.ease]);

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
        const currentSelection = models[modelIndex].selection;

        if (currentSelection === selection) return;

        setIsAnimating(true);
        setModels(prev => prev.map((m, i) => i === modelIndex ? { ...m, selection } : m));

        const targetCuadro = cuadrosRef.current[modelIndex];
        if (!targetCuadro) return;

        const feedbackOverlay = targetCuadro.querySelector('.feedback-overlay') as HTMLDivElement;
        const feedbackText = targetCuadro.querySelector('.feedback-text') as HTMLDivElement;
        
        feedbackOverlay.className = `feedback-overlay ${selection}`;
        feedbackText.textContent = selection === 'approved' ? 'APROBADO' : 'RECHAZADO';
        
        gsap.timeline()
            .to([feedbackOverlay, feedbackText], { opacity: 1, duration: 0.2 })
            .add(() => {
                updateModelSelection(project.id, modelId, selection).then(result => {
                    if (!result.success) {
                        toast.error("No se pudo guardar la selección.");
                        setModels(prev => prev.map((m, i) => i === modelIndex ? { ...m, selection: currentSelection } : m));
                    }
                });
            })
            .to([feedbackOverlay, feedbackText], { opacity: 0, duration: 0.3, delay: 0.5, onComplete: () => {
                 if (currentSelection === 'pending') {
                    moveTo(modelIndex + 1);
                 } else {
                    setIsAnimating(false);
                 }
            }});
    };

    const handleFinalize = async () => {
        setIsAnimating(true);
        const promise = updateProjectStatus(project.id, 'completed');
        toast.promise(promise, {
            loading: 'Finalizando y enviando decisiones...',
            success: '¡Calificación finalizada y enviada con éxito!',
            error: 'No se pudo finalizar el proceso.'
        });
        await promise;
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
    }, [applyState]);

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
                            ref={el => { if (el) cuadrosRef.current[index] = el; }}
                            className="cuadro-foto"
                            style={{ backgroundImage: model.coverUrl ? `url(${model.coverUrl})` : 'none' }}
                            onClick={() => index !== centerIndexRef.current && moveTo(index)}
                        >
                            <div className="feedback-overlay"></div>
                            <div className="feedback-text"></div>
                            <div className="overlay-content">
                                <Button variant="ghost" size="icon" className={`icon-button ${model.selection === 'rejected' ? 'active-reject' : ''} ${model.selection === 'approved' ? 'inactive' : ''}`} onClick={(e) => { e.stopPropagation(); handleSelection('rejected'); }}><X /></Button>
                                <Link href={`/c/${project.id}/${model.id}`} className="portfolio-link-overlay" onClick={e => e.stopPropagation()}>
                                    Ver Portafolio
                                </Link>
                                <Button variant="ghost" size="icon" className={`icon-button ${model.selection === 'approved' ? 'active-accept' : ''} ${model.selection === 'rejected' ? 'inactive' : ''}`} onClick={(e) => { e.stopPropagation(); handleSelection('approved'); }}><Check /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bottom-controls">
                <div className="nav-arrows">
                    <Button variant="outline" size="icon" className="arrow" onClick={() => moveTo(centerIndexRef.current - 1)} disabled={isAnimating || centerIndexRef.current === 0}><ArrowLeft /></Button>
                    <Button variant="outline" size="icon" className="arrow" onClick={() => moveTo(centerIndexRef.current + 1)} disabled={isAnimating || centerIndexRef.current === models.length - 1}><ArrowRight /></Button>
                </div>
                
                {allModelsReviewed && project.status !== 'completed' && (
                    <Button size="lg" className="finalize-button" onClick={handleFinalize} disabled={isAnimating}>
                        <Send className="mr-2"/>
                        Finalizar Calificación
                    </Button>
                )}
            </div>
            
            <style jsx global>{`
                body { overflow: hidden; }
                .client-slider-main { width: 100%; height: 100vh; position: relative; overflow: hidden; background: #fff; font-family: 'Geist', sans-serif; }
                .info-display { position: absolute; font-size: 0.75rem; color: #888; text-transform: uppercase; z-index: 10; font-weight: 500; }
                #modelo-actual { top: 6.4vh; left: 5vw; font-size: 1rem; font-weight: 600; color: #111; }
                #contador-fotos { top: 6.4vh; right: 5vw; }
                .galeria-container { position: relative; height: 100%; display: flex; align-items: center; }
                .galeria-flex { display: flex; gap: 16px; align-items: center; height: 80vh; will-change: transform; }
                .cuadro-foto { aspect-ratio: 3 / 4; background-color: #f3f4f6; position: relative; flex-shrink: 0; background-size: cover; background-position: center; cursor: pointer; overflow: hidden; will-change: height, width, filter; }
                .overlay-content { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, transparent 50%); display: flex; justify-content: space-between; align-items: flex-end; padding: 24px; box-sizing: border-box; color: white; opacity: 0; pointer-events: none; }
                .cuadro-foto:hover .overlay-content { opacity: 1; pointer-events: auto; }
                .overlay-content .icon-button { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; backdrop-filter: blur(4px); color: white; transition: background-color 0.2s, opacity 0.2s; }
                .overlay-content .icon-button:hover { background: rgba(255, 255, 255, 0.2); }
                .portfolio-link-overlay { font-size: 0.625rem; font-weight: 600; text-transform: uppercase; padding-bottom: 16px; color: white; text-decoration: none; }
                .feedback-overlay { position: absolute; inset: 0; opacity: 0; pointer-events: none; z-index: 5; }
                .feedback-overlay.approved { background-color: rgba(34, 197, 94, 0.7); }
                .feedback-overlay.rejected { background-color: rgba(239, 68, 68, 0.7); }
                .feedback-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0; pointer-events: none; z-index: 6; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
                .overlay-content .icon-button.active-accept { background: #22c55e; border-color: #22c55e; }
                .overlay-content .icon-button.active-reject { background: #ef4444; border-color: #ef4444; }
                .overlay-content .icon-button.inactive { opacity: 0.3; }
                .bottom-controls { position: absolute; bottom: 6.4vh; left: 5vw; right: 5vw; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
                .nav-arrows { position: static; }
                .finalize-button { background-color: #111; color: #fff; }
                .finalize-button:hover { background-color: #333; }
                .finalize-button:disabled { background-color: #ccc; cursor: not-allowed; }
                .arrow { background-color: rgba(243, 244, 246, 0.8); backdrop-filter: blur(5px); color: #111; border: 1px solid #d1d5db; width: 44px; height: 44px; border-radius: 999px; }
                .arrow:hover { background-color: #e5e7eb; }
            `}</style>
        </main>
    );
}
