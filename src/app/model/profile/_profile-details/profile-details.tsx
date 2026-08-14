'use client';

import * as React from 'react';
import { Instagram, Check, Loader2, Mail, Phone, MapPin, Sparkles, DollarSign, Briefcase, ChevronDown } from 'lucide-react';
import { useProfileDetails } from './profile-details.logic';
import { ProfileDetailsProps } from './profile-details.types';
import { toPublicUrl, toTitleCase } from '@/lib/utils';
import { Input } from '@/components/ui/ds/input';
import { Button } from '@/components/ui/ds/button';
import { useModelI18n } from '@/lib/i18n/ModelI18nContext';
import gsap from 'gsap';

// TikTok SVG Icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export function ProfileDetails({
  model,
  totalProjects,
  approvedCount,
  totalIncome,
  className = '',
}: ProfileDetailsProps) {
  const { t } = useModelI18n();
  const {
    isEditing,
    setIsEditing,
    email,
    setEmail,
    phone,
    setPhone,
    instagram,
    setInstagram,
    tiktok,
    setTiktok,
    isPending,
    handleUpdateProfile,
    handleCancel,
  } = useProfileDetails(model.id, model.email, model.phone_e164, model.instagram, model.tiktok);

  React.useEffect(() => {
    const toolbar = document.querySelector('.ds-floating-toolbar');
    if (!toolbar) return;

    if (isEditing) {
      gsap.to(toolbar, {
        y: 120, // Desplazar hacia abajo fuera de la pantalla
        opacity: 0,
        scale: 0.95,
        duration: 0.35,
        ease: 'power2.inOut',
        pointerEvents: 'none',
      });
    } else {
      gsap.to(toolbar, {
        y: 0, // Regresar a su posición original
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: 'power3.out',
        clearProps: 'pointerEvents',
      });
    }
  }, [isEditing]);

  const coverUrl = React.useMemo(() => {
    return toPublicUrl(model.cover_path);
  }, [model.cover_path]);

  return (
    <div className={`space-y-12 lg:space-y-6 w-full ${className}`}>
      
      {/* 1. SECCIÓN DE RETRATO PRINCIPAL (Tinder-like Card - Instagrammable) */}
      <div className="relative w-full max-w-[480px] h-[580px] rounded-[32px] overflow-hidden shadow-2xl border border-transparent flex flex-col justify-between p-6 mx-auto bg-transparent">
        
        {/* Retrato de fondo de la modelo */}
        <div className="absolute inset-0 z-0 select-none">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={model.full_name || 'Talento'}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-black text-zinc-700 bg-zinc-900">
              {(model.alias || model.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          {/* Gradientes premium superpuestos para legibilidad y estética */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple/5 to-purple/20 mix-blend-overlay z-10" />
        </div>

        {/* Capa Superior del Card: Etiqueta "Model" a la izquierda */}
        <div className="w-full flex justify-between items-center z-20">
          <div className="bg-black/45 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full flex items-center shadow-lg select-none">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              Model
            </span>
          </div>
          <div />
        </div>

        {/* Capa Inferior del Card: Alias y País de residencia */}
        <div className="w-full flex flex-col gap-4 z-20">
          <div>
            <h2 className="ds-text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {toTitleCase(model.alias || model.full_name)}
            </h2>
            <div className="flex items-center gap-1.5 text-white/90 drop-shadow-md select-none mt-1.5">
              <MapPin className="h-4 w-4 text-purple shrink-0" />
              <span className="ds-text-sm font-semibold tracking-wide">
                {toTitleCase(model.country || 'Guatemala')}
              </span>
            </div>
          </div>

          {/* Indicador táctil de Scroll Down */}
          <div className="flex justify-center pt-2 animate-bounce opacity-70">
            <ChevronDown className="h-6 w-6 text-white" strokeWidth={3} />
          </div>
        </div>

      </div>

      {/* 2. SECCIÓN DE INFORMACIÓN PERSONAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 max-w-4xl mx-auto w-full text-left bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 p-6 md:p-8 rounded-3xl shadow-sm">
        
        {/* Header de la sección */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 border-b border-[rgb(var(--ds-color-outline-variant))]/10 pb-3 mb-1 flex items-center justify-between">
          <span className="ds-text-xs text-muted-foreground font-black tracking-widest uppercase">
            {t.profile.personalData}
          </span>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="ds-text-sm text-muted-foreground font-semibold block">{t.profile.email}</label>
          <Input
            readOnly
            value={model.email || 'No especificando'}
            leftElement={<Mail className="h-4.5 w-4.5 text-purple" />}
            className="cursor-default"
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <label className="ds-text-sm text-muted-foreground font-semibold block">{t.profile.phone}</label>
          <Input
            readOnly
            value={model.phone_e164 || 'No especificado'}
            leftElement={<Phone className="h-4.5 w-4.5 text-purple" />}
            className="cursor-default"
          />
        </div>

        {/* Redes Sociales */}
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <label className="ds-text-sm text-muted-foreground font-semibold block">Social Media</label>
          <div className="space-y-3">
            {/* Instagram */}
            {model.instagram ? (
              <a
                href={`https://instagram.com/${model.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                <Input
                  readOnly
                  value={`@${model.instagram.replace('@', '').toLowerCase()}`}
                  leftElement={<Instagram className="h-4.5 w-4.5 text-rose-500" />}
                  className="cursor-pointer hover:border-rose-500/50 transition-colors"
                />
              </a>
            ) : (
              <Input
                readOnly
                value="Instagram"
                leftElement={<Instagram className="h-4.5 w-4.5 text-muted-foreground/45" />}
                className="opacity-65 cursor-not-allowed"
              />
            )}

            {/* TikTok */}
            {model.tiktok ? (
              <a
                href={`https://tiktok.com/@${model.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                <Input
                  readOnly
                  value={`@${model.tiktok.replace('@', '').toLowerCase()}`}
                  leftElement={<TikTokIcon className="h-4.5 w-4.5 text-foreground dark:text-white" />}
                  className="cursor-pointer hover:border-purple/50 transition-colors"
                />
              </a>
            ) : (
              <Input
                readOnly
                value="TikTok"
                leftElement={<TikTokIcon className="h-4.5 w-4.5 text-muted-foreground/45" />}
                className="opacity-65 cursor-not-allowed"
              />
            )}
          </div>
        </div>

        {/* Botón Editar Datos */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 flex justify-center pt-4">
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            variant="primary"
            className="w-full max-w-xs !h-14"
          >
            {t.profile.editData}
          </Button>
        </div>

      </div>

      {/* 3. SECCIÓN DE MÉTRICAS / KPIs */}
      <section className="grid grid-cols-1 gap-4 max-w-4xl mx-auto lg:hidden">
        
        {/* Proyectos */}
        <div className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-2xl p-5 shadow-sm text-left">
          <span className="ds-text-xs text-muted-foreground font-bold tracking-wider block">Proyectos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-foreground tracking-tight">
              {String(totalProjects).padStart(2, '0')}
            </span>
            <span className="text-purple ds-text-xs font-bold">
              {approvedCount} aprobados
            </span>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-2xl p-5 shadow-sm text-left">
          <span className="ds-text-xs text-muted-foreground font-bold tracking-wider block">Ingresos</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-[rgb(var(--ds-color-on-surface))] tracking-tight">
              GTQ {totalIncome.toLocaleString()}
            </span>
          </div>
        </div>

      </section>

      {/* 4. MODAL EDITAR PERFIL (DISEÑO INMERSIVO FLOATING) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left">
            
            <div className="flex justify-between items-center pb-2 border-b border-[rgb(var(--ds-color-outline-variant))]/20">
              <h3 className="ds-text-lg font-bold text-foreground">{t.profile.editData}</h3>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="w-8 h-8 rounded-full bg-[rgb(var(--ds-color-surface-container-high))] hover:bg-[rgb(var(--ds-color-surface-container-highest))] flex items-center justify-center text-foreground font-bold border-0 cursor-pointer outline-none transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="edit-email">
                  Correo Electrónico
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  required
                  leftElement={<Mail className="h-4.5 w-4.5 text-muted-foreground" />}
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="edit-phone">
                  Teléfono de Acceso
                </label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+502 0000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                  required
                  leftElement={<Phone className="h-4.5 w-4.5 text-muted-foreground" />}
                />
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="edit-instagram">
                  Usuario de Instagram
                </label>
                <Input
                  id="edit-instagram"
                  type="text"
                  placeholder="@usuario"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  disabled={isPending}
                  leftElement={<Instagram className="h-4.5 w-4.5 text-muted-foreground" />}
                />
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <label className="ds-text-sm text-muted-foreground font-semibold block" htmlFor="edit-tiktok">
                  Usuario de TikTok
                </label>
                <Input
                  id="edit-tiktok"
                  type="text"
                  placeholder="@usuario"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  disabled={isPending}
                  leftElement={<TikTokIcon className="h-4.5 w-4.5 text-muted-foreground" />}
                />
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[rgb(var(--ds-color-outline-variant))]/20">
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  variant="outline"
                  className="!h-12"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  variant="primary"
                  className="!h-12"
                >
                  Guardar
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
