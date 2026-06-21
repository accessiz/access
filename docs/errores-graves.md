# 🚨 Errores Graves — Lecciones Aprendidas

Registro de errores críticos que han causado problemas difíciles de diagnosticar.
Este documento sirve como referencia para no repetirlos.

---

## 1. Tailwind v4: Orden incorrecto de `@config` y `@import`

**Fecha:** 2026-03-04  
**Síntoma:** Página completamente en blanco. No se aplica ningún estilo de Tailwind.  
**Tiempo perdido:** ~30 min

### ❌ Error

```css
/* MAL — @config ANTES del @import */
@config "../../tailwind.config.ts";
@import "tailwindcss";
```

### ✅ Correcto

```css
/* BIEN — @import PRIMERO, luego @config */
@import "tailwindcss";
@config "../../tailwind.config.ts";
```

### Explicación

En **Tailwind v4**, los archivos JS/TS de configuración **NO se auto-detectan**.  
Se requiere la directiva `@config`, pero **debe ir DESPUÉS** de `@import "tailwindcss"`.  
El orden inverso causa un fallo silencioso donde Tailwind no genera ninguna clase CSS.

### PostCSS: No duplicar `autoprefixer`

`@tailwindcss/postcss` en v4 ya incluye `autoprefixer` internamente.  
Tenerlo por separado en `postcss.config.mjs` puede causar conflictos de procesamiento.

```js
// MAL
plugins: { "@tailwindcss/postcss": {}, autoprefixer: {} }

// BIEN
plugins: { "@tailwindcss/postcss": {} }
```

### Fuente
- [Tailwind v4 Upgrade Guide — Using a JavaScript config file](https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file)
- [Tailwind v4 PostCSS Installation](https://tailwindcss.com/docs/installation/using-postcss)

---

## 2. `AuthProvider` bloqueando render con `{!loading && children}`

**Fecha:** 2026-03-04  
**Síntoma:** Página de login aparece completamente en blanco (HTML vacío en el DOM visible). El body existe pero `<div hidden>` contiene el RSC payload sin montar.  
**Tiempo perdido:** ~20 min

### ❌ Error

```tsx
// useAuth.tsx — AuthProvider
const [loading, setLoading] = useState(true); // ← empieza true

return (
  <AuthContext.Provider value={value}>
    {!loading && children}  {/* ← BLOQUEA render hasta que getSession() resuelve */}
  </AuthContext.Provider>
);
```

**¿Por qué es grave?**

- `loading` empieza en `true` → no se renderizan children
- `children` incluye la página de login (una página **pública**)
- Si hay latencia con Supabase o problemas de red, la página se queda en blanco indefinidamente
- El error es **silencioso** — no hay errores en consola ni en el server

### ✅ Correcto

```tsx
// Siempre renderizar children
return (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);
```

Páginas protegidas manejan su propio guard (server-side redirect en `proxy.ts`).

---

## 3. Mismo `loading` para verificación inicial y sign-in activo

**Fecha:** 2026-03-04  
**Síntoma:** Formulario de login deshabilitado al cargar la página. Inputs no aceptan texto. Botón muestra "Ingresando..." sin que el usuario haya hecho nada.  
**Tiempo perdido:** Consecuencia directa del error #2

### ❌ Error

```tsx
// useAuth.tsx
const [loading, setLoading] = useState(true);

const signIn = async (...) => {
  setLoading(true);  // ← reutiliza el mismo state
  ...
};

// LoginForm.tsx
const { signIn, loading } = useAuth();
<Input disabled={loading} />  // ← deshabilitado durante verificación inicial
<Button disabled={loading}>
  {loading ? 'Ingresando...' : 'Iniciar Sesión'}  // ← muestra "Ingresando..." al cargar
</Button>
```

### ✅ Correcto

Separar en dos estados distintos:

```tsx
// useAuth.tsx
const [loading, setLoading] = useState(true);    // solo para verificación inicial
const [isSigningIn, setIsSigningIn] = useState(false);  // solo para submit del form

const signIn = async (...) => {
  setIsSigningIn(true);
  ...
};

// LoginForm.tsx
const { signIn, isSigningIn } = useAuth();
<Input disabled={isSigningIn} />
<Button disabled={isSigningIn}>
  {isSigningIn ? 'Ingresando...' : 'Iniciar Sesión'}
</Button>
```

### Regla general

> **Nunca reutilizar un solo boolean `loading` para múltiples propósitos distintos.**
> Siempre crear estados separados: `isLoading` (init), `isSubmitting` (form), `isFetching` (data), etc.

---

## 4. Next.js 16: `middleware.ts` → `proxy.ts`

**Fecha:** 2026-03-04  
**Nota preventiva** — no fue un error activo, pero es fácil de cometer.

### Regla

A partir de **Next.js 16**, el middleware se renombró a **proxy**.

- El archivo debe llamarse `proxy.ts` (no `middleware.ts`)
- Se ubica en `src/proxy.ts` (al mismo nivel que `app/`)
- La función exportada debe ser `export function proxy(...)` o `export default function proxy(...)`
- `middleware.ts` ya **no es reconocido** por Next.js 16

### Fuente
- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/getting-started/proxy)

---

## 5. `onAuthStateChange` reaccionando a TODOS los eventos (incluido `INITIAL_SESSION`)

**Fecha:** 2026-03-04  
**Síntoma:** Después de hacer login exitoso, la página se recarga pero no redirige al dashboard. El usuario queda en `/login?` sin error.  
**Tiempo perdido:** ~15 min

### ❌ Error

```tsx
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);
  router.refresh(); // ← Se ejecuta en TODOS los eventos, incluyendo INITIAL_SESSION
});
```

**¿Por qué es grave?**

- `INITIAL_SESSION` se dispara al cargar la página → causa un refresh innecesario
- `router.refresh()` recarga la ruta actual pero **no navega** al dashboard
- El server-side redirect en la login page depende de que las cookies estén sincronizadas
- Si las cookies aún no se propagaron, el redirect falla silenciosamente

### ✅ Correcto

```tsx
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);

  if (event === 'SIGNED_IN') {
    router.push('/dashboard/models');  // ← Navegación explícita
  } else if (event === 'SIGNED_OUT') {
    router.push('/login');
  } else if (event === 'TOKEN_REFRESHED') {
    router.refresh();  // ← Solo refresh cuando se refresca token
  }
});
```

### Regla general

> **Siempre filtrar los eventos de `onAuthStateChange`.**  
> Nunca ejecutar lógica de navegación en eventos genéricos como `INITIAL_SESSION`.
> Usar `router.push()` para navegación, `router.refresh()` solo para actualizar datos.

---

## 7. Error de CORS y CSP en Descarga de CompCards (html-to-image)

**Fecha:** 2026-03-12  
**Síntoma:** Error "Failed to fetch" o "Tainted Canvas" al intentar descargar la ficha técnica (CompCard). El botón se queda en "Procesando..." o lanza un toast de error de red.  
**Tiempo perdido:** ~1 hora

### ❌ Error

1.  **CSP restrictiva:** La política `connect-src` no permitía `data:`, bloqueando la conversión final de la imagen a base64.
2.  **Lienzo "manchado" (Tainted Canvas):** Usar URLs directas de R2 (`pub-xxx.r2.dev`) en el template de captura causaba que el navegador bloqueara el acceso a los píxeles por seguridad (CORS), impidiendo generar el archivo.
3.  **Proxy sin Sesión:** Intentar usar el proxy `/api/media` fallaba con error 401 porque la librería de captura pedía las imágenes de forma anónima, pero el proxy requiere las cookies de sesión de Supabase.

### ✅ Correcto

1.  **Actualizar CSP:** Añadir `data:` a `connect-src` en `src/proxy.ts`.
2.  **Estrategia Híbrida de URLs:**
    *   **Browsing:** Usar URLs públicas de R2 (directo, rápido, sin costo de CPU).
    *   **Captura:** Forzar el uso del proxy local `/api/media/...` solo en el template oculto de impresión.
3.  **Manejo de Credenciales:** En el componente de imagen (`SmartCroppedImage`), detectar si la URL es local (`/api/...`) y, de ser así, **no** usar `crossOrigin="anonymous"` para permitir que el navegador envíe las cookies de sesión.

### Regla general

> **Para descargas basadas en Canvas/HTML-to-Image:** Las imágenes DEBEN provenir del mismo origen (Proxy) para evitar problemas de CORS, y el componente de imagen debe permitir el envío de cookies si el proxy está protegido por autenticación.

---

## 8. Imágenes rotas por colisión de caché CORS (Sidebar vs. Manager)

**Fecha:** 2026-03-14  
**Síntoma:** Las portadas de los modelos se ven bien en la lista de la izquierda (miniaturas) pero aparecen **rotas** en el panel central (Manager). Al recargar la página (F5) a veces se arregla, pero vuelve a fallar aleatoriamente.  
**Tiempo perdido:** ~2 horas.

### ❌ El Error (La "Doble Identidad")

El problema es un conflicto de cómo el navegador guarda las imágenes en su memoria interna:

1.  **Sidebar (Sin permisos):** La lista de talentos carga la foto como una imagen normal. Cloudflare la entrega y el navegador la guarda en caché diciendo: *"Esta foto NO tiene permisos CORS"*.
2.  **Manager (Con permisos):** El panel central pide la **MISMA URL** pero usa `crossOrigin="anonymous"` porque necesita leer los píxeles (para el recorte/crop y descargas).
3.  **Colisión:** El navegador ve que ya tiene la foto en caché, la intenta usar, pero como la versión guardada no tiene la cabecera `Access-Control-Allow-Origin`, la bloquea por seguridad.

### ✅ La Solución (Cache-Busting para CORS)

No basta con configurar el CORS en R2. Hay que obligar al navegador a tratar la petición del Manager como algo distinto:

1.  **Utility `toCorsUrl`:** Se creó una función en `lib/utils.ts` que añade un parámetro invisible a la URL.
    ```typescript
    export function toCorsUrl(url: string) {
      return `${url}?cors=1`; // Engaña al navegador para que pida una copia fresca
    }
    ```
2.  **Uso en Componentes:** Todos los sitios que usen `crossOrigin="anonymous"` o procesen la imagen (Manager, Print Templates) deben envolver la URL con esta función.

### Regla general

> **Si una imagen se carga dos veces en la misma página con distintas necesidades de seguridad (una visual y otra para proceso/píxeles), la segunda DEBE llevar un parámetro de URL (como `?cors=1`) para evitar que el navegador use una copia de caché sin permisos.**

## 9. CSP `connect-src` sin `blob:` rompe el generador temporal de Compcards

**Fecha:** 2026-06-21  
**Síntoma:** Al presionar "Descargar Compcard" en el generador temporal (`/dashboard/compcard-generator`), aparece el toast "Error al generar la compcard". La consola muestra múltiples errores: `Fetch API cannot load blob:https://access.izmgmt.com/...` — "Refused to connect because it violates the document's Content Security Policy directive: connect-src 'self' ...".  
**Tiempo perdido:** ~15 min

### ❌ Error

```ts
// src/proxy.ts — buildCSP()
const connectSrc = [
  "'self'",
  "data:",
  // ← Falta "blob:"
  supabaseOrigin,
  ...
]
```

**¿Por qué es grave?**

- El generador temporal usa `URL.createObjectURL()` para crear URLs `blob:` de las fotos subidas por el usuario
- La librería `html-to-image` internamente usa `fetch()` para leer esas URLs `blob:` y convertirlas en data URLs para el canvas
- `blob:` ya estaba en `img-src` (para mostrar las fotos), pero **no** en `connect-src` (para fetch)
- El browser bloqueaba cada `fetch(blob:...)` → la captura fallaba en cascada → toast de error
- El preview se veía perfecto (porque `img-src` sí tenía `blob:`), lo que hacía parecer que todo estaba bien

### ✅ Correcto

```ts
// src/proxy.ts — buildCSP()
const connectSrc = [
  "'self'",
  "data:",
  "blob:",   // ← Necesario para que html-to-image pueda fetch() las imágenes blob
  supabaseOrigin,
  ...
]
```

### Diferencia con Error #7

El error #7 trataba sobre imágenes remotas de R2 (CORS + tainted canvas) en el generador de compcards **de modelos registrados**. Este error #9 es específico del generador **temporal** (cliente-side), donde las imágenes son `blob:` locales — no hay CORS involucrado, solo CSP.

### Regla general

> **Si una funcionalidad del lado del cliente usa `URL.createObjectURL()` y luego necesita `fetch()` esos blobs (como lo hacen librerías de captura HTML-to-image), `blob:` debe estar tanto en `img-src` como en `connect-src` de la CSP.**

---

*Última actualización: 2026-06-21*

---

## 6. `process.env[key]` dinámico no funciona en el client para `NEXT_PUBLIC_*`

**Fecha:** 2026-03-04  
**Síntoma:** Error en consola del browser: `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL`. El login no funciona, componentes client crashean silenciosamente, el ojo de contraseña no responde.  
**Tiempo perdido:** ~30 min (difícil de diagnosticar porque el error se captura internamente)

### ❌ Error

```ts
// env.ts
function required(key: string): string {
  const value = process.env[key]  // ← Acceso DINÁMICO — NO funciona en client
  if (!value) throw new Error(`Missing: ${key}`)
  return value
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
}
```

### ✅ Correcto

```ts
// env.ts — usar referencias ESTÁTICAS para NEXT_PUBLIC_*
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => {
    throw new Error('Missing: NEXT_PUBLIC_SUPABASE_URL')
  })(),
}
```

### Explicación

Next.js reemplaza `process.env.NEXT_PUBLIC_XXX` **en tiempo de build** con el valor literal.  
Pero `process.env[dynamicKey]` NO se reemplaza — queda como `undefined` en el browser.  
Esto solo afecta al **client bundle**. En server-side, `process.env[key]` funciona normal.

### Regla general

> **Variables `NEXT_PUBLIC_*` SIEMPRE deben referenciarse estáticamente.**  
> Usar `process.env.NEXT_PUBLIC_SUPABASE_URL`, NUNCA `process.env[key]` con key variable.

---

## 10. `crossOrigin="anonymous"` en imágenes con URL `blob:` o `data:` causa `ERR_FILE_NOT_FOUND`

**Fecha:** 2026-06-21  
**Síntoma:** Al descargar la compcard en el generador temporal, el navegador muestra errores en la consola: `GET blob:https://access.izmgmt.com/... net::ERR_FILE_NOT_FOUND` y no descarga las imágenes, o las descarga en blanco/vacías.  
**Tiempo perdido:** ~10 min

### ❌ Error

En `SmartCroppedImage.tsx` (u otros componentes de imagen nativos), se aplicaba `crossOrigin="anonymous"` de forma genérica a cualquier URL que no empezara con `/`:

```tsx
<img
  src={src}
  crossOrigin={src.startsWith('/') ? undefined : "anonymous"}
  ...
/>
```

**¿Por qué ocurre?**
Las URLs `blob:` (como las de fotos temporales locales subidas por el usuario) y `data:` no empiezan por `/`, por lo que el componente les inyectaba `crossOrigin="anonymous"`. El navegador intenta validar el CORS de estos recursos de origen cruzado de forma estricta, lo que falla en navegadores modernos (Chrome/Safari) al ser protocolos no-HTTP (`blob:`, `data:`), resultando en un error de red `net::ERR_FILE_NOT_FOUND`.

### ✅ Correcto

Evitar inyectar `crossOrigin="anonymous"` si el recurso es una URL de tipo `blob:` o `data:`:

```tsx
<img
  src={src}
  crossOrigin={
    src.startsWith('/') ||
    src.startsWith('blob:') ||
    src.startsWith('data:')
      ? undefined
      : 'anonymous'
  }
  ...
/>
```

### Regla general

> **Nunca asignar `crossOrigin="anonymous"` a elementos `<img>` cuyas fuentes sean URLs de esquema local `blob:` o data URIs `data:`. Esto confunde al motor de red del navegador y produce un fallo inmediato de carga `ERR_FILE_NOT_FOUND`.**

---

*Última actualización: 2026-06-21*
