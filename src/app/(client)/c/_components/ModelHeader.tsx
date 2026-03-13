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
      <p className="text-label uppercase tracking-widest text-muted-foreground">
        TALENTO
      </p>
      <h1 className="mt-1 text-title sm:text-display md:text-display">
        {modelName || 'Talento Sin Asignar'}
      </h1>
    </header>
  );
}