'use client';

import React, { 
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
/**
 * Un botón de selección puro y memoizado para evitar re-renders innecesarios
 * cuando el slider se mueve.
 */
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
    // mainRef es el contenedor principal, usado para el contexto de GSAP y ResizeObserver
    const mainRef = useRef<HTMLDivElement>(null); 
    // galeriaRef es el contenedor *móvil* que GSAP animará en 'x'
    const galeriaRef = useRef<HTMLDivElement>(null);
    // cuadrosRef es un array de todas las tarjetas individuales
    const cuadrosRef = useRef<(HTMLDivElement | null)[]>([]);

    // --- Refs de Estado ---
    // Ref para almacenar los tamaños calculados. No dispara re-renders.
    const sizing = useRef({ 
        largeHeight: 0, 
        largeWidth: 0, 
        smallHeight: 0, 
        smallWidth: 0 
    });
    
    // Ref para evitar que la animación de "movimiento" se ejecute en la carga inicial
    const isInitialMove = useRef(true);
    
    // Ref para almacenar el centerIndex actual.
    const centerIndexRef = useRef(centerIndex);
    useLayoutEffect(() => {
        centerIndexRef.current = centerIndex;
    }, [centerIndex]);

    // --- Callbacks de Lógica ---

    /**
     * Calcula y almacena los tamaños de las tarjetas (grande y pequeña)
     * basándose en la altura Y ANCHO del contenedor principal (mainRef).
     */
    const updateSizing = useCallback(() => {
        const sliderContainer = mainRef.current;
        if (!sliderContainer) return;

        // --- INICIO DE LA MODIFICACIÓN RESPONSIVE ---
        
        // 1. Obtener ambas dimensiones del contenedor
        const containerHeight = sliderContainer.clientHeight;
        const containerWidth = sliderContainer.clientWidth;

        // 2. Definir un padding horizontal para evitar que la tarjeta toque los bordes en móvil
        // (ej: 1rem a cada lado = 16px * 2 = 32px)
        const mobileHorizontalPadding = 32; 

        // 3. Calcular el ancho potencial si usamos el 100% de la altura
        const potentialWidthFromHeight = containerHeight * ASPECT_RATIO;

        // 4. Comprobar si el ancho potencial (más el padding) se pasa del ancho del contenedor
        if (potentialWidthFromHeight + mobileHorizontalPadding > containerWidth) {
            
            // --- Caso Móvil (El ANCHO es la limitante) ---
            // El ancho de la tarjeta es el ancho del contenedor menos el padding
            sizing.current.largeWidth = containerWidth - mobileHorizontalPadding;
            // La altura se recalcula basándose en el nuevo ancho
            sizing.current.largeHeight = sizing.current.largeWidth / ASPECT_RATIO;

        } else {
            
            // --- Caso Desktop (La ALTURA es la limitante) ---
            // La altura de la tarjeta es la altura del contenedor
            sizing.current.largeHeight = containerHeight;
            // El ancho se calcula basándose en la altura (como estaba antes)
            sizing.current.largeWidth = potentialWidthFromHeight;
        }
        // --- FIN DE LA MODIFICACIÓN RESPONSIVE ---

        // El tamaño de las tarjetas pequeñas sigue siendo relativo al tamaño grande
        sizing.current.smallHeight = sizing.current.largeHeight * 0.2; 
        sizing.current.smallWidth = sizing.current.smallHeight * ASPECT_RATIO;
        
    }, []); // La función sigue sin tener dependencias

    /**
     * Función principal de GSAP.
     * Mueve y dimensiona todas las tarjetas para centrar el `targetIndex`.
     */
    const applyState = useCallback((targetIndex: number, duration = 0) => {
        const { largeHeight, largeWidth, smallHeight, smallWidth } = sizing.current;
        const gallery = galeriaRef.current;
        const parent = mainRef.current;
        const cards = cuadrosRef.current;

        if (!gallery || !parent || cards.length === 0) return;

        const gap = 16; // 1rem
        const parentWidth = parent.clientWidth;
        
        // 1. Calcular la posición X del contenedor de la galería
        const centerOffset = (parentWidth / 2) - (largeWidth / 2);
        let totalWidthBefore = 0;
        for (let i = 0; i < targetIndex; i++) {
            totalWidthBefore += smallWidth + gap;
        }
        const targetX = centerOffset - totalWidthBefore;

        // 2. Animar el contenedor principal
        gsap.to(gallery, { 
            x: targetX, 
            duration, 
            ease: ANIM_EASE 
        });

        // 3. Animar cada tarjeta individual
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
            
            // 4. Animar el overlay de botones y texto
            const overlayContent = cuadro.querySelector('.overlay-content') as HTMLElement;
            if (overlayContent) {
                gsap.to(overlayContent, {
                    opacity: isCenter ? 1 : 0,
                    duration: duration * 0.5, // Más rápido
                    delay: isCenter ? duration * 0.5 : 0, // Aparece a la mitad, desaparece al inicio
                    onStart: () => {
                        if (isCenter) overlayContent.style.pointerEvents = 'auto';
                    },
                    onComplete: () => {
                        if (!isCenter) overlayContent.style.pointerEvents = 'none';
                    }
                });
            }
        });
    }, []); // Sin dependencias, solo usa refs y argumentos

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
    useLayoutEffect(() => {
        const sliderContainer = mainRef.current;
        if (!sliderContainer) return;

        const ctx = gsap.context(() => {
            
            const onResize = () => {
                updateSizing();
                applyState(centerIndexRef.current, 0); // Siempre instantáneo
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
        
    }, [applyState, updateSizing]); // Dependencias estables, solo se ejecuta 1 vez

    /**
     * EFECTO 2: Movimiento (Se ejecuta en cada cambio de `centerIndex`)
     */
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
                                // Clase condicional para fondo si no hay imagen
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