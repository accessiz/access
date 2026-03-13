export function ClientFooter() {
  return (
    /* SIN padding horizontal 'px-*', solo vertical 'py-8' */
    <footer className="flex w-full flex-col items-center justify-between gap-4
                     py-8 text-label uppercase tracking-wider text-muted-foreground
                     sm:flex-row">

      {/* Lado Izquierdo */}
      <span>
        IZ MANAGEMENT
      </span>

      {/* Lado Derecho */}
      <a
        href="https://wa.me/50249644467"
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono hover:text-foreground transition-colors cursor-pointer"
      >
        &lt;DEV&gt; SKOPOS WEB &lt;/DEV&gt;
      </a>
    </footer>
  );
}