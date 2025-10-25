export function ClientFooter() {
  return (
    /* SIN padding horizontal 'px-*', solo vertical 'py-8' */
    <footer className="flex w-full flex-col items-center justify-between gap-4
                     py-8 text-xs uppercase tracking-wider text-muted-foreground
                     sm:flex-row">

      {/* Lado Izquierdo */}
      <span>
        IZ MANAGEMENT
      </span>

      {/* Lado Derecho */}
      <span className="font-mono">
        &lt;DEV&gt; SKOPOS WEB &lt;/DEV&gt;
      </span>
    </footer>
  );
}