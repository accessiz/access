'use client';

import * as React from 'react';
import { Instagram, Edit2, Check, X, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { useProfileDetails } from './profile-details.logic';
import { ProfileDetailsProps } from './profile-details.types';
import { toPublicUrl, toTitleCase } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import './profile-details.styles.css';

// SVG simple para TikTok ya que lucide-react no lo incluye por defecto
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

export function ProfileDetails({ model, className }: ProfileDetailsProps) {
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

  const coverUrl = React.useMemo(() => {
    return toPublicUrl(model.cover_path);
  }, [model.cover_path]);

  return (
    <Card className={`bg-card border border-border rounded-[24px] p-5 shadow-lg space-y-5 flex flex-col justify-between ${className || ''}`}>
      <CardContent className="p-0 space-y-5 flex-grow flex flex-col justify-between">
        
        {/* Avatar, nombre y alias */}
        <div className="text-center">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border border-border bg-background mx-auto flex items-center justify-center mb-3 shadow-inner">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={model.full_name || 'Avatar'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-display font-semibold text-muted-foreground bg-tertiary">
                {(model.alias || model.full_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-base font-extrabold text-foreground">{toTitleCase(model.full_name)}</h3>
          {model.alias && (
            <span className="block text-[9px] text-muted-foreground font-extrabold uppercase tracking-widest mt-1">
              ALIAS: {model.alias.toUpperCase()}
            </span>
          )}
        </div>

        {/* Datos detallados al estilo Mockup */}
        <div className="space-y-2.5 text-left">
          <div className="p-3 bg-background rounded-xl border border-border/40 flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Correo Electrónico</span>
              <span className="text-xs font-semibold text-foreground mt-0.5 block truncate select-all">{model.email || 'No especificado'}</span>
            </div>
          </div>

          <div className="p-3 bg-background rounded-xl border border-border/40 flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Teléfono de Acceso</span>
              <span className="text-xs font-semibold text-foreground mt-0.5 block truncate select-all">{model.phone_e164 || 'No especificado'}</span>
            </div>
          </div>

          <div className="p-3 bg-background rounded-xl border border-border/40 flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Ubicación</span>
              <span className="text-xs font-semibold text-foreground mt-0.5 block">{toTitleCase(model.country || 'Guatemala')}</span>
            </div>
          </div>
        </div>

        {/* Enlaces a Redes e Instagram/TikTok y Edición */}
        {!isEditing ? (
          <div className="space-y-2 pt-3 border-t border-border/40 text-left">
            {model.instagram ? (
              <a
                href={`https://instagram.com/${model.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-tertiary hover:bg-hover-overlay/10 border border-border text-foreground text-xs font-semibold transition-colors w-full"
              >
                <span className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-rose-500" /> Instagram
                </span>
                <span className="text-xs text-muted-foreground">@{model.instagram.replace('@', '').toLowerCase()}</span>
              </a>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-tertiary/40 border border-border/40 text-muted-foreground/60 text-xs font-semibold w-full">
                <span className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 opacity-50" /> Instagram
                </span>
                <span className="text-xs">No definido</span>
              </div>
            )}

            {model.tiktok ? (
              <a
                href={`https://tiktok.com/@${model.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-tertiary hover:bg-hover-overlay/10 border border-border text-foreground text-xs font-semibold transition-colors w-full"
              >
                <span className="flex items-center gap-2">
                  <TikTokIcon className="h-4 w-4 text-foreground dark:text-white" /> TikTok
                </span>
                <span className="text-xs text-muted-foreground">@{model.tiktok.replace('@', '').toLowerCase()}</span>
              </a>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-tertiary/40 border border-border/40 text-muted-foreground/60 text-xs font-semibold w-full">
                <span className="flex items-center gap-2">
                  <TikTokIcon className="h-4 w-4 opacity-50" /> TikTok
                </span>
                <span className="text-xs">No definido</span>
              </div>
            )}

            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full mt-2 py-2.5 bg-[#f4f4f6] text-[#18181b] hover:bg-purple hover:text-white rounded-full text-xs font-bold transition-all border-0 cursor-pointer shadow-sm"
            >
              Editar Datos
            </button>
          </div>
        ) : (
          <div className="edit-form-container mt-3 pt-4 border-t border-border/40 text-left">
            <h3 className="text-label font-extrabold uppercase tracking-widest mb-4 text-foreground">
              Editar Datos de Contacto
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4">
                
                {/* Email Input */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-email" className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <input
                      id="edit-email"
                      type="email"
                      placeholder="usuario@dominio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3 pl-10 pr-4 text-foreground text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone" className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                    Teléfono (incluir +502, +52, etc.)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <input
                      id="edit-phone"
                      type="tel"
                      placeholder="Ej: +502 5544 3322"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3 pl-10 pr-4 text-foreground text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Instagram Input */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-instagram" className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                    Usuario de Instagram
                  </Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <input
                      id="edit-instagram"
                      type="text"
                      placeholder="usuario_ig"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3 pl-10 pr-4 text-foreground text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* TikTok Input */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-tiktok" className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                    Usuario de TikTok
                  </Label>
                  <div className="relative">
                    <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <input
                      id="edit-tiktok"
                      type="text"
                      placeholder="usuario_tiktok"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-background border border-border focus:ring-2 focus:ring-purple/20 rounded-xl py-3 pl-10 pr-4 text-foreground text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="bg-tertiary text-foreground hover:bg-hover-overlay rounded-full py-2 px-5 text-xs font-bold border-0 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#f4f4f6] text-[#18181b] hover:bg-purple hover:text-white rounded-full py-2 px-5 text-xs font-bold border-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
