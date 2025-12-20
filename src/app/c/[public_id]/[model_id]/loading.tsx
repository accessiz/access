import { Skeleton } from "@/components/ui/skeleton";
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientFooter } from '../../_components/ClientFooter';
import { ArrowLeft } from "lucide-react";

export default function ModelPortfolioLoading() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col">
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0 flex flex-col flex-1">
        
        {/* Usamos un ClientNavbar estático para el esqueleto */}
        <ClientNavbar clientName={null} />
        
        <header className="py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Botón de Regresar */}
          <div>
            <Skeleton className="h-10 w-[160px] rounded-md" />
          </div>
          
          {/* Header del Modelo (esqueleto) */}
          <div className="text-left sm:text-right w-full max-w-xs space-y-2">
            <Skeleton className="h-4 w-1/4 ml-auto" />
            <Skeleton className="h-8 w-3/4 ml-auto" />
          </div>
        </header>

        {/* Esqueleto para la imagen principal */}
        <main className="flex-1 flex items-center justify-center pb-32">
          <div className="relative w-full max-w-4xl aspect-[4/3]">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        </main>

        {/* Esqueleto para los botones de acción */}
        <footer className="sticky bottom-0 z-10 p-4 sm:p-8 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-md mx-auto flex justify-center gap-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </footer>
         
        <ClientFooter />
        
      </div>
    </div>
  );
}
