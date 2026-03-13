'use client';

import React from 'react';
import { Model } from '@/lib/types';
import { SmartCroppedImage } from '@/components/atoms/SmartCroppedImage';
import { cn } from '@/lib/utils';

interface CompCardScreenPreviewProps {
  model: Model;
  className?: string;
}

export function CompCardScreenPreview({ model, className }: CompCardScreenPreviewProps) {
  const coverUrl = model.coverUrl;
  const backPhotos = model.compCardUrls || [null, null, null, null];

  const StatRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex gap-4 items-baseline">
        <span className="text-[11px] sm:text-[13px] uppercase font-bold text-black min-w-[70px]">{label}</span>
        <span className="text-[11px] sm:text-[13px] uppercase font-bold text-black">{value}</span>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-row gap-4 sm:gap-8 w-full max-w-[1280px] mx-auto items-stretch bg-white p-2 sm:p-8 shadow-2xl overflow-x-auto", className)}>
      {/* Front Side (Portada) */}
      <div className="flex-1 min-w-0 flex flex-col bg-white">
        <div className="aspect-[3/4] relative w-full overflow-hidden bg-[#fafafa]">
          {coverUrl ? (
            <SmartCroppedImage
              src={coverUrl}
              alt={`${model.alias} - Cover`}
              className="w-full h-full object-cover"
              loading="eager"
              context="display"
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
              Sin Foto de Portada
            </div>
          )}
        </div>
        <div className="pt-8 pb-4 flex items-center relative h-20 sm:h-28">
          {/* Logo bottom left */}
          <div className="h-10 w-10 sm:h-16 sm:w-16 shrink-0 ml-2">
            <img
              src="/images/IZ Management Dark Logo-01.svg"
              alt="IZ Management"
              className="w-full h-full object-contain"
            />
          </div>
          {/* Name centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-xl sm:text-4xl font-bold uppercase text-black pointer-events-auto">
              {model.alias || (model.full_name?.split(' ')[0] || 'MODEL')}
            </h2>
          </div>
        </div>
      </div>

      {/* Back Side (Contraportada) */}
      <div className="flex-1 min-w-0 flex flex-col bg-white">
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Slot 1: Photo (Top Left) */}
          <div className="aspect-[3/4] relative overflow-hidden bg-[#fafafa]">
            {backPhotos[0] && (
              <SmartCroppedImage
                src={backPhotos[0]}
                alt="Talent Photo 1"
                className="w-full h-full object-cover"
                loading="lazy"
                context="display"
                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
              />
            )}
          </div>

          {/* Slot 2: Stats Info (Top Right) */}
          <div className="flex flex-col justify-between aspect-[3/4] p-2">
            {/* Logo top right */}
            <div className="flex justify-end h-10 sm:h-16 pr-2">
              <img
                src="/images/IZ Management Dark Logo-01.svg"
                alt="IZ Management"
                className="h-full object-contain"
              />
            </div>
            {/* Stats centered vertically or near bottom */}
            <div className="flex flex-col gap-1 sm:gap-2 mb-4">
              <StatRow label="HEIGHT" value={model.height_cm ? `${model.height_cm} CM` : null} />
              <StatRow label="CHEST" value={model.gender === 'Male' ? (model.chest_cm ? `${model.chest_cm} CM` : (model.bust_cm ? `${model.bust_cm} CM` : null)) : (model.bust_cm ? `${model.bust_cm} CM` : null)} />
              <StatRow label="WAIST" value={model.waist_cm ? `${model.waist_cm} CM` : null} />
              <StatRow label="HIPS" value={model.hips_cm ? `${model.hips_cm} CM` : null} />
              <StatRow label="EYES" value={model.eye_color} />
              <StatRow label="HAIR" value={model.hair_color} />
              <StatRow label="SHIRT" value={model.top_size} />
              <StatRow label="JEANS" value={model.pants_size} />
              <StatRow label="SHOES" value={model.shoe_size_us} />
            </div>
          </div>

          {/* Slot 3: Photo (Bottom Left) */}
          <div className="aspect-[3/4] relative overflow-hidden bg-[#fafafa]">
            {backPhotos[2] && (
              <SmartCroppedImage
                src={backPhotos[2]}
                alt="Talent Photo 2"
                className="w-full h-full object-cover"
                loading="lazy"
                context="display"
                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
              />
            )}
          </div>

          {/* Slot 4: Photo (Bottom Right) */}
          <div className="aspect-[3/4] relative overflow-hidden bg-[#fafafa]">
            {backPhotos[3] && (
              <SmartCroppedImage
                src={backPhotos[3]}
                alt="Talent Photo 3"
                className="w-full h-full object-cover"
                loading="lazy"
                context="display"
                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
              />
            )}
          </div>
        </div>

        {/* Footer (Back Side) */}
        <div className="pt-8 pb-4 flex justify-end h-20 sm:h-28 pr-2">
          <span className="text-xl sm:text-4xl font-bold uppercase text-black">
            {model.country || 'GUATEMALA'}
          </span>
        </div>
      </div>
    </div>
  );
}
