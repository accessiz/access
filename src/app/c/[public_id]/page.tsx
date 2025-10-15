// Esta será la página pública que verá el cliente.
// La ruta `c` es de "casting" o "cliente".
// [public_id] será el identificador corto y único que creamos en la base de datos.

export default function ClientViewPage({ params }: { params: { public_id: string } }) {
    return (
        <div>
            <h1>Vista para el cliente del proyecto: {params.public_id}</h1>
            <p>
                Aquí irá el slider de selección de modelos.
                Primero pediremos la contraseña.
            </p>
        </div>
    );
}
