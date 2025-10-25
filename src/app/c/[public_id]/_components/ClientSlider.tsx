'use client';

import React, { 
    useEffect, // <-- CAMBIO N°1: Importamos useEffect
    useLayoutEffect, 
    useRef, 
    useCallback, 
    memo 
} from 'react';
import { gsap } from 'gsap'; // Import GSAP
import { cn } from '@/lib/utils';
import type { Model, Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';

// --- Constantes de Animación ---
const ANIM_DURATION = 0.7;
const ANIM_EASE = 'power3.inOut';
const ASPECT_RATIO = 3 / 4;

// --- Tipos ---
export type SliderModel = Model & { 
    selection?: 'pending' | 'approved' | 'rejected' | null 
};

interface ClientSliderProps {
    project: Project;
    models: SliderModel[];
    onMoveTo: (index: number) => void;
    centerIndex: number;
    currentModel: SliderModel; // Modelo actual en el centro
    onSelection: (modelId: string, selection: 'approved' | 'rejected') => Promise<unknown>;
    isSelecting: boolean; // Estado "ocupado" centralizado
}

interface SelectionButtonProps {
    icon: React.ElementType;
    selection: 'approved' | 'rejected';
    className?: string;
    onClick: (e: React.MouseEvent) => void;
    disabled: boolean;
    currentSelection: SliderModel['selection'];
}

// --- Componente de Botón (Memoizado) ---
const SelectionButton = memo(({ 
    icon: Icon, 
    selection, 
    className, 
    onClick, 
    disabled, 
    currentSelection 
}: SelectionButtonProps) => {
    
    const isSelected = currentSelection === selection;

    const selectionClasses = {
        approved: 'bg-green-500 border-green-400 text-white hover:bg-green-600',
        rejected: 'bg-red-500 border-red-400 text-white hover:bg-red-600',
        pending: 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                `size-12 rounded-full backdrop-blur-sm transition-all`,
                isSelected ? selectionClasses[selection] : selectionClasses['pending'],
                disabled && 'opacity-40 cursor-not-allowed',
                className
            )}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation(); // Evita que el clic se propague al link
                onClick(e);
            }}
        >
            <Icon className={isSelected ? 'w-6 h-6' : 'w-5 h-5'} />
        </Button>
    );
});
SelectionButton.displayName = 'SelectionButton';


