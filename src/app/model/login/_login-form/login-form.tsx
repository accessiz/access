'use client';

import * as React from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, Phone, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLoginForm } from './login-form.logic';
import { LoginFormProps } from './login-form.types';
import { Button } from '@/components/ui/ds/button';
import { Input } from '@/components/ui/ds/input';
import { Dropdown } from '@/components/ui/ds/dropdown';
import Logo from '@/components/LogoDark';

// Diccionario de soporte de países, banderas, máscaras y longitudes
const prefixToCountryData: Record<string, { flag: string; name: string; length: number; mask: string }> = {
  '+502': { flag: '🇬🇹', name: 'Guatemala', length: 8, mask: '0000 0000' },
  '+52': { flag: '🇲🇽', name: 'México', length: 10, mask: '00 0000 0000' },
  '+503': { flag: '🇸🇻', name: 'El Salvador', length: 8, mask: '0000 0000' },
  '+504': { flag: '🇭🇳', name: 'Honduras', length: 8, mask: '0000 0000' },
  '+506': { flag: '🇨🇷', name: 'Costa Rica', length: 8, mask: '0000 0000' },
  '+507': { flag: '🇵🇦', name: 'Panamá', length: 8, mask: '0000 0000' },
  '+57': { flag: '🇨🇴', name: 'Colombia', length: 10, mask: '000 000 0000' },
  '+1': { flag: '🇺🇸', name: 'Estados Unidos', length: 10, mask: '000 000 0000' },
  '+33': { flag: '🇫🇷', name: 'Francia', length: 9, mask: '0 00 00 00 00' },
  '+34': { flag: '🇪🇸', name: 'España', length: 9, mask: '000 000 000' },
  '+44': { flag: '🇬🇧', name: 'Reino Unido', length: 10, mask: '0000 000000' },
  '+58': { flag: '🇻🇪', name: 'Venezuela', length: 10, mask: '000 000 0000' },
  '+370': { flag: '🇱🇹', name: 'Lituania', length: 8, mask: '000 00 000' },
  '+49': { flag: '🇩🇪', name: 'Alemania', length: 10, mask: '0000 000000' },
  '+39': { flag: '🇮🇹', name: 'Italia', length: 10, mask: '000 0000 000' },
  '+51': { flag: '🇵🇪', name: 'Perú', length: 9, mask: '000 000 000' },
  '+54': { flag: '🇦🇷', name: 'Argentina', length: 10, mask: '9 00 0000 0000' },
  '+55': { flag: '🇧🇷', name: 'Brasil', length: 11, mask: '00 00000 0000' },
  '+56': { flag: '🇨🇱', name: 'Chile', length: 9, mask: '9 0000 0000' },
  '+591': { flag: '🇧🇴', name: 'Bolivia', length: 8, mask: '0000 0000' },
  '+593': { flag: '🇪🇨', name: 'Ecuador', length: 9, mask: '90 000 0000' },
  '+595': { flag: '🇵🇾', name: 'Paraguay', length: 9, mask: '000 000 000' },
  '+598': { flag: '🇺🇾', name: 'Uruguay', length: 8, mask: '000 00 00' },
  '+41': { flag: '🇨🇭', name: 'Suiza', length: 9, mask: '00 000 00 00' },
  '+351': { flag: '🇵🇹', name: 'Portugal', length: 9, mask: '000 000 000' },
  '+48': { flag: '🇵🇱', name: 'Polonia', length: 9, mask: '000 000 000' },
  '+40': { flag: '🇷🇴', name: 'Rumania', length: 9, mask: '000 000 000' },
  '+31': { flag: '🇳🇱', name: 'Países Bajos', length: 9, mask: '0 0000 0000' },
  '+32': { flag: '🇧🇪', name: 'Bélgica', length: 9, mask: '000 00 00 00' },
  '+43': { flag: '🇦🇹', name: 'Austria', length: 10, mask: '000 0000 000' },
  '+46': { flag: '🇸🇪', name: 'Suecia', length: 9, mask: '00 000 00 00' },
  '+47': { flag: '🇳🇴', name: 'Noruega', length: 8, mask: '000 00 000' },
  '+45': { flag: '🇩🇰', name: 'Dinamarca', length: 8, mask: '00 00 00 00' },
  '+358': { flag: '🇫🇮', name: 'Finlandia', length: 9, mask: '000 000000' },
};

// Helper dinámico para resolver datos de país y evitar mostrar "Otro"
const getCountryData = (prefix: string) => {
  if (prefixToCountryData[prefix]) {
    return prefixToCountryData[prefix];
  }
  return {
    flag: '🌐',
    name: `País (${prefix})`,
    length: 10,
    mask: '0000000000'
  };
};

