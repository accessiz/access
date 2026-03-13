'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { captureException } from '@/lib/error-tracking';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      tags: { boundary: 'dashboard-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-title">Algo salió mal</h2>
        <p className="text-body text-muted-foreground">
          Ocurrió un error al cargar esta sección. Puedes intentar de nuevo.
        </p>
        {error.digest && (
          <p className="text-label text-muted-foreground/50">
            Código: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} variant="outline" size="sm">
            Intentar de nuevo
          </Button>
          <Button onClick={() => (window.location.href = '/dashboard')} size="sm">
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
