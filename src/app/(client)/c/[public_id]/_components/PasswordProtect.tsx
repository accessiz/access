'use client'

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import { verifyProjectPassword } from '@/lib/actions/projects';
import { useClientAnimation } from './ClientAnimationContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

interface PasswordProtectProps {
  projectId: string;
  projectName: string;
}

export default function PasswordProtect({ projectId }: PasswordProtectProps) {
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showCard, setShowCard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use Context hook
  const { animationState, setAnimationState, startExitAnimation } = useClientAnimation();

  // Si la intro ya terminó (navigación directa o refresh), mostrar inmediatamente
  useEffect(() => {
    if (animationState === 'finished' && !showCard) {
      setShowCard(true);
    }
  }, [animationState, showCard]);

  // Wait for logo to reach navbar before showing login card (first visit flow)
  useEffect(() => {
    if (animationState === 'logo-to-nav') {
      // Small delay, then show card and set state to login
      const timer = setTimeout(() => {
        setShowCard(true);
        setAnimationState('login');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [animationState, setAnimationState]);

  // Animate card entrance when it becomes visible
  useEffect(() => {
    if (showCard && cardRef.current) {
      // Si la intro ya terminó, mostrar directamente sin animación GSAP
      if (animationState === 'finished') {
        gsap.set(cardRef.current, {
          visibility: 'visible',
          opacity: 1,
          y: 0,
          scale: 1
        });
        return;
      }
      // Animación normal para el flujo de primera visita
      gsap.set(cardRef.current, {
        visibility: 'visible',
        opacity: 0,
        y: 30,
        scale: 0.95
      });
      requestAnimationFrame(() => {
        gsap.to(cardRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power2.out'
        });
      });
    }
  }, [showCard, animationState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await verifyProjectPassword(projectId, password);
      if (result.success) {
        toast.success('Acceso concedido. ¡Bienvenido!');

        // Phase 5: Button glow animation
        if (buttonRef.current) {
          await new Promise<void>((resolve) => {
            gsap.to(buttonRef.current, {
              scale: 1.02,
              duration: 0.4,
              ease: 'power2.out',
              onComplete: () => {
                gsap.to(buttonRef.current, {
                  scale: 1,
                  duration: 0.3,
                  ease: 'power2.in',
                  onComplete: resolve
                });
              }
            });
          });
        }

        // Phase 6: Trigger Exit Animation
        await startExitAnimation();

        // Force revalidation/redirect
        router.push(window.location.pathname);

      } else {
        toast.error(result.error || 'Ocurrió un error.');
      }
    });
  };

  // No ocultar el componente por completo si es el que debe estar bloqueando la pantalla.
  // Solo regresamos null si estamos esperando activamente la intro del logo.
  if (!showCard && animationState !== 'finished' && animationState !== 'intro') {
    return null;
  }

  // Si estamos en 'intro' por más de un breve momento, forzamos la visibilidad del card
  // para no dejar al usuario con una pantalla negra.
  useEffect(() => {
    if (animationState === 'intro') {
      const timer = setTimeout(() => {
        setShowCard(true);
      }, 3000); // 3 segundos de gracia para la intro
      return () => clearTimeout(timer);
    }
  }, [animationState]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black">
      <div
        ref={cardRef}
        className="w-full max-w-85"
        style={{ visibility: 'hidden' }}
      >
        {/* Card con borde animado magenta */}
        <div className="client-wow-progress dark-solid rounded-2xl! bg-[#0a0510]! px-8 py-10 flex flex-col items-center text-center">

          {/* Icono Candado */}
          <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full border border-[#87189D]/50 bg-[#87189D]/10">
            <Lock className="w-6 h-6 text-[#B94CC9]" />
          </div>

          {/* Textos */}
          <h2 className="text-2xl font-bold text-white mb-2">Proyecto Privado</h2>
          <p className="text-white/50 mb-8 text-sm">
            Ingresa la contraseña para acceder
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                autoFocus
                className="w-full h-12 bg-[#1a0f1e] border-[#87189D]/30 text-center text-white placeholder:text-white/30 focus:border-[#B94CC9] focus:ring-[#B94CC9]/20 rounded-2xl pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#B94CC9] transition-colors focus:outline-none cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              ref={buttonRef}
              type="submit"
              className="w-full h-12 rounded-full bg-linear-to-r from-[#87189D] via-[#A020A0] to-[#B94CC9] hover:from-[#9F46B0] hover:via-[#B830B8] hover:to-[#CB5CD9] text-white font-medium transition-all duration-300 shadow-[0_4px_20px_rgba(135,24,157,0.4)] hover:shadow-[0_4px_30px_rgba(135,24,157,0.6)] border-0 cursor-pointer"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}