"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isSigningIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Correo inválido. Usa el formato: usuario@dominio.com');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('Invalid credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else if (msg.includes('confirmed')) {
        setError('Tu cuenta necesita confirmación por correo. Revisa tu bandeja de entrada.');
      } else if (msg.includes('rate') || msg.includes('limit')) {
        setError('Demasiados intentos. Espera un momento antes de intentar de nuevo.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      } else {
        setError(msg || 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-sm gap-6">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="nombre@ejemplo.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isSigningIn}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isSigningIn}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.preventDefault();
                setShowPassword((prev) => !prev);
              }}
              className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-10 z-10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-label text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSigningIn} className="w-full">
          {isSigningIn ? 'Ingresando...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </div>
  );
}
