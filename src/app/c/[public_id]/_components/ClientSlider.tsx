'use client';

import React, { 
    useLayoutEffect, 
    useRef, 
    useCallback, 
    memo 
} from 'react';
import { gsap } from 'gsap';
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
    currentModel: SliderModel;
    onSelection: (modelId: string, selection: 'approved' | 'rejected') => Promise<unknown>;
    isSelecting: boolean;
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
                e.stopPropagation();
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

    const updateSizing = useCallback(() => {
        const sliderContainer = mainRef.current;
        if (!sliderContainer) return;

        const sliderContainerHeight = sliderContainer.clientHeight;
        
        sizing.current.largeHeight = sliderContainerHeight;
        sizing.current.largeWidth = sizing.current.largeHeight * ASPECT_RATIO;
        
        sizing.current.smallHeight = sizing.current.largeHeight * 0.2; 
        sizing.current.smallWidth = sizing.current.smallHeight * ASPECT_RATIO;
    }, []);

    const applyState = useCallback((targetIndex: number, duration = 0) => {
        const { largeHeight, largeWidth, smallHeight, smallWidth } = sizing.current;
        const gallery = galeriaRef.current;
        const parent = mainRef.current;
        const cards = cuadrosRef.current;

        if (!gallery || !parent || cards.length === 0) return;

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
    }, []);

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
                delay: 0.8,
                ease: 'power2.in',
            });
            
    }, [isSelecting, centerIndex, currentModel, onSelection]);

    // --- Efectos de Layout ---

    useLayoutEffect(() => {
        const sliderContainer = mainRef.current;
        if (!sliderContainer) return;

        const ctx = gsap.context(() => {
            
            const onResize = () => {
                updateSizing();
                applyState(centerIndexRef.current, 0);
            };
            
            const animFrame = requestAnimationFrame(onResize);

            const ro = new ResizeObserver(onResize);
            ro.observe(sliderContainer);
            
            return () => {
                cancelAnimationFrame(animFrame);
                ro.disconnect();
            };
        }, mainRef);

        return () => ctx.revert();
        
    }, [applyState, updateSizing]);

    useLayoutEffect(() => {
        if (isInitialMove.current) {
            isInitialMove.current = false;
            return;
        }

        applyState(centerIndex, ANIM_DURATION);

    }, [centerIndex, applyState]);


    // --- Renderizado ---

    if (models.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                No hay talentos asignados a este proyecto.
            </div>
        );
    }
    
    return (
        <div ref={mainRef} className="relative w-full h-full overflow-hidden">
            <div className="relative h-full flex items-center">
                
                <div 
                    ref={galeriaRef} 
                    className="flex gap-4 items-center h-full will-change-transform"
                >
                    {models.map((model, index) => (
                        <div 
                            key={model.id}
                            ref={el => { cuadrosRef.current[index] = el; }}
                            className={cn(
                                "aspect-[3/4] relative flex-shrink-0 bg-cover bg-center cursor-pointer overflow-hidden group", // <<-- Eliminado: rounded-md
                                model.coverUrl ? 'bg-transparent' : 'bg-muted'
                            )}
                            style={{ backgroundImage: model.coverUrl ? `url(${model.coverUrl})` : 'none' }}
                            onClick={() => {
                                if (index !== centerIndex && !isSelecting) {
                                    onMoveTo(index);
                                }
                            }}
                        >
                            <div className="feedback-overlay absolute inset-0 opacity-0 pointer-events-none z-30" />
                            <div className="feedback-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-bold text-white uppercase tracking-widest opacity-0 pointer-events-none z-40 drop-shadow-2xl" />
                            
                            <div className="overlay-content absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white opacity-0 pointer-events-none z-20">
                                
                                <div className="flex-grow" />

                                <div className="flex justify-between items-end w-full">
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