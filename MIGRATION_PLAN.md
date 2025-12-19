# Plan de Migración: De Supabase a Firebase

Este documento evalúa la viabilidad y los pasos necesarios para migrar la plataforma NYXA de su infraestructura actual en Supabase a Firebase.

## Evaluación General de Dificultad

La migración es un **proyecto de refactorización de envergadura (dificultad 7/10)**, pero es completamente factible debido a la estructura modular de la aplicación. El principal desafío no es la complejidad de Firebase, sino la cantidad de código que necesita ser reescrito debido al cambio de un backend SQL (Supabase/Postgres) a uno NoSQL (Firebase/Firestore).

### Desglose por Área

| Área Clave | Dificultad de Migración | Justificación y Acciones Clave |
| :--- | :--- | :--- |
| **1. Autenticación** | **Media (4/10)** | - **Trabajo Requerido**: Reemplazar `@supabase/ssr` y `supabase-js` por `firebase/auth`.<br>- **Acciones**: <br>  1. Reescribir el hook `useAuth` para usar `signInWithEmailAndPassword`, `signOut`, y `onAuthStateChanged` de Firebase. <br>  2. Adaptar `middleware.ts` para verificar los tokens de sesión de Firebase en lugar de los de Supabase. <br>  3. Modificar las Server Actions para obtener el `uid` del usuario de Firebase. |
| **2. Base de Datos (Firestore)** | **Alta (9/10)** | - **Trabajo Requerido**: Migración de un modelo relacional (PostgreSQL) a uno NoSQL (Firestore). Este es el núcleo de la migración.<br>- **Acciones**: <br>  1. **Rediseñar el esquema**: Mapear tablas `models`, `projects` y `projects_models` a colecciones y subcolecciones de Firestore. <br>  2. **Reescribir CADA consulta**: Todas las funciones en `src/lib/api/*.ts` y `src/lib/actions/*.ts` que usan `.select()`, `.ilike()`, `.or()`, etc., deben ser reescritas con `getDoc`, `getDocs`, `query`, y `where` de Firestore. <br>  3. **Reemplazar Búsqueda FTS**: Firestore no tiene búsqueda de texto completo nativa. Se deberá reemplazar la función `textSearch` por una solución externa (ej. Algolia, Typesense) o una estrategia de indexación manual en Firestore (más limitada). |
| **3. Almacenamiento de Archivos** | **Baja (2/10)** | - **Trabajo Requerido**: Reemplazar el SDK de R2/S3 por el de Firebase Storage.<br>- **Acciones**: <br>  1. Actualizar `src/lib/storage.ts` para usar el SDK de Firebase Storage (`getStorage`, `ref`, `uploadBytes`). <br>  2. Las URLs generadas serán de Firebase, pero el resto de la aplicación debería consumirlas sin problema. |
| **4. Scripts de Mantenimiento** | **Media (6/10)** | - **Trabajo Requerido**: Portar los scripts de Node.js a un entorno que pueda usar el Firebase Admin SDK.<br>- **Acciones**: <br>  1. Reemplazar `supabase-js` con `firebase-admin` en los scripts de la carpeta `/scripts`. <br>  2. Adaptar la lógica para leer/escribir en Firestore en lugar de Supabase. |

## Hoja de Ruta Sugerida para la Migración

### Fase 1: Configuración y Autenticación (El "esqueleto")

1.  **Instalar Firebase**: Añadir la dependencia `firebase` al `package.json`.
2.  **Configurar Cliente Firebase**: Crear archivos de configuración (`src/lib/firebase/client.ts`, `src/lib/firebase/server.ts`) para inicializar la app de Firebase.
3.  **Migrar Autenticación**:
    *   Reescribir completamente el hook `src/hooks/useAuth.tsx` para que funcione con Firebase Auth.
    *   Actualizar `src/app/login/page.tsx` para que llame a la nueva función `signIn` del hook.
    *   Adaptar `src/middleware.ts` para que valide las cookies de sesión de Firebase.
4.  **Verificación**: En este punto, el login y logout deberían funcionar, y las rutas protegidas del dashboard deberían ser inaccesibles sin sesión.

### Fase 2: Migración de la Base de Datos (El "corazón")

1.  **Diseño de Esquema Firestore**:
    *   `users/{userId}` (si necesitas perfiles de usuario)
    *   `models/{modelId}` (colección principal para talentos)
    *   `projects/{projectId}` (colección principal para proyectos)
    *   `projects/{projectId}/models/{modelId}` (subcolección para la relación, almacenando el `client_selection`).
2.  **Reescritura de Consultas (API y Actions)**:
    *   Empezar por las funciones más simples, como `getProjectById` o `getModelById`, reescribiéndolas con `getDoc`.
    *   Abordar las listas (`getProjectsForUser`, `getModelsForProject`) usando `getDocs` y `query`.
    *   Finalmente, atacar la función más compleja, `getModelsEnriched`, decidiendo la estrategia para la búsqueda y filtros.

### Fase 3: Migración del Almacenamiento y Scripts

1.  **Reescribir `storage.ts`**: Implementar la lógica de subida de archivos con el SDK de Firebase Storage.
2.  **Actualizar `CompCardManager`**: Asegurarse de que el componente llama a la nueva lógica de subida y maneja las URLs de Firebase Storage.
3.  **Portar Scripts**: Uno por uno, reescribir los scripts en la carpeta `/scripts` para que utilicen `firebase-admin` y se comuniquen con Firestore.

## Conclusión

Migrar a Firebase es un proyecto de refactorización importante, no una tarea trivial. Sin embargo, la estructura actual de tu código, que separa bien la lógica de UI, las acciones de servidor y las llamadas a la API, facilita enormemente el proceso. Podrás abordar la migración de forma modular, área por área, empezando por la autenticación.
