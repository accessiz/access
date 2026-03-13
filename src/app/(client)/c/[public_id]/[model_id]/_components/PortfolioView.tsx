'use client'

import { useState, useTransition, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { updateModelSelection } from '@/lib/actions/projects_models';

import { Check, Loader2, ChevronLeft, ChevronRight, X as CloseIcon } from 'lucide-react';
import { BackButton } from '@/components/molecules/BackButton';
import { Button } from '@/components/ui/button';

import { ClientNavbar } from '../../../_components/ClientNavbar';
import { ClientFooter } from '../../../_components/ClientFooter';
import { cn } from '@/lib/utils';
import { SmartCroppedImage } from '@/components/atoms/SmartCroppedImage';
import { MasonryGallery } from '@/components/ui/masonry-gallery';
import { CompCardScreenPreview } from '@/components/organisms/CompCardScreenPreview';

interface PortfolioViewProps {
  project: Project;
  model: Model;
}

export default function PortfolioView({ project, model: initialModel }: PortfolioViewProps) {
  const [model, setModel] = useState(initialModel);
  const [isPending, startTransition] = useTransition();

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allImages = [
    ...(model.galleryUrls || [])
  ];

  const handleSelection = (selection: 'approved' | 'rejected') => {
    startTransition(async () => {
      const result = await updateModelSelection(project.id, model.id, selection);
      if (result.success) {
        if (selection === 'approved') {
          toast.success('Talento Aprobado');
        } else {
          toast('Talento Descartado', { icon: <CloseIcon className="h-4 w-4 text-destructive" /> });
        }
        setModel(prevModel => ({ ...prevModel, client_selection: selection }));
      } else {
        toast.error(result.error || 'No se pudo guardar la selección.');
      }
    });
  };

  const backUrl = `/c/${project.public_id}`;
  const isEditable = project.status === 'in-review' || project.status === 'sent';

  // Lightbox Navigation
  const navigateLightbox = useCallback((direction: 'next' | 'prev') => {
    if (lightboxIndex === null) return;

    if (direction === 'next') {
      setLightboxIndex((prev) => (prev === null || prev === allImages.length - 1 ? 0 : prev + 1));
    } else {
      setLightboxIndex((prev) => (prev === null || prev === 0 ? allImages.length - 1 : prev - 1));
    }
  }, [lightboxIndex, allImages.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;

    if (e.key === 'ArrowRight') navigateLightbox('next');
    if (e.key === 'ArrowLeft') navigateLightbox('prev');
    if (e.key === 'Escape') setLightboxIndex(null);
  }, [lightboxIndex, navigateLightbox]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Swipe logic for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) navigateLightbox('next');
    if (isRightSwipe) navigateLightbox('prev');
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col">

      <div className="w-full max-w-335 mx-auto px-6 md:px-0 flex flex-col flex-1">

        <ClientNavbar schedule={project.schedule} />

        <header className="py-8 flex items-center gap-3">
          <BackButton href={backUrl} label="Regresar al Grid" />
          <h1 className="text-display font-semibold">{model.alias}</h1>
        </header>

        <main className="flex-1 flex flex-col items-stretch justify-start pb-32 gap-16">
          {/* Ficha Técnica (CompCard) Section */}
          <section className="w-full space-y-4">
            <h3 className="text-display-sm font-semibold text-muted-foreground/50 border-b border-border/10 pb-2">Ficha Técnica</h3>
            <CompCardScreenPreview model={model} />
          </section>

          {/* Galería de fotos (Portafolio) Section */}
          <section className="w-full space-y-4">
            <h3 className="text-display-sm font-semibold text-muted-foreground/50 border-b border-border/10 pb-2">Portafolio</h3>
            {model.galleryUrls && model.galleryUrls.length > 0 ? (
              <div className="w-full">
              <MasonryGallery
                images={model.galleryUrls.map((url, i) => ({
                  url,
                  alt: `${model.alias} - Foto ${i + 1}`,
                }))}
                onImageClick={(_url, index) =>
                  setLightboxIndex(index)
                }
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl aspect-4/3 bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">No hay fotos disponibles</p>
            </div>
          )}
          </section>
        </main>

        {/* 5. FOOTER DE ACCIONES (Sin Fade, Botones Glassmorphism) */}
        {isEditable ? (
          <footer className="sticky bottom-0 z-10 p-4 sm:p-8">
            <div className="max-w-md mx-auto flex justify-center gap-4">

              {/* Botón RECHAZAR - Glassmorphism Style */}
              <Button
                size="lg"
                className={cn(
                  "w-full backdrop-blur-md transition-all duration-300 border",
                  model.client_selection === 'rejected'
                    ? "bg-destructive/90 text-destructive-foreground border-destructive/50 hover:bg-destructive"
                    : "bg-background/60 text-destructive border-destructive/30 hover:bg-destructive/20 hover:border-destructive/50"
                )}
                onClick={() => handleSelection('rejected')}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CloseIcon className="mr-2 h-4 w-4" />}
                {model.client_selection === 'rejected' ? 'Descartado' : 'Rechazar'}
              </Button>

              {/* Botón APROBAR - Glassmorphism Style */}
              <Button
                size="lg"
                className={cn(
                  "w-full backdrop-blur-md transition-all duration-300 border",
                  model.client_selection === 'approved'
                    ? "bg-success/90 text-success-foreground border-success/50 hover:bg-success"
                    : "bg-background/60 text-success border-success/30 hover:bg-success/20 hover:border-success/50"
                )}
                onClick={() => handleSelection('approved')}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                {model.client_selection === 'approved' ? 'Aprobado' : 'Aprobar'}
              </Button>

            </div>
            {/* Pequeño texto de ayuda si ya votó */}
            {model.client_selection && model.client_selection !== 'pending' && (
              <p className="text-center text-label text-muted-foreground mt-2 animate-in fade-in">
                Puedes cambiar tu selección pulsando el otro botón.
              </p>
            )}
          </footer>
        ) : (
          /* 6. MODO SOLO LECTURA (Solo si está completado/archivado) */
          <footer className="sticky bottom-0 z-10 p-6 flex justify-center">
            <div className="bg-background/80 backdrop-blur-md px-6 py-2 rounded-full border border-separator text-muted-foreground text-sm font-medium">
              Selección: <span className={cn(model.client_selection === 'approved' ? "text-success" : "text-destructive")}>
                {model.client_selection === 'approved' ? 'Aprobado' : 'Rechazado'}
              </span>
            </div>
          </footer>
        )}

        <ClientFooter />

        {/* LIGHTBOX OVERLAY */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center touch-none"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-foreground hover:bg-background/50"
              onClick={() => setLightboxIndex(null)}
            >
              <CloseIcon className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons (Desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-foreground hidden md:flex hover:bg-background/50 h-10 w-10"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-foreground hidden md:flex hover:bg-background/50 h-10 w-10"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Image Container */}
            <div
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)} // Click outside to close
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={allImages[lightboxIndex]}
                alt={`Vista completa ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain select-none"
                crossOrigin="anonymous"
                onClick={(e) => e.stopPropagation()} // Click image shouldn't close
              />
            </div>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-50 px-3 py-1 bg-background/50 backdrop-blur-md rounded-full text-sm font-medium">
              {lightboxIndex + 1} / {allImages.length}
            </div>

            {/* PERSISTENT ACTIONS IN LIGHTBOX */}
            {isEditable && (
              <div className="absolute bottom-8 left-0 right-0 z-50 px-6">
                <div className="max-w-xs mx-auto flex gap-4">
                  <Button
                    size="default"
                    className={cn(
                      "flex-1 backdrop-blur-md border",
                      model.client_selection === 'rejected'
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-background/60 text-destructive border-destructive/50 hover:bg-destructive/80 hover:text-white"
                    )}
                    onClick={(e) => { e.stopPropagation(); handleSelection('rejected'); }}
                  >
                    <CloseIcon className="mr-2 h-4 w-4" /> Rechazar
                  </Button>

                  <Button
                    size="default"
                    className={cn(
                      "flex-1 backdrop-blur-md border",
                      model.client_selection === 'approved'
                        ? "bg-success text-success-foreground border-success"
                        : "bg-background/60 text-success border-success/50 hover:bg-success/80 hover:text-white"
                    )}
                    onClick={(e) => { e.stopPropagation(); handleSelection('approved'); }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Aprobar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}