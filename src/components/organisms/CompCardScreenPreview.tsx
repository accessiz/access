'use client';

import React from 'react';
import { Model } from '@/lib/types';
import { SmartCroppedImage } from '@/components/atoms/SmartCroppedImage';
import { cn, toCorsUrl } from '@/lib/utils';

interface CompCardScreenPreviewProps {
  model: Model;
  className?: string;
}

export function CompCardScreenPreview({ model, className }: CompCardScreenPreviewProps) {
  const coverUrl = model.coverUrl;
  const backPhotos = model.compCardUrls || [null, null, null, null];

  const StatRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex gap-2 sm:gap-4 items-baseline">
        <span className="text-[9px] sm:text-[13px] uppercase font-bold text-black min-w-[50px] sm:min-w-[70px]">{label}</span>
        <span className="text-[9px] sm:text-[13px] uppercase font-bold text-black">{value}</span>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col md:flex-row gap-12 md:gap-8 w-full max-w-[1280px] mx-auto items-stretch", className)}>
      {/* Front Side (Portada) */}
      <div className="flex-1 min-w-0 flex flex-col bg-white p-4 sm:p-8 shadow-xl">
        <div className="aspect-3/4 relative w-full overflow-hidden bg-[#fafafa]">
          {coverUrl ? (
            <SmartCroppedImage
              src={toCorsUrl(coverUrl)!}
              alt={`${model.alias} - Cover`}
              className="w-full h-full object-cover"
              loading="eager"
              context="display"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
              Sin Foto de Portada
            </div>
          )}
        </div>
        <div className="pt-8 pb-4 flex items-center justify-between px-2 sm:px-4 shrink-0">
          {/* Logo bottom left */}
          <div className="h-10 w-10 sm:h-16 sm:w-16 shrink-0">
            <img
              src="/images/IZ Management Dark Logo-01.svg"
              alt="IZ Management"
              className="w-full h-full object-contain"
            />
          </div>
          {/* Name bottom right */}
          <h2 className="text-xl sm:text-4xl font-bold uppercase text-black">
            {model.alias || (model.full_name?.split(' ')[0] || 'MODEL')}
          </h2>
        </div>
      </div>

      {/* Back Side (Contraportada) */}
      <div className="flex-1 min-w-0 flex flex-col bg-white p-4 sm:p-8 shadow-xl">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Slot 1: Photo (Top Left) */}
          <div className="aspect-3/4 relative overflow-hidden bg-[#fafafa]">
            {backPhotos[0] && (
              <SmartCroppedImage
                src={toCorsUrl(backPhotos[0])!}
                alt="Talent Photo 1"
                className="w-full h-full object-cover"
                loading="lazy"
                context="display"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )}
          </div>

          {/* Slot 2: Stats Info (Top Right) */}
          <div className="flex flex-col aspect-3/4 p-1 sm:p-2">
            {/* Logo top right */}
            <div className="flex justify-end h-8 sm:h-16 mb-2 sm:mb-4">
              <img
                src="/images/IZ Management Dark Logo-01.svg"
                alt="IZ Management"
                className="h-full object-contain"
              />
            </div>
            {/* Stats */}
            <div className="flex flex-col gap-0.5 sm:gap-2">
              <StatRow label="HEIGHT" value={model.height_cm ? `${model.height_cm} CM` : null} />
              <StatRow label="SHOULDERS" value={model.shoulders_cm ? `${model.shoulders_cm} CM` : null} />
              {model.gender === 'Male' && (
                <StatRow label="CHEST" value={model.chest_cm ? `${model.chest_cm} CM` : null} />
              )}
              {model.gender === 'Female' && (
                <StatRow label="BUST" value={model.bust_cm ? `${model.bust_cm} CM` : null} />
              )}
              <StatRow label="WAIST" value={model.waist_cm ? `${model.waist_cm} CM` : null} />
              <StatRow label="HIPS" value={model.hips_cm ? `${model.hips_cm} CM` : null} />
              <StatRow label="SHIRT" value={model.top_size} />
              <StatRow label="JEANS" value={model.pants_size} />
              <StatRow label="SHOES" value={model.shoe_size_us} />
            </div>
          </div>

          {/* Slot 3: Photo (Bottom Left) — uses backPhotos[2] */}
          <div className="aspect-3/4 relative overflow-hidden bg-[#fafafa]">
            {backPhotos[2] && (
              <SmartCroppedImage
                src={toCorsUrl(backPhotos[2])!}
                alt="Talent Photo 2"
                className="w-full h-full object-cover"
                loading="lazy"
                context="display"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )}
          </div>

          {/* Slot 4: Photo (Bottom Right) — uses backPhotos[3] */}
          <div className="aspect-3/4 relative overflow-hidden bg-[#fafafa]">
            {backPhotos[3] && (
              <SmartCroppedImage
                src={toCorsUrl(backPhotos[3])!}
                alt="Talent Photo 3"
                className="w-full h-full object-cover"
                loading="lazy"
                context="display"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )}
          </div>
        </div>

        {/* Footer (Back Side) */}
        <div className="pt-8 pb-4 flex justify-end shrink-0">
          <span className="text-xl sm:text-4xl font-bold uppercase text-black">
            {model.country || 'GUATEMALA'}
          </span>
        </div>
      </div>
    </div>
  );
}
