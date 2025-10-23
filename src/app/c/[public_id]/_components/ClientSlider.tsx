'use client'

import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { Model, Project } from '@/lib/types';
import { gsap } from 'gsap';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';

// Tipo local para el modelo dentro del slider
export type SliderModel = Model & { selection: 'pending' | 'approved' | 'rejected' };

interface ClientSliderProps {
    project: Project;
    initialModels: SliderModel[];
    onSelection?: (modelId: string, selection: 'approved' | 'rejected') => Promise<unknown>;
    onMoveTo?: (index: number) => void;
    centerIndex?: number;
}
// Anim configuration constants (stable across renders)
const ANIM_DURATION = 0.7 as const;
const ANIM_EASE = 'power3.inOut' as const;

export default function ClientSlider({
    project,
    initialModels,
    onSelection = async () => undefined,
    onMoveTo = () => {},
    centerIndex = 0
}: ClientSliderProps) {
    const projectPublicId = project.public_id;
    const models = initialModels as SliderModel[];
    
    // Estado local solo para la animación
    const [isAnimating, setIsAnimating] = useState(false);
    // Estado que indica si una selección (aprobar/rechazar) está en curso
    const [isSelecting, setIsSelecting] = useState(false);
    
    // Referencias de DOM
    const galeriaRef = useRef<HTMLDivElement>(null);
    const cuadrosRef = useRef<(HTMLDivElement | null)[]>([]);
    
    // Referencia para los tamaños
    const sizing = useRef({ largeHeight: 0, largeWidth: 0, smallHeight: 0, smallWidth: 0 });

    // removed duplicate animConfig

    // Función para calcular tamaños
    const updateSizing = () => {
        const viewportHeight = window.innerHeight;
        // Altura del slider será el 70% del alto de la ventana, o 500px como mínimo
        const sliderContainerHeight = Math.max(viewportHeight * 0.7, 500); 
        const aspectRatio = 3 / 4;

        sizing.current.largeHeight = sliderContainerHeight;
        sizing.current.largeWidth = sizing.current.largeHeight * aspectRatio;
        
        // Las tarjetas pequeñas son 20% del alto de la grande
        sizing.current.smallHeight = sizing.current.largeHeight * 0.2; 
        sizing.current.smallWidth = sizing.current.smallHeight * aspectRatio;
    };

    // Función de GSAP para aplicar el estado del slider
    const applyState = useCallback((targetIndex: number, duration = 0) => {
        if (!galeriaRef.current) return;
        
        const { largeHeight, largeWidth, smallHeight, smallWidth } = sizing.current;
        const gap = 16; // 1rem
        
        // Centrar el elemento 'large'
        const centerOffset = (window.innerWidth / 2) - (largeWidth / 2);
        
        // Calcular el offset de los 'small' a la izquierda
        let totalWidthBefore = 0;
        for (let i = 0; i < targetIndex; i++) {
            totalWidthBefore += smallWidth + gap;
        }
        const targetX = centerOffset - totalWidthBefore;

    // Animar el contenedor de la galería
    gsap.to(galeriaRef.current, { x: targetX, duration, ease: ANIM_EASE });
        
        // Animar cada tarjeta
        cuadrosRef.current.forEach((cuadro, index) => {
            if (!cuadro) return;
            const isCenter = index === targetIndex;
            gsap.to(cuadro, {
                height: isCenter ? largeHeight : smallHeight,
                width: isCenter ? largeWidth : smallWidth,
                filter: isCenter ? 'grayscale(0)' : 'grayscale(0.8)',
                opacity: isCenter ? 1 : 0.8,
                duration,
                ease: ANIM_EASE
            });
            // Animar el overlay de botones
            const overlayContent = cuadro.querySelector('.overlay-content') as HTMLElement;
            if (overlayContent) {
                gsap.to(overlayContent, {
                    opacity: isCenter ? 1 : 0,
                    duration: duration / 2,
                    delay: isCenter ? duration / 2 : 0,
                    onStart: () => {
                        if (isCenter) {
                            overlayContent.style.pointerEvents = 'auto';
                        }
                    },
                    onComplete: () => {
                        if (!isCenter) {
                            overlayContent.style.pointerEvents = 'none';
                        }
                    }
                });
            }
        });
    }, [ANIM_EASE]);

    // Hook para mover el slider cuando el índice (centerIndex) cambia desde el padre
    useLayoutEffect(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        applyState(centerIndex, ANIM_DURATION);
        setTimeout(() => setIsAnimating(false), ANIM_DURATION * 1000);
    }, [centerIndex, applyState, isAnimating]);

    // Hook para sizing inicial y resize
    useLayoutEffect(() => {
        updateSizing();
        applyState(centerIndex); // Aplica estado inicial
        
        const handleResize = () => {
            updateSizing();
            applyState(centerIndex); // Aplica estado con nuevo tamaño
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [applyState, centerIndex]);

    // Maneja la animación local y llama a la función onSelection del padre
    const handleLocalSelection = useCallback((selection: 'approved' | 'rejected') => {
        console.log('[ClientSlider] handleLocalSelection called with:', selection);
        console.log('[ClientSlider] isAnimating:', isAnimating, 'isSelecting:', isSelecting);

        if (isSelecting) {
            console.log('[ClientSlider] Blocked: isSelecting is true');
            return;
        }
        
        const modelIndex = centerIndex;
        const modelId = models[modelIndex].id;
        const currentSelection = models[modelIndex].selection;

        console.log('[ClientSlider] modelIndex:', modelIndex, 'modelId:', modelId, 'currentSelection:', currentSelection);

        if (currentSelection === selection) {
            console.log('[ClientSlider] Blocked: same selection');
            return; // No hacer nada si se presiona lo mismo
        }

    // Reserve selection lock so repeated clicks don't trigger multiple requests
    setIsSelecting(true);
    // Keep isAnimating for slider motion; set true so parent-controlled moves still block
    setIsAnimating(true);
        
        const targetCuadro = cuadrosRef.current[modelIndex];
        if (!targetCuadro) {
            console.warn('[ClientSlider] targetCuadro not found for index', modelIndex);
            // release locks to avoid permanent blocking
            setIsSelecting(false);
            setIsAnimating(false);
            return;
        }

        // Referencias a los overlays de feedback
        const feedbackOverlay = targetCuadro.querySelector('.feedback-overlay') as HTMLDivElement;
        const feedbackText = targetCuadro.querySelector('.feedback-text') as HTMLDivElement;
        
        // Asigna la clase correcta para el color
        feedbackOverlay.className = `feedback-overlay absolute inset-0 opacity-0 pointer-events-none z-30 ${selection === 'approved' ? 'bg-green-500/80' : 'bg-red-500/80'}`;
        feedbackText.textContent = selection === 'approved' ? '✓ APROBADO' : '✗ RECHAZADO';
        
        // Animación de feedback
        gsap.timeline()
            .to([feedbackOverlay, feedbackText], { opacity: 1, duration: 0.3, ease: 'power2.out' })
            .add(() => {
                // Ejecuta la llamada async sin devolver la Promise a GSAP (IIFE)
                (async () => {
                    try {
                      const res = await onSelection(modelId, selection);
                      console.log('[ClientSlider] onSelection result', res);
                    } catch (err) {
                      console.error('[ClientSlider] onSelection threw', err);
                    }
                })();
            })
            .to([feedbackOverlay, feedbackText], { 
                opacity: 0, 
                duration: 0.4, 
                delay: 0.8, 
                ease: 'power2.in',
                onComplete: () => {
                    // Solo pasa al siguiente si era 'pending'
                    if (currentSelection === 'pending') {
                        onMoveTo(modelIndex + 1);
                    } else {
                        setIsAnimating(false); // Libera la animación si solo cambió de opinión
                    }
                    // Always release the selection lock when timeline completes
                    setIsSelecting(false);
                }
            });
    }, [isAnimating, isSelecting, centerIndex, models, onSelection, onMoveTo]);

    if (models.length === 0) {
        return <div className="h-[70vh] w-full flex items-center justify-center text-muted-foreground">No hay talentos asignados a este proyecto.</div>;
    }
    
    return (
        // Contenedor principal del slider
        <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden bg-white dark:bg-black">
            <div className="relative h-full flex items-center">
                {/* Contenedor que se mueve con GSAP */}
                <div className="flex gap-4 items-center h-full will-change-transform" ref={galeriaRef}>
                    {models.map((model, index) => (
                        <div 
                            key={model.id}
                            ref={el => { if (el) cuadrosRef.current[index] = el; }}
                            className="aspect-[3/4] bg-muted relative flex-shrink-0 bg-cover bg-center cursor-pointer overflow-hidden rounded-md group"
                            style={{ backgroundImage: model.coverUrl ? `url(${model.coverUrl})` : 'none' }}
                            onClick={() => index !== centerIndex && !isAnimating && onMoveTo(index)}
                        >
                            {/* Overlay de Feedback (Aprobado/Rechazado) */}
                            <div className="feedback-overlay absolute inset-0 opacity-0 pointer-events-none z-30 flex items-center justify-center"></div>
                            <div className="feedback-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-bold text-white uppercase tracking-widest opacity-0 pointer-events-none z-40 drop-shadow-2xl"></div>
                            
                            {/* Overlay de Controles (Botones y link) */}
                            <div className="overlay-content absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex justify-between items-end p-4 sm:p-6 text-white opacity-0 pointer-events-none z-20">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`size-10 sm:size-12 rounded-full backdrop-blur-sm transition-all
                                                ${model.selection === 'rejected' 
                                                    ? 'bg-red-500 border-2 border-red-400 text-white hover:bg-red-600' 
                                                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                                } 
                                                ${model.selection === 'approved' ? 'opacity-40 cursor-not-allowed' : ''}`} 
                                    disabled={model.selection === 'approved'}
                                    onClick={(e) => { 
                                        console.log('[ClientSlider] Reject button clicked!');
                                        e.stopPropagation(); 
                                        handleLocalSelection('rejected'); 
                                    }}>
                                    <X className={model.selection === 'rejected' ? 'w-6 h-6' : 'w-5 h-5'} />
                                </Button>
                                
                                <Link 
                                    href={`/c/${projectPublicId}/${model.id}`} 
                                    className="text-xs font-semibold uppercase pb-3 sm:pb-4 hover:underline" 
                                    onClick={e => e.stopPropagation()}
                                >
                                    Ver Portafolio
                                </Link>
                                
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`size-10 sm:size-12 rounded-full backdrop-blur-sm transition-all
                                                ${model.selection === 'approved' 
                                                    ? 'bg-green-500 border-2 border-green-400 text-white hover:bg-green-600' 
                                                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                                } 
                                                ${model.selection === 'rejected' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    disabled={model.selection === 'rejected'}
                                    onClick={(e) => { 
                                        console.log('[ClientSlider] Approve button clicked!');
                                        e.stopPropagation(); 
                                        handleLocalSelection('approved'); 
                                    }}>
                                    <Check className={model.selection === 'approved' ? 'w-6 h-6' : 'w-5 h-5'} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
