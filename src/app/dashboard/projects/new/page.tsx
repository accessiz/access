import { ProjectForm } from '@/components/organisms/ProjectForm';

// Esta página ahora es mucho más simple.
// Su única responsabilidad es importar y renderizar el formulario.
export default function NewProjectPage() {
  return (
    <div className="p-8 md:p-12">
      <header className="pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Proyecto</h1>
      </header>
      <main className="max-w-2xl mx-auto">
        {/* ✅ CORRECCIÓN: Aquí llamamos al componente del formulario */}
        <ProjectForm />
      </main>
    </div>
  );
}

