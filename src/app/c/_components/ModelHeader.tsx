// src/app/c/_components/ModelHeader.tsx

interface ModelHeaderProps {
  modelName: string | null;
}

/**
 * Un componente de encabezado simple y responsivo para mostrar
 * el nombre del talento en la vista de portafolio.
 */
export function ModelHeader({ modelName }: ModelHeaderProps) {
  return (
    <header className="px-0 text-left">
      {/* Etiqueta "TALENTO"
        - text-xs: El tamaño de fuente más pequeño de Tailwind.
        - text-muted-foreground: El color grisáceo de tus variables globales.
      */}
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        TALENTO
      </p>
      
      {/* Nombre del Modelo (Responsivo)
        - text-xl: Tamaño base para móviles.
        - sm:text-2xl: Crece en pantallas pequeñas (landscape).
        - md:text-3xl: Crece más en tablets y escritorio.
      */}
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
        {modelName || 'Talento Sin Asignar'}
      </h1>
    </header>
  );
}