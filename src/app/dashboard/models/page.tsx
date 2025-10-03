import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Esta es una página de servidor (Server Component) y es asíncrona
export default async function ModelsPage() {
  // 1. Usamos el nuevo cliente de servidor para verificar la sesión
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. Si no hay sesión, redirigimos al login
  if (!session) {
    redirect('/login');
  }

  // 3. (Opcional) Hacemos una consulta para obtener los modelos desde Supabase
  // Asegúrate de que tu tabla se llame 'models' y el RLS esté configurado
  const { data: models, error } = await supabase.from('models').select('*');

  // 4. Devolvemos el JSX que renderizará la página
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Modelos</CardTitle>
          <CardDescription>
            Gestiona los perfiles de los modelos de la agencia.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Añadir Modelo
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Altura</TableHead>
              <TableHead className="hidden md:table-cell">Instagram</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models && models.length > 0 ? (
              models.map((model: any) => ( // Tipar 'model' adecuadamente si es posible
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>{model.alias}</TableCell>
                  <TableCell>{model.height_cm} cm</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {model.instagram_handle}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No hay modelos para mostrar.
                </TableCell>
              </TableRow>
            )}
             {error && (
               <TableRow>
                <TableCell colSpan={4} className="text-center text-destructive">
                  Error al cargar los modelos: {error.message}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}