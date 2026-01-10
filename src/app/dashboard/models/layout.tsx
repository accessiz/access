
import React from 'react';

// Este layout envuelve todas las páginas dentro de /models/*
// Garantiza que el padding, el scroll y el contenedor principal sean idénticos.
export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* El padding lo controla /dashboard/layout.tsx (single source of truth: p-6) */}
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
