import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function NewProjectPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="p-8 md:p-12">
            <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Proyecto</h1>
            <p className="text-muted-foreground">
                Aquí irá el formulario para crear un nuevo proyecto.
            </p>
            {/* El formulario lo construiremos en el siguiente paso. */}
        </div>
    );
}
