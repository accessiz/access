// TODO: Implementar la página de detalle del proyecto.

// 1. Convertimos el componente en una función asíncrona (async)
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. Esperamos a que la promesa de 'params' se resuelva para obtener el 'id'
  const { id } = await params;

  return (
    <div className="p-8 md:p-12">
      <header className="pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">Detalle del Proyecto</h1>
        {/* 3. Usamos el 'id' ya resuelto */}
        <p className="text-muted-foreground">ID del Proyecto: {id}</p>
      </header>
      <main className="py-8">
        <p>Aquí se mostrará la información detallada del proyecto, la selección de talentos y otras opciones.</p>
      </main>
    </div>
  );
}

