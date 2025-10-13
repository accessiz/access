
import React from 'react';

// Este layout envuelve todas las páginas dentro de /models/*
// Garantiza que el padding, el scroll y el contenedor principal sean idénticos.
export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      {/* El contenedor principal ahora vive aquí */}
      <div className="flex-1 overflow-y-auto">
        {/* El padding se aplica aquí para ser consistente en todas las sub-páginas */}
        <div className="p-8 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}
