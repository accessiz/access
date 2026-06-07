'use client';

import * as React from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, ArrowUpRight, Check, ShieldAlert } from 'lucide-react';
import { useLoginForm } from './login-form.logic';
import { LoginFormProps } from './login-form.types';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm({ redirectTo }: LoginFormProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    step,
    error,
    isPending,
    handleEmailSubmit,
    handleLogin,
    handleRegister,
    resetStep,
  } = useLoginForm(redirectTo);

  if (step === 'email') {
    return (
      <Card className="w-full max-w-md mx-auto bg-card border border-border rounded-[24px] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <CardContent className="p-0">
          
          {/* Encabezado con titulo */}
          <div className="text-center mb-8">
            <h2 suppressHydrationWarning className="text-xl md:text-display font-extrabold text-foreground tracking-tight">Bienvenido</h2>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2" htmlFor="model-email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="model-email"
                  type="email"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3.5 pl-11 pr-4 text-foreground text-xs font-semibold outline-none transition-all duration-200"
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <p className="text-label text-destructive text-center p-3 rounded-lg border border-destructive/25 bg-destructive/10" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#f4f4f6] text-[#18181b] hover:bg-purple hover:text-white font-bold rounded-xl py-3.5 px-4 transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm active:scale-[0.98] cursor-pointer border-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center text-[11px] text-muted-foreground">
            ¿Problemas de acceso? <a href="#" className="text-foreground font-bold hover:underline">Soporte IZ</a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'register') {
    return (
      <Card className="w-full max-w-md mx-auto bg-card border border-border rounded-[24px] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <CardContent className="p-0">
          
          <button 
            type="button"
            onClick={resetStep}
            className="absolute top-6 left-6 h-8 w-8 rounded-full bg-tertiary hover:bg-primary hover:text-background text-foreground flex items-center justify-center transition-colors duration-200 border-0 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <div className="mt-8 mb-6 text-left">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-tertiary border border-border">
              <ShieldAlert className="h-5 w-5 text-purple shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[9px] font-bold text-foreground uppercase tracking-widest">Primer Ingreso</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Establece una contraseña para tu cuenta de acceso.</p>
              </div>
            </div>
            
            <h2 className="text-xl md:text-title font-extrabold text-foreground tracking-tight mt-6">Establecer Contraseña</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="text-left space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Correo Electrónico</Label>
              </div>
              <div className="p-3.5 rounded-xl bg-background border border-border font-semibold text-body select-all truncate">
                {email}
              </div>
            </div>

            <div className="text-left">
              <Label htmlFor="model-password-reg" className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="model-password-reg"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3.5 pl-11 pr-11 text-foreground text-xs font-semibold outline-none transition-all duration-200"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-left">
              <Label htmlFor="model-confirm-password" className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="model-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3.5 pl-11 pr-11 text-foreground text-xs font-semibold outline-none transition-all duration-200"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-label text-destructive text-center p-3 rounded-lg border border-destructive/25 bg-destructive/10" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#f4f4f6] text-[#18181b] hover:bg-purple hover:text-white font-bold rounded-xl py-3.5 px-4 transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm active:scale-[0.98] cursor-pointer border-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Registrarse y Acceder</span>
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // step === 'password'
  return (
    <Card className="w-full max-w-md mx-auto bg-card border border-border rounded-[24px] p-6 md:p-10 shadow-2xl relative overflow-hidden">
      <CardContent className="p-0">
        
        <button 
          type="button"
          onClick={resetStep}
          className="absolute top-6 left-6 h-8 w-8 rounded-full bg-tertiary hover:bg-primary hover:text-background text-foreground flex items-center justify-center transition-colors duration-200 border-0 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>

        <div className="text-center mb-8 mt-8">
          <h2 className="text-xl md:text-display font-extrabold text-foreground tracking-tight">Ingresar Contraseña</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Correo Electrónico</Label>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border font-semibold text-body select-all truncate">
              {email}
            </div>
          </div>

          <div className="text-left">
            <Label htmlFor="model-password-login" className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">
              Contraseña
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="model-password-login"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3.5 pl-11 pr-11 text-foreground text-xs font-semibold outline-none transition-all duration-200"
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-label text-destructive text-center p-3 rounded-lg border border-destructive/25 bg-destructive/10" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#f4f4f6] text-[#18181b] hover:bg-purple hover:text-white font-bold rounded-xl py-3.5 px-4 transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm active:scale-[0.98] cursor-pointer border-0"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Iniciando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
