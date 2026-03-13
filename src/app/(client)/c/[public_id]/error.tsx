'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/error-tracking';

export default function ClientPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      tags: { boundary: 'client-portal-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground p-4">
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h2 className="text-title">No se pudo cargar</h2>
        <p className="text-body text-muted-foreground">
          Ocurrió un error al cargar el proyecto. Intenta recargar la página.
        </p>
        {error.digest && (
          <p className="text-label text-muted-foreground/50">
            Ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
