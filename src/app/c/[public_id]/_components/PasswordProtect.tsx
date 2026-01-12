'use client'

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import { verifyProjectPassword } from '../../../../lib/actions/projects';
import { useClientAnimation } from './ClientAnimationContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2 } from 'lucide-react';

interface PasswordProtectProps {
  projectId: string;
  projectName: string;
}

export default function PasswordProtect({ projectId, projectName }: PasswordProtectProps) {
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showCard, setShowCard] = useState(false);
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use Context hook
  const { animationState, setAnimationState, startExitAnimation } = useClientAnimation();

  // Wait for logo to reach navbar before showing login card
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
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [showCard]);

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

  // Don't render until logo animation reaches the navbar
  if (!showCard && animationState !== 'finished') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        ref={cardRef}
        className="client-wow-progress w-full max-w-sm p-6"
        style={{ opacity: 0 }}
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-6" />
          </div>
          <CardTitle className="text-title">Proyecto Protegido</CardTitle>
          <CardDescription className="text-body">
            Ingresa la contraseña para acceder a: &quot;{projectName}&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                autoFocus
              />
            </div>
            <Button
              ref={buttonRef}
              type="submit"
              className="w-full transition-all duration-300"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Acceder'
              )}
            </Button>
          </form>
        </CardContent>
      </div>
    </div>
  );
}