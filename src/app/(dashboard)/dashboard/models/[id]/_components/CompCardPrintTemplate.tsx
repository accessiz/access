'use client';

import React from 'react';
import { Model } from '@/lib/types';
import { SmartCroppedImage } from '@/components/atoms/SmartCroppedImage';

// Dimensiones exactas de la ficha técnica (11 x 8.5 pulgadas a 300 DPI)
const PAGE_WIDTH = 3300;
const PAGE_HEIGHT = 2550;
const GAP_SIZE = 72; // Gap interno entre elementos de cada columna
const PADDING_SIZE = 72;

interface Props {
    model: Model & {
        coverUrl?: string | null;
        compCardUrls?: (string | null)[];
    };
    containerId: string;
}

export function CompCardPrintTemplate({ model, containerId }: Props) {
    const coverUrl = model.coverUrl;
    const backPhotos = model.compCardUrls || [null, null, null, null];

    const StatRow = ({ label, value }: { label: string, value: string | number | null | undefined }) => {
        if (!value) return null;
        return (
            <div style={{ display: 'contents' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '36px', lineHeight: '160%', textTransform: 'uppercase' }}>
                    {label}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '36px', lineHeight: '160%', textTransform: 'uppercase' }}>
                    {value}
                </div>
            </div>
        );
    };

    return (
        <div
            id={containerId}
            style={{
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                gap: 0,
                backgroundColor: 'rgb(255, 255, 255)', // --card (modo claro)
                display: 'flex',
                flexDirection: 'row',
                boxSizing: 'border-box',
                color: 'rgb(20, 20, 20)', // --foreground (modo claro)
                fontFamily: 'Inter, sans-serif', // Usar Inter como fuente principal
                visibility: 'visible',
            }}
        >

            {/* --- COLUMNA 1 (IZQUIERDA - PORTADA) --- */}
            <div
                id={`${containerId}-front`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: GAP_SIZE, height: '100%', backgroundColor: 'rgb(255, 255, 255)', visibility: 'visible', padding: PADDING_SIZE, boxSizing: 'border-box' }}
            >

                {/* Foto Principal */}
                <div style={{ flex: 1, width: '100%', position: 'relative', backgroundColor: 'rgb(242, 242, 242)', overflow: 'hidden' }}>
                    {coverUrl && (
                        <SmartCroppedImage
                            src={coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            loading="eager"
                            native
                            context="print"
                            disableAnimation
                        />
                    )}
                </div>

                {/* Footer Columna 1 */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '200px', flexShrink: 0 }}>

                    {/* Logo Box 200x200 */}
                    <div style={{ width: 200, height: 200, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src="/images/IZ Management Dark Logo-01.svg"
                            alt="IZ Management"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>

                    {/* Nombre 88px Bold */}
                    {/* ----------------------------------------------------------- */}
                    {/* CORRECCIÓN #2: Usar Alias en lugar de Full Name.            */}
                    {/* Se usa el operador '??' para fallback por si no tiene alias */}
                    {/* ----------------------------------------------------------- */}
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '88px', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap' }}>
                        {model.alias ?? model.full_name}
                    </div>
                </div>

            </div>

            {/* --- COLUMNA 2 (DERECHA - CONTRAPORTADA) --- */}
            <div
                id={`${containerId}-back`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: GAP_SIZE, height: '100%', backgroundColor: 'rgb(255, 255, 255)', visibility: 'visible', padding: PADDING_SIZE, boxSizing: 'border-box' }}
            >

                {/* Grid Area */}
                <div style={{ width: '100%', height: '2134px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: GAP_SIZE }}>

                    {/* ----------------------------------------------------------- */}
                    {/* CORRECCIÓN #3: CAMBIO DE POSICIONES                         */}
                    {/* El orden en el código determina la posición en el grid.     */}
                    {/* ITEM 1 ahora es FOTO 1 (Izquierda)                          */}
                    {/* ITEM 2 ahora es INFO PANEL (Derecha)                        */}
                    {/* ----------------------------------------------------------- */}

                    {/* NUEVO ITEM 1: FOTO 1 (Antes estaba en la posición 2) */}
                    <div style={{ backgroundColor: 'rgb(242, 242, 242)', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        {backPhotos[0] && <SmartCroppedImage src={backPhotos[0]} alt="P1" className="w-full h-full object-cover" loading="eager" native context="print" disableAnimation />}
                    </div>

                    {/* NUEVO ITEM 2: INFO PANEL (Antes estaba en la posición 1) */}
                    <div style={{ backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                        {/* Header Info (Logo pequeño) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <div style={{ width: 200, height: 200, transform: 'scale(0.8)', transformOrigin: 'top right' }}>
                                <img
                                    src="/images/IZ Management Dark Logo-01.svg"
                                    alt="IZ Management"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        </div>

                        {/* Stats List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '40px', rowGap: '16px', alignContent: 'end', height: '100%' }}>
                            <StatRow label="Height" value={model.height_cm ? `${model.height_cm} CM` : null} />
                            <StatRow label="Chest" value={model.chest_cm ? `${model.chest_cm} CM` : (model.bust_cm ? `${model.bust_cm} CM` : null)} />
                            <StatRow label="Waist" value={model.waist_cm ? `${model.waist_cm} CM` : null} />
                            <StatRow label="Hips" value={model.hips_cm ? `${model.hips_cm} CM` : null} />
                            <StatRow label="Eyes" value={model.eye_color} />
                            <StatRow label="Hair" value={model.hair_color} />
                            <StatRow label="Shirt" value={model.top_size} />
                            <StatRow label="Jeans" value={model.pants_size} />
                            <StatRow label="Shoes" value={model.shoe_size_us} />
                        </div>
                    </div>

                    {/* ITEM 3: FOTO 2 (Abajo Izquierda) */}
                    <div style={{ backgroundColor: 'rgb(242, 242, 242)', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        {backPhotos[2] && <SmartCroppedImage src={backPhotos[2]} alt="P2" className="w-full h-full object-cover" loading="eager" native context="print" disableAnimation />}
                    </div>

                    {/* ITEM 4: FOTO 3 (Abajo Derecha) */}
                    <div style={{ backgroundColor: 'rgb(242, 242, 242)', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        {backPhotos[3] && <SmartCroppedImage src={backPhotos[3]} alt="P3" className="w-full h-full object-cover" loading="eager" native context="print" disableAnimation />}
                    </div>

                </div>

                {/* Footer Columna 2 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '200px', flexShrink: 0, visibility: 'visible' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '80px', textTransform: 'uppercase', textAlign: 'right', lineHeight: 1, visibility: 'visible' }}>
                        {model.country || 'GUATEMALA'}
                    </div>
                </div>

            </div>

        </div>
    );
}