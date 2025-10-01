
import { Target } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Target className="h-9 w-9 text-primary" />
          <h1 className="text-5xl font-bold tracking-tighter text-foreground">
            IZ Access
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Portal de Gestión para IZ Management.
        </p>
        <div className="mt-8">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-semibold tracking-wide">
              Iniciar Sesión
            </button>
        </div>
      </div>
    </main>
  );
}
