'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { captureException } from '@/lib/error-tracking';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      tags: { boundary: 'global-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="es">
      <head><title>Error — IZ Access</title></head>
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <main role="alert" className="mx-auto max-w-md space-y-6 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="text-display">Algo salió mal</h1>
          <p className="text-body text-muted-foreground">
            Ocurrió un error inesperado. Puedes intentar de nuevo o regresar al inicio.
          </p>
          {error.digest && (
            <p className="text-label text-muted-foreground">
              Código: {error.digest}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={reset} variant="outline">
              Intentar de nuevo
            </Button>
            <a
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-label text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ir al inicio
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