// --- Componente Principal del Slider ---
export default function ClientSlider({
    project,
    models,
    onMoveTo,
    centerIndex,
    currentModel,
    onSelection,
    isSelecting
}: ClientSliderProps) {
    
    // --- Refs del DOM ---
    const mainRef = useRef<HTMLDivElement>(null); 
    const galeriaRef = useRef<HTMLDivElement>(null);
    const cuadrosRef = useRef<(HTMLDivElement | null)[]>([]);

    // --- Refs de Estado ---
    const sizing = useRef({ 
        largeHeight: 0, 
        largeWidth: 0, 
        smallHeight: 0, 
        smallWidth: 0 
    });
    
    const isInitialMove = useRef(true);
    
    const centerIndexRef = useRef(centerIndex);
    useLayoutEffect(() => {
        centerIndexRef.current = centerIndex;
    }, [centerIndex]);

    // --- Callbacks de Lógica ---

    /**
     * Calcula y almacena los tamaños de las tarjetas (grande y pequeña)
     */
    const updateSizing = useCallback(() => {
        const sliderContainer = mainRef.current;
        if (!sliderContainer) return;

        const containerHeight = sliderContainer.clientHeight;
        const containerWidth = sliderContainer.clientWidth;

        // Si la altura es 0, no hacer nada. 
        // Esto es un seguro extra, aunque con useEffect no debería pasar.
        if (containerHeight === 0) return;

        const mobileHorizontalPadding = 32; 
        const potentialWidthFromHeight = containerHeight * ASPECT_RATIO;

        if (potentialWidthFromHeight + mobileHorizontalPadding > containerWidth) {
            sizing.current.largeWidth = containerWidth - mobileHorizontalPadding;
            sizing.current.largeHeight = sizing.current.largeWidth / ASPECT_RATIO;
        } else {
            sizing.current.largeHeight = containerHeight;
            sizing.current.largeWidth = potentialWidthFromHeight;
        }

        sizing.current.smallHeight = sizing.current.largeHeight * 0.2; 
        sizing.current.smallWidth = sizing.current.smallHeight * ASPECT_RATIO;
        
    }, []); // Sin dependencias

    /**
     * Función principal de GSAP.
     * Mueve y dimensiona todas las tarjetas para centrar el `targetIndex`.
     */
    const applyState = useCallback((targetIndex: number, duration = 0) => {
        const { largeHeight, largeWidth, smallHeight, smallWidth } = sizing.current;
        const gallery = galeriaRef.current;
        const parent = mainRef.current;
        const cards = cuadrosRef.current;

        // Si los tamaños son 0, no ejecutar la animación para evitar colapsar
        if (!gallery || !parent || cards.length === 0 || largeHeight === 0) return;

        const gap = 16; // 1rem
        const parentWidth = parent.clientWidth;
        
        const centerOffset = (parentWidth / 2) - (largeWidth / 2);
        let totalWidthBefore = 0;
        for (let i = 0; i < targetIndex; i++) {
            totalWidthBefore += smallWidth + gap;
        }
        const targetX = centerOffset - totalWidthBefore;

        gsap.to(gallery, { 
            x: targetX, 
            duration, 
            ease: ANIM_EASE 
        });

        cards.forEach((cuadro, index) => {
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
            
            const overlayContent = cuadro.querySelector('.overlay-content') as HTMLElement;
            if (overlayContent) {
                gsap.to(overlayContent, {
                    opacity: isCenter ? 1 : 0,
                    duration: duration * 0.5, 
                    delay: isCenter ? duration * 0.5 : 0, 
                    onStart: () => {
                        if (isCenter) overlayContent.style.pointerEvents = 'auto';
                    },
                    onComplete: () => {
                        if (!isCenter) overlayContent.style.pointerEvents = 'none';
                    }
                });
            }
        });
    }, []); // Sin dependencias

    /**
     * Maneja la animación de feedback (verde/rojo) al seleccionar.
     */
    const handleLocalSelection = useCallback((selection: 'approved' | 'rejected') => {
        if (isSelecting) return;
        
        const modelId = currentModel.id;
        if (currentModel.selection === selection) return; 

        const targetCuadro = cuadrosRef.current[centerIndex];
        if (!targetCuadro) return;

        const feedbackOverlay = targetCuadro.querySelector('.feedback-overlay') as HTMLDivElement;
        const feedbackText = targetCuadro.querySelector('.feedback-text') as HTMLDivElement;
        
        feedbackOverlay.className = cn(
            'feedback-overlay absolute inset-0 opacity-0 pointer-events-none z-30',
            selection === 'approved' ? 'bg-green-500/80' : 'bg-red-500/80'
        );
        feedbackText.textContent = selection === 'approved' ? '✓ APROBADO' : '✗ RECHAZADO';
        
        gsap.timeline()
            .to([feedbackOverlay, feedbackText], { opacity: 1, duration: 0.3, ease: 'power2.out' })
            .add(() => {
                onSelection(modelId, selection).catch(err => {
                    console.error('[ClientSlider] onSelection failed', err);
                });
            })
            .to([feedbackOverlay, feedbackText], { 
                opacity: 0, 
                duration: 0.4, 
                delay: 0.8, // Tiempo total que el feedback es visible
                ease: 'power2.in',
            });
            
    }, [isSelecting, centerIndex, currentModel, onSelection]);

    // --- Efectos de Layout ---

    /**
     * EFECTO 1: Dimensionamiento y ResizeObserver (Se ejecuta 1 vez)
     */
    // --- CAMBIO N°2: Se usa useEffect en lugar de useLayoutEffect ---
    useEffect(() => {
        const sliderContainer = mainRef.current;
        if (!sliderContainer) return;

        const ctx = gsap.context(() => {
            
            const onResize = () => {
                updateSizing();
                applyState(centerIndexRef.current, 0); // Siempre instantáneo
            };
            
            // --- CAMBIO N°3: Simplificado ---
            // Como estamos en useEffect, el navegador YA PINTÓ.
            // 'clientHeight' es correcto. Podemos llamar a onResize() directamente.
            // No necesitamos 'requestAnimationFrame' aquí.
            onResize();
            
            const ro = new ResizeObserver(onResize);
            ro.observe(sliderContainer);
            
            return () => {
                ro.disconnect();
            };
        }, mainRef); 

        return () => ctx.revert();
        
    }, [applyState, updateSizing]); // Dependencias estables, solo se ejecuta 1 vez

    /**
     * EFECTO 2: Movimiento (Se ejecuta en cada cambio de `centerIndex`)
     */
    // --- SIN CAMBIOS AQUÍ ---
    // Este se queda como useLayoutEffect para sincronizar la animación
    // de cambio de índice con el pintado.
    useLayoutEffect(() => {
        if (isInitialMove.current) {
            isInitialMove.current = false;
            return;
        }
        applyState(centerIndex, ANIM_DURATION);

    }, [centerIndex, applyState]); // Depende solo de centerIndex


    // --- Renderizado ---

    if (models.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                No hay talentos asignados a este proyecto.
            </div>
        );
    }
    
    return (
        // Contenedor principal que mide el tamaño (mainRef)
        <div ref={mainRef} className="relative w-full h-full overflow-hidden">
            <div className="relative h-full flex items-center">
                
                {/* Contenedor de galería que se mueve (galeriaRef) */}
                <div 
                    ref={galeriaRef} 
                    className="flex gap-4 items-center h-full will-change-transform"
                >
                    {models.map((model, index) => (
                        <div 
                            key={model.id}
                            ref={el => { cuadrosRef.current[index] = el; }}
                            className={cn(
                                "aspect-[3/4] relative flex-shrink-0 bg-cover bg-center cursor-pointer overflow-hidden group",
                                model.coverUrl ? 'bg-transparent' : 'bg-muted'
                            )}
                            style={{ backgroundImage: model.coverUrl ? `url(${model.coverUrl})` : 'none' }}
                            onClick={() => {
                                // Solo permite mover si no es el centro y no hay una selección en curso
                                if (index !== centerIndex && !isSelecting) {
                                    onMoveTo(index);
                                }
                            }}
                        >
                            {/* Overlay de Feedback (Aprobado/Rechazado) */}
                            <div className="feedback-overlay absolute inset-0 opacity-0 pointer-events-none z-30" />
                            <div className="feedback-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-bold text-white uppercase tracking-widest opacity-0 pointer-events-none z-40 drop-shadow-2xl" />
                            
                            {/* Overlay de Controles (Botones y link) */}
                            <div className="overlay-content absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white opacity-0 pointer-events-none z-20">
                                
                                <div className="flex-grow" />

                                {/* Contenedor de botones */}
                                <div className="flex justify-evenly items-end w-full">
                                    <SelectionButton
                                        icon={X}
                                        selection="rejected"
                                        disabled={isSelecting}
                                        currentSelection={currentModel.selection}
                                        onClick={() => handleLocalSelection('rejected')}
                                    />

                                    <a
                                        href={`/c/${project.public_id}/${model.id}`}
                                        className="text-xs font-semibold uppercase pb-1 hover:underline"
                                        // Detiene la propagación para no activar el onMoveTo
                                        onClick={e => e.stopPropagation()} 
                                    >
                                        Ver Portafolio
                                    </a>

                                    <SelectionButton
                                        icon={Check}
                                        selection="approved"
                                        disabled={isSelecting}
                                        currentSelection={currentModel.selection}
                                        onClick={() => handleLocalSelection('approved')}
                                    />
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}