export function ClientHeader({ projectName }: { projectName: string | null }) {
  return (
    <header className="px-0 text-left">
      <p className="text-label-12 uppercase tracking-widest text-muted-foreground">
        PROYECTO
      </p>
      <h1 className="mt-1 text-heading-40 sm:text-heading-48 md:text-heading-72 uppercase">
        {projectName || 'Selección de Talento'}
      </h1>
    </header>
  );
}