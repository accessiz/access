"use client";
import React from 'react';

interface InfoFooterProps {
    time: string;
}

// ✅ ARCHIVO COMPLETAMENTE ACTUALIZADO
const InfoFooter = ({ time }: InfoFooterProps) => {
  return (
    // Por defecto (móvil): 2 columnas. Tiempo a la izquierda, Skopos a la derecha.
    // En pantallas 'sm' (escritorio): 3 columnas. Se re-activa la ubicación en el centro.
    <div className="grid grid-cols-2 sm:grid-cols-3 w-full text-label uppercase">
      
      {/* Columna 1: Tiempo (siempre visible) */}
      <span className="justify-self-start">
        {time}
      </span>
      
      {/* Columna 2: Ubicación (Oculta en móvil, visible en 'sm' y centrada) */}
      <span className="hidden sm:inline justify-self-center">
        Villa Nueva, Guatemala
      </span>
      
      {/* Columna 3: Skopos (siempre visible, al final) */}
      <span className="justify-self-end">
        Developed by Skopos
      </span>
      
    </div>
  );
};

export default InfoFooter;