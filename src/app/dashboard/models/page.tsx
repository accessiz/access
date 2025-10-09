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
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Hacemos la consulta para obtener los modelos desde Supabase, ordenados por alias
  const { data: models, error, count } = await supabase
    .from('models')
    .select('*', { count: 'exact' }) // Pedimos que nos cuente el total de filas
    .order('alias', { ascending: true }); // Ordenamos alfabéticamente por alias

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Talento</CardTitle>
          <CardDescription>
            Gestiona los perfiles de los modelos. Total: {count ?? 0}
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Añadir Talento
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alias</TableHead>
              <TableHead>Nacionalidad</TableHead>
              <TableHead className="hidden sm:table-cell">Estatura</TableHead>
              <TableHead className="hidden md:table-cell">Edad</TableHead>
              <TableHead className="hidden lg:table-cell">Instagram</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models && models.length > 0 ? (
              models.map((model: any) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.alias}</TableCell>
                  <TableCell>{model.nationality}</TableCell>
                  <TableCell className="hidden sm:table-cell">{model.height_cm ? `${model.height_cm} cm` : 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell">{calculateAge(model.birth_date)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {model.instagram ? `@${model.instagram}`: 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {error ? `Error: ${error.message}` : "No hay modelos para mostrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