export function LoginForm({ redirectTo, prefixes = ['+502'] }: LoginFormProps) {
  const {
    phone,
    setPhone,
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
    handlePhoneSubmit,
    handleLogin,
    handleRegister,
    resetStep,
  } = useLoginForm(redirectTo);

  // Tema claro/oscuro
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Prefijo y banderas locales
  const [countryCode, setCountryCode] = React.useState(() => {
    if (prefixes.includes('+502')) return '+502';
    return prefixes[0] || '+502';
  });
  const [localNumber, setLocalNumber] = React.useState('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const countryData = getCountryData(countryCode);

  // Formateador dinámico según máscara del país
  const formatPhoneNumber = (val: string, mask: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = '';
    let rawIndex = 0;
    for (let i = 0; i < mask.length && rawIndex < raw.length; i++) {
      if (mask[i] === '0') {
        formatted += raw[rawIndex];
        rawIndex++;
      } else {
        formatted += mask[i];
      }
    }
    return formatted;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, countryData.mask);
    setLocalNumber(formatted);
  };

  // Sincronizar estado local con el hook principal
  React.useEffect(() => {
    const cleanedLocal = localNumber.replace(/\D/g, '');
    if (cleanedLocal) {
      setPhone(countryCode + cleanedLocal);
    } else {
      setPhone('');
    }
  }, [countryCode, localNumber, setPhone]);

  // WhatsApp de Soporte
  const getSupportWhatsappUrl = () => {
    const destination = '50247388666';
    const displayPhone = phone.trim() || '(poner tu número aqui porfavor)';
    const text = `Hola estoy intentando ingresar con el número de teléfono ${displayPhone} pero no puedo ingresar.`;
    return `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
  };

  return (
    <main className="ds-grid-auth-main flex flex-col justify-between min-h-screen bg-card md:bg-background/20 p-6 sm:p-12 md:p-16 relative transition-colors duration-300">
      
      {/* HEADER CON CONTROLADOR DE TEMA */}
      <header className="w-full flex justify-between items-center z-30">
        {/* Logo visible solo en móvil (Logotipo de Access) */}
        <div className="flex items-center gap-2 md:hidden">
          <Logo className="h-7 w-auto text-foreground" />
        </div>
        <div className="hidden md:block"></div>

        {/* Botón Selector de Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-11 h-11 rounded-full bg-[rgb(var(--ds-color-surface-container-low))] hover:bg-[rgb(var(--ds-color-surface-container-high))] flex items-center justify-center border border-[rgb(var(--ds-color-outline-variant))]/40 text-foreground transition-all duration-200 cursor-pointer active:scale-[0.9] outline-none"
          aria-label="Cambiar tema"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* CONTENEDOR DE FORMULARIO DIRECTO */}
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-10 md:py-0 text-center md:text-left">
        
        {/* PASO 1: TELÉFONO */}
        {step === 'phone' && (
          <div className="w-full space-y-8">
            <div>
              <h1 className="ds-text-4xl font-extrabold text-foreground mb-2 leading-tight">
                Ingresa a tu <span className="text-[rgb(var(--ds-color-primary))]">perfil</span>
              </h1>

            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-phone">
                  Ingresa tu número de teléfono
                </label>
                
                <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                  <Dropdown
                    onClick={() => setIsDrawerOpen(true)}
                    triggerContent={<span className="text-2xl select-none">{countryData.flag}</span>}
                    className="w-full !h-14"
                  />

                  <Input
                    id="ds-model-phone"
                    type="tel"
                    placeholder={countryData.mask}
                    value={localNumber}
                    onChange={handlePhoneInputChange}
                    leftElement={<span className="ds-text-base text-muted-foreground font-bold select-none">{countryCode}</span>}
                    leftPadding={countryCode.length >= 4 ? '5.5rem' : '4.5rem'}
                    className="!h-14"
                    disabled={isPending}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 ds-text-sm text-red-500 font-semibold" role="alert">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={isPending}
                disabled={localNumber.replace(/\D/g, '').length !== countryData.length}
                variant="primary"
                className="w-full !h-14 mt-4"
              >
                Continuar
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-[rgb(var(--ds-color-outline-variant))]/20 text-center ds-text-sm text-muted-foreground">
              ¿Problemas de acceso? <a href={getSupportWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-foreground font-bold hover:underline">Soporte IZ</a>
            </div>
          </div>
        )}

        {/* PASO 2: LOGIN (CON CONTRASEÑA REGISTRADA) */}
        {step === 'password' && (
          <div className="w-full space-y-6">
            <div>
              <h2 className="ds-text-3xl font-extrabold text-foreground mb-2 leading-tight">
                Escribe tu contraseña
              </h2>
              <p className="ds-text-sm text-muted-foreground">
                Ingresa la contraseña de tu cuenta para acceder al portal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block">Número de teléfono</label>
                <div className="p-4 rounded-2xl bg-[rgb(var(--ds-color-surface-container-low))] border border-[rgb(var(--ds-color-outline-variant))]/20 ds-text-base font-semibold select-all text-left">
                  {phone}
                </div>
              </div>

              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-password">
                  Contraseña
                </label>
                <Input
                  id="ds-model-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className="!h-14"
                  autoComplete="current-password"
                  rightElement={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 outline-none"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  }
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 ds-text-sm text-red-500 font-semibold" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  loading={isPending}
                  variant="primary"
                  className="w-full !h-14"
                >
                  Ingresar
                </Button>
                <Button
                  type="button"
                  onClick={resetStep}
                  variant="outline"
                  className="w-full !h-14"
                >
                  Volver
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 3: REGISTRO (NUEVA CONTRASEÑA EN PRIMER ACCESO) */}
        {step === 'register' && (
          <div className="w-full space-y-6">
            <div>
              <h2 className="ds-text-3xl font-extrabold text-foreground mb-2 leading-tight">
                Establecer contraseña
              </h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block">Número de teléfono</label>
                <div className="p-4 rounded-2xl bg-[rgb(var(--ds-color-surface-container-low))] border border-[rgb(var(--ds-color-outline-variant))]/20 ds-text-base font-semibold select-all text-left">
                  {phone}
                </div>
              </div>

              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-password-reg">
                  Nueva contraseña
                </label>
                <Input
                  id="ds-model-password-reg"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className="!h-14"
                  autoComplete="new-password"
                  minLength={6}
                  rightElement={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 outline-none"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-confirm-password">
                  Confirmar contraseña
                </label>
                <Input
                  id="ds-model-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className="!h-14"
                  autoComplete="new-password"
                  minLength={6}
                  rightElement={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 outline-none"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  }
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 ds-text-sm text-red-500 font-semibold" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  loading={isPending}
                  variant="primary"
                  className="w-full !h-14"
                >
                  Establecer contraseña
                </Button>
                <Button
                  type="button"
                  onClick={resetStep}
                  variant="outline"
                  className="w-full !h-14"
                >
                  Volver
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* DRAWER / MODAL ADAPTATIVO DE PAÍSES */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        />
      )}
      
      <div className={`fixed bottom-0 md:top-1/2 md:bottom-auto left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-md max-h-[80vh] md:max-h-[600px] bg-[rgb(var(--ds-color-surface))] rounded-t-[32px] md:rounded-2xl border border-[rgb(var(--ds-color-outline-variant))]/30 shadow-2xl z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDrawerOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none md:translate-y-[-40%]'}`}>
        
        <div className="w-full flex justify-center py-3 md:hidden">
          <div className="w-10 h-1 bg-[rgb(var(--ds-color-outline-variant))]/50 rounded-full"></div>
        </div>

        <div className="px-6 pb-3 pt-2 md:pt-5 flex justify-between items-center border-b border-[rgb(var(--ds-color-outline-variant))]/20">
          <span className="ds-text-lg text-foreground font-bold">Selecciona tu país</span>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="w-9 h-9 rounded-full bg-[rgb(var(--ds-color-surface-container-high))] flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 border-0 cursor-pointer outline-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-1.5 scrollbar-none">
          {prefixes.map((pref) => {
            const data = getCountryData(pref);
            return (
              <button
                key={pref}
                type="button"
                onClick={() => {
                  setCountryCode(pref);
                  setLocalNumber('');
                  setIsDrawerOpen(false);
                }}
                className="w-full h-14 px-4 rounded-xl grid grid-cols-[36px_1fr_auto] items-center text-left hover:bg-[rgb(var(--ds-color-surface-container-high))] transition-colors cursor-pointer border-0 bg-transparent active:scale-[0.99] outline-none"
              >
                <span className="text-2xl select-none">{data.flag}</span>
                <span className="ds-text-base font-bold text-foreground">{data.name}</span>
                <span className="ds-text-base text-muted-foreground font-semibold">{pref}</span>
              </button>
            );
          })}
        </div>
      </div>



    </main>
  );
}
