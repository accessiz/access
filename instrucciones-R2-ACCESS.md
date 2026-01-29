# 📋 Documentación Completa: Extracción y Visualización de Fotos desde Cloudflare R2 (Optimizado)

Esta documentación describe el flujo **OPTIMIZADO** para manejar imágenes en Cloudflare R2, diseñado para **minimizar costos de CPU en Vercel** y mejorar el rendimiento global.

---

> [!IMPORTANT]
> **REGLA DE ORO:** Las imágenes deben servirse **SIEMPRE** directamente desde Cloudflare R2 (`https://cdn.tudominio.com/...`).
>
> ⛔ **NUNCA** uses un proxy (`/api/media/...`) para servir imágenes públicas. Esto consume "Fluid Active CPU" y "Fast Origin Transfer" en Vercel, elevando la factura drásticamente.

---

## 1. Variables de Entorno Requeridas

```env
# ID de la cuenta de Cloudflare (lo encuentras en el dashboard de Cloudflare)
R2_ACCOUNT_ID=tu_account_id

# Credenciales de API de R2 (se generan en Cloudflare Dashboard > R2 > Manage API Tokens)
# Permisos recomendados: "Object Read & Write"
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key

# Nombre del bucket de R2
R2_BUCKET_NAME=nombre_de_tu_bucket

# URL pública del bucket (dominio personalizado conectado en Cloudflare)
# Ejemplo: https://cdn.tusitio.com
R2_PUBLIC_URL=https://tu-dominio-publico.com
```

---

## 2. Configuración de CORS en Cloudflare (CRÍTICO)

Para que el navegador pueda acceder a las imágenes directamente (y usarlas en canvas, descargas, etc.), **DEBES** configurar CORS en tu bucket.

1.  Ve a tu **Cloudflare Dashboard** > **R2** > Selecciona tu Bucket > **Settings**.
2.  Baja hasta **CORS Policy**.
3.  Usa esta configuración (permite acceso desde cualquier origen seguro):

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 3. Configuración del Cliente S3 (AWS SDK v3)

Usado solo para **SUBIR** o **LISTAR** archivos desde el servidor. Nunca para servir.

```typescript
// src/lib/actions/storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

---

## 4. Uso en el Frontend: Generación de URLs

Para evitar errores manuales, usamos una función helper centralizada en `src/lib/utils.ts`.

### 4.1. La Función Helper

```typescript
// src/lib/utils.ts
import { R2_PUBLIC_URL } from '@/lib/constants';

export function mediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // Si ya es absoluta, devolverla tal cual
  if (url.startsWith('http')) return url;

  // Si no, prepender la URL de R2
  const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  const cleanPath = url.replace(/^\//, '');
  
  return `${baseUrl}/${cleanPath}`;
}
```

### 4.2. Uso en Componentes (React/Next.js)

```tsx
import { mediaUrl } from '@/lib/utils';

// ✅ CORRECTO: Usando el helper
<img 
  src={mediaUrl(model.cover_path)} 
  alt="Modelo" 
/>

// ✅ CORRECTO: Usando Next.js Image (requiere 'unoptimized' o configuración de remotePatterns)
<Image 
  src={mediaUrl(model.portfolio_path)} 
  alt="Portfolio"
  width={500}
  height={800}
  unoptimized // Recomendado para ahorrar costos de optimización en Vercel
/>
```

---

## 5. Subida de Archivos (Server Actions)

Al subir archivos, guarda en la base de datos solo el **path relativo**, no la URL completa. Esto facilita futuras migraciones de dominio.

```typescript
// src/lib/actions/storage.ts

export async function uploadModelImage(...) {
  // ... validaciones ...

  const fileName = `${Date.now()}-cover.webp`;
  const fullPath = `${modelId}/Portada/${fileName}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fullPath,
    Body: fileBuffer,
    ContentType: 'image/webp',
    ACL: 'public-read', // Hacer público explícitamente si el bucket no es público por defecto
  }));

  // Guardar en DB solo el path: "uuid/Portada/123.webp"
  await db.update({ cover_path: fullPath });
}
```

---

## 6. Antipatrones (LO QUE NO DEBES HACER)

### ⛔ El Proxy de Imágenes (DEPRECADO)

No uses rutas de API (`/api/media/[...path]`) para servir contenido.

*   ❌ **Mal:** `<img src="/api/media/mi-foto.webp" />`
    *   **Consecuencia:** Vercel cobra por "Function Invocation" + "Active CPU" + "Bandwidth" por CADA visualización.
*   ✅ **Bien:** `<img src="https://cdn.tusitio.com/mi-foto.webp" />`
    *   **Consecuencia:** Tráfico directo Browser -> Cloudflare. Costo para Vercel = $0.

---

## 7. Troubleshooting

### Las imágenes no cargan (403 Forbidden)
*   Verifica que el bucket tenga permisos de lectura pública o que los objetos se suban con ACL `public-read`.
*   Revisa que `R2_PUBLIC_URL` esté bien escrita en `.env`.

### Error de CORS en el navegador
*   Aparece al intentar descargar la imagen o usarla en un `<canvas>`.
*   **Solución:** Revisa la sección **2. Configuración de CORS** arriba. No intentes solucionarlo con un proxy.

### Las imágenes tardan en actualizarse
*   Cloudflare tiene cache agresivo.
*   **Solución:** Usa nombres de archivo únicos (ej: agregar timestamp `photo-17290123.webp`) al subir una nueva versión.
