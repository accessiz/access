'use client';

import * as React from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, Phone, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLoginForm } from './login-form.logic';
import { LoginFormProps } from './login-form.types';
import { Button } from '@/components/ui/ds/button';
import { Input } from '@/components/ui/ds/input';
import { Dropdown } from '@/components/ui/ds/dropdown';
import Logo from '@/components/LogoDark';
import { useModelI18n } from '@/lib/i18n/ModelI18nContext';

// Interfaz para datos de configuración de país y formato telefónico
interface CountryPhoneConfig {
  flag: string;
  name: string;
  minLength: number;
  maxLength: number;
  mask: string;
}

// Diccionario de soporte de países, banderas, máscaras y longitudes (estándar internacional E.164)
const prefixToCountryData: Record<string, CountryPhoneConfig> = {
  // Centroamérica y Caribe
  '+502': { flag: '🇬🇹', name: 'Guatemala', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+503': { flag: '🇸🇻', name: 'El Salvador', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+504': { flag: '🇭🇳', name: 'Honduras', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+505': { flag: '🇳🇮', name: 'Nicaragua', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+506': { flag: '🇨🇷', name: 'Costa Rica', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+507': { flag: '🇵🇦', name: 'Panamá', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+501': { flag: '🇧🇿', name: 'Belice', minLength: 7, maxLength: 7, mask: '000 0000' },
  '+509': { flag: '🇭🇹', name: 'Haití', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+53': { flag: '🇨🇺', name: 'Cuba', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+1809': { flag: '🇩🇴', name: 'República Dominicana', minLength: 7, maxLength: 10, mask: '000 0000' },
  '+1829': { flag: '🇩🇴', name: 'República Dominicana', minLength: 7, maxLength: 10, mask: '000 0000' },
  '+1849': { flag: '🇩🇴', name: 'República Dominicana', minLength: 7, maxLength: 10, mask: '000 0000' },

  // Norteamérica
  '+1': { flag: '🇺🇸', name: 'Estados Unidos / Canadá', minLength: 10, maxLength: 10, mask: '000 000 0000' },
  '+52': { flag: '🇲🇽', name: 'México', minLength: 10, maxLength: 10, mask: '00 0000 0000' },

  // Sudamérica
  '+57': { flag: '🇨🇴', name: 'Colombia', minLength: 10, maxLength: 10, mask: '000 000 0000' },
  '+58': { flag: '🇻🇪', name: 'Venezuela', minLength: 10, maxLength: 10, mask: '000 000 0000' },
  '+51': { flag: '🇵🇪', name: 'Perú', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+54': { flag: '🇦🇷', name: 'Argentina', minLength: 10, maxLength: 11, mask: '9 00 0000 0000' },
  '+55': { flag: '🇧🇷', name: 'Brasil', minLength: 10, maxLength: 11, mask: '00 00000 0000' },
  '+56': { flag: '🇨🇱', name: 'Chile', minLength: 9, maxLength: 9, mask: '9 0000 0000' },
  '+591': { flag: '🇧🇴', name: 'Bolivia', minLength: 8, maxLength: 8, mask: '0000 0000' },
  '+593': { flag: '🇪🇨', name: 'Ecuador', minLength: 9, maxLength: 9, mask: '90 000 0000' },
  '+595': { flag: '🇵🇾', name: 'Paraguay', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+598': { flag: '🇺🇾', name: 'Uruguay', minLength: 8, maxLength: 8, mask: '000 00 00' },

  // Europa
  '+34': { flag: '🇪🇸', name: 'España', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+33': { flag: '🇫🇷', name: 'Francia', minLength: 9, maxLength: 9, mask: '0 00 00 00 00' },
  '+44': { flag: '🇬🇧', name: 'Reino Unido', minLength: 9, maxLength: 10, mask: '0000 000000' },
  // En Alemania (+49) los números móviles tienen 10 u 11 dígitos y las líneas fijas/DDI entre 6 y 13 dígitos
  '+49': { flag: '🇩🇪', name: 'Alemania', minLength: 6, maxLength: 13, mask: '0000 0000 000' },
  '+39': { flag: '🇮🇹', name: 'Italia', minLength: 9, maxLength: 11, mask: '000 0000 000' },
  '+370': { flag: '🇱🇹', name: 'Lituania', minLength: 8, maxLength: 8, mask: '000 00 000' },
  '+41': { flag: '🇨🇭', name: 'Suiza', minLength: 9, maxLength: 9, mask: '00 000 00 00' },
  '+351': { flag: '🇵🇹', name: 'Portugal', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+48': { flag: '🇵🇱', name: 'Polonia', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+40': { flag: '🇷🇴', name: 'Rumania', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+31': { flag: '🇳🇱', name: 'Países Bajos', minLength: 9, maxLength: 9, mask: '0 0000 0000' },
  '+32': { flag: '🇧🇪', name: 'Bélgica', minLength: 9, maxLength: 9, mask: '000 00 00 00' },
  '+43': { flag: '🇦🇹', name: 'Austria', minLength: 4, maxLength: 13, mask: '000 0000 0000' },
  '+46': { flag: '🇸🇪', name: 'Suecia', minLength: 7, maxLength: 10, mask: '00 000 00 00' },
  '+47': { flag: '🇳🇴', name: 'Noruega', minLength: 8, maxLength: 8, mask: '000 00 000' },
  '+45': { flag: '🇩🇰', name: 'Dinamarca', minLength: 8, maxLength: 8, mask: '00 00 00 00' },
  '+358': { flag: '🇫🇮', name: 'Finlandia', minLength: 5, maxLength: 11, mask: '000 000000' },
  '+30': { flag: '🇬🇷', name: 'Grecia', minLength: 10, maxLength: 10, mask: '000 0000 000' },
  '+420': { flag: '🇨🇿', name: 'República Checa', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+36': { flag: '🇭🇺', name: 'Hungría', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+353': { flag: '🇮🇪', name: 'Irlanda', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+380': { flag: '🇺🇦', name: 'Ucrania', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+7': { flag: '🇷🇺', name: 'Rusia / Kazajistán', minLength: 10, maxLength: 10, mask: '000 000 0000' },

  // Asia, África y Oceanía
  '+86': { flag: '🇨🇳', name: 'China', minLength: 11, maxLength: 11, mask: '000 0000 0000' },
  '+81': { flag: '🇯🇵', name: 'Japón', minLength: 10, maxLength: 10, mask: '0000 000 000' },
  '+82': { flag: '🇰🇷', name: 'Corea del Sur', minLength: 9, maxLength: 10, mask: '00 0000 0000' },
  '+91': { flag: '🇮🇳', name: 'India', minLength: 10, maxLength: 10, mask: '00000 00000' },
  '+61': { flag: '🇦🇺', name: 'Australia', minLength: 9, maxLength: 9, mask: '000 000 000' },
  '+64': { flag: '🇳🇿', name: 'Nueva Zelanda', minLength: 8, maxLength: 10, mask: '00 000 0000' },
  '+971': { flag: '🇦🇪', name: 'Emiratos Árabes Unidos', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+966': { flag: '🇸🇦', name: 'Arabia Saudita', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+972': { flag: '🇮🇱', name: 'Israel', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+90': { flag: '🇹🇷', name: 'Turquía', minLength: 10, maxLength: 10, mask: '000 000 0000' },
  '+20': { flag: '🇪🇬', name: 'Egipto', minLength: 10, maxLength: 10, mask: '00 0000 0000' },
  '+27': { flag: '🇿🇦', name: 'Sudáfrica', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+63': { flag: '🇵🇭', name: 'Filipinas', minLength: 10, maxLength: 10, mask: '000 000 0000' },
  '+62': { flag: '🇮🇩', name: 'Indonesia', minLength: 9, maxLength: 12, mask: '000 0000 0000' },
  '+84': { flag: '🇻🇳', name: 'Vietnam', minLength: 9, maxLength: 10, mask: '00 0000 0000' },
  '+66': { flag: '🇹🇭', name: 'Tailandia', minLength: 9, maxLength: 9, mask: '00 000 0000' },
  '+60': { flag: '🇲🇾', name: 'Malasia', minLength: 9, maxLength: 10, mask: '00 000 0000' },
  '+65': { flag: '🇸🇬', name: 'Singapur', minLength: 8, maxLength: 8, mask: '0000 0000' },
};

// Helper dinámico para resolver datos de país y evitar mostrar "Otro", cumpliendo el estándar ITU-T E.164 (máx 15 dígitos)
const getCountryData = (prefix: string): CountryPhoneConfig => {
  if (prefixToCountryData[prefix]) {
    return prefixToCountryData[prefix];
  }
  const prefixDigits = prefix.replace(/\D/g, '').length;
  const maxDigits = Math.max(7, 15 - prefixDigits);
  return {
    flag: '🌐',
    name: `País (${prefix})`,
    minLength: 4,
    maxLength: maxDigits,
    mask: '0000 0000 0000'
  };
};

export function LoginForm({ redirectTo, prefixes = ['+502'] }: LoginFormProps) {
  const { locale, setLocale, t } = useModelI18n();
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

  // Formateador dinámico sin truncamiento de dígitos válidos
  const formatPhoneNumber = (val: string, mask: string, maxLength: number) => {
    const raw = val.replace(/\D/g, '').slice(0, maxLength);
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
    // Si quedan dígitos sin consumir por la máscara, agregarlos al final sin truncar
    if (rawIndex < raw.length) {
      if (formatted.length > 0 && !formatted.endsWith(' ')) {
        formatted += ' ';
      }
      formatted += raw.slice(rawIndex);
    }
    return formatted;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, countryData.mask, countryData.maxLength);
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

        {/* Botones Selector de Tema y Selector de Idioma */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            className="h-11 px-3 rounded-full bg-[rgb(var(--ds-color-surface-container-low))] hover:bg-[rgb(var(--ds-color-surface-container-high))] flex items-center gap-1.5 border border-[rgb(var(--ds-color-outline-variant))]/40 text-foreground text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.9] outline-none"
            title="Switch Language"
          >
            <Globe className="h-4 w-4" />
            <span>{locale === 'es' ? 'EN' : 'ES'}</span>
          </button>
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
        </div>
      </header>

      {/* CONTENEDOR DE FORMULARIO DIRECTO */}
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-10 md:py-0 text-center md:text-left">
        
        {/* PASO 1: TELÉFONO */}
        {step === 'phone' && (
          <div className="w-full space-y-8">
            <div>
              <h1 className="ds-text-4xl font-extrabold text-foreground mb-2 leading-tight">
                {t.login.titlePrefix}<span className="text-[rgb(var(--ds-color-primary))]">{t.login.titleHighlight}</span>
              </h1>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-phone">
                  {t.login.phoneLabel}
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
                    maxLength={countryData.maxLength + 6}
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
                disabled={localNumber.replace(/\D/g, '').length < countryData.minLength || localNumber.replace(/\D/g, '').length > countryData.maxLength}
                variant="primary"
                className="w-full !h-14 mt-4"
              >
                {t.login.continue}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-[rgb(var(--ds-color-outline-variant))]/20 text-center ds-text-sm text-muted-foreground">
              {t.login.supportText} <a href={getSupportWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-foreground font-bold hover:underline">{t.login.supportLink}</a>
            </div>
          </div>
        )}

        {/* PASO 2: LOGIN (CON CONTRASEÑA REGISTRADA) */}
        {step === 'password' && (
          <div className="w-full space-y-6">
            <div>
              <h2 className="ds-text-3xl font-extrabold text-foreground mb-2 leading-tight">
                {t.login.passwordTitle}
              </h2>
              <p className="ds-text-sm text-muted-foreground">
                {t.login.passwordSubtitle}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block">{t.login.phoneFieldLabel}</label>
                <div className="p-4 rounded-2xl bg-[rgb(var(--ds-color-surface-container-low))] border border-[rgb(var(--ds-color-outline-variant))]/20 ds-text-base font-semibold select-all text-left">
                  {phone}
                </div>
              </div>

              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-password">
                  {t.login.passwordLabel}
                </label>
                <Input
                  id="ds-model-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.login.passwordPlaceholder}
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
                  {t.login.loginBtn}
                </Button>
                <Button
                  type="button"
                  onClick={resetStep}
                  variant="outline"
                  className="w-full !h-14"
                >
                  {t.login.backBtn}
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
                {t.login.registerTitle}
              </h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block">{t.login.phoneFieldLabel}</label>
                <div className="p-4 rounded-2xl bg-[rgb(var(--ds-color-surface-container-low))] border border-[rgb(var(--ds-color-outline-variant))]/20 ds-text-base font-semibold select-all text-left">
                  {phone}
                </div>
              </div>

              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="ds-model-password-reg">
                  {t.login.newPasswordLabel}
                </label>
                <Input
                  id="ds-model-password-reg"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.login.newPasswordPlaceholder}
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
                  {t.login.confirmPasswordLabel}
                </label>
                <Input
                  id="ds-model-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t.login.confirmPasswordPlaceholder}
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
                  {t.login.registerBtn}
                </Button>
                <Button
                  type="button"
                  onClick={resetStep}
                  variant="outline"
                  className="w-full !h-14"
                >
                  {t.login.backBtn}
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
          <span className="ds-text-lg text-foreground font-bold">{t.login.selectCountry}</span>
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
