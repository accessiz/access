import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Proyectos Activos</CardTitle>
            <CardDescription>
              Resumen de los castings que requieren tu atención.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Aquí se mostrarán los proyectos activos.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas actualizaciones en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Aquí se mostrará un feed de actividad.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Búsqueda Rápida</CardTitle>
            <CardDescription>
              Encuentra un talento al instante.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Aquí irá el widget de búsqueda rápida.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
