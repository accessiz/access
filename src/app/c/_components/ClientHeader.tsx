export function ClientHeader({ projectName }: { projectName: string | null }) {
  return (
    <header className="px-0 text-left">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        PROYECTO
      </p>
      <h1 className="mt-1 text-4xl font-bold tracking-tight uppercase sm:text-5xl md:text-7xl">
        {projectName || 'Selección de Talento'}
      </h1>
    </header>
  );
}