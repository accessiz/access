# 📋 Documentación Completa: Extracción y Visualización de Fotos desde Cloudflare R2

## 1. Variables de Entorno Requeridas

```env
# ID de la cuenta de Cloudflare (lo encuentras en el dashboard de Cloudflare)
R2_ACCOUNT_ID=tu_account_id

# Credenciales de API de R2 (se generan en Cloudflare Dashboard > R2 > Manage API Tokens)
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key

# Nombre del bucket de R2
R2_BUCKET_NAME=nombre_de_tu_bucket

# URL pública del bucket (dominio personalizado o subdomain de R2)
R2_PUBLIC_URL=https://tu-dominio-publico.com
```

---

## 2. Configuración del Cliente S3 (AWS SDK v3)

```typescript
// src/lib/actions/storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
```

---

## 3. Constantes Públicas (para el cliente)

```typescript
// src/lib/constants.ts
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
```

> ⚠️ **IMPORTANTE**: `R2_PUBLIC_URL` debe estar disponible en el cliente, por lo que debe ser prefijado con `NEXT_PUBLIC_` si lo usas directamente en componentes del cliente. En este proyecto, se usa principalmente en Server Components y Server Actions.

---

## 4. Función Helper para Construir URLs Públicas

```typescript
// src/lib/api/models.ts
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';

const toPublicUrl = (path: string | null | undefined): string | null => {
  if (!path || !R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${path}`;
};
```

---

## 5. Subida de Archivos a R2

```typescript
// src/lib/actions/storage.ts
export async function uploadModelImage(formData: FormData) {
  // 1. Validar usuario autenticado
  // 2. Validar datos del formulario con Zod
  
  const { file, modelId, category, slotIndex } = validation.data;
  
  // 3. Crear nombre único con timestamp (para cache busting)
  const timestamp = Date.now();
  let fileName = `${timestamp}-cover.webp`;
  const fullPath = `${modelId}/${category}/${fileName}`;
  
  // 4. Convertir archivo a Buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // 5. Subir a R2
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fullPath,          // Ej: "uuid/Portada/1704153600000-cover.webp"
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read',     // ⚠️ Hace el archivo público
  }));
  
  // 6. Guardar el path en Supabase (NO la URL completa)
  await supabaseAdmin.from('models').update({ cover_path: fullPath }).eq('id', modelId);
  
  // 7. Construir y retornar URL pública
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;
  return { success: true, path: fullPath, publicUrl };
}
```

---

## 6. Búsqueda Dinámica de Archivos en R2

Cuando no conoces el nombre exacto del archivo:

```typescript
// src/lib/actions/storage.ts
export async function getFirstFileInFolder(
  modelId: string, 
  category: 'Portada' | 'Portfolio' | 'Contraportada'
): Promise<string | null> {
  const prefix = `${modelId}/${category}/`;
  
  const listCommand = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: 10,
  });
  
  const listedObjects = await r2.send(listCommand);
  
  if (listedObjects.Contents && listedObjects.Contents.length > 0) {
    // Ordenar por fecha de modificación (más reciente primero)
    const sortedObjects = listedObjects.Contents
      .filter(obj => obj.Key && !obj.Key.endsWith('/'))
      .sort((a, b) => {
        const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
        const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
        return dateB - dateA;
      });
    
    if (sortedObjects.length > 0 && sortedObjects[0].Key) {
      return sortedObjects[0].Key;  // Retorna el path del archivo más reciente
    }
  }
  
  return null;
}
```

---

## 7. Obtener Modelo con URLs de Imágenes

```typescript
// src/lib/api/models.ts
export async function getModelById(id: string) {
  const supabase = await createClient();
  
  // 1. Obtener datos del modelo de Supabase
  const { data: model } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .single();
  
  // 2. Buscar archivos en R2 dinámicamente
  const { getFirstFileInFolder } = await import('@/lib/actions/storage');
  const finalCoverPath = await getFirstFileInFolder(id, 'Portada');
  const finalPortfolioPath = model.portfolio_path || await getFirstFileInFolder(id, 'Portfolio');
  
  // 3. Construir URLs públicas
  const coverUrl = toPublicUrl(finalCoverPath);       // https://cdn.ejemplo.com/uuid/Portada/timestamp-cover.webp
  const portfolioUrl = toPublicUrl(finalPortfolioPath);
  
  return {
    ...model,
    cover_path: finalCoverPath,
    coverUrl,
    portfolioUrl,
  };
}
```

---

## 8. Proxy de Imágenes (Opcional - Para CORS)

Si tienes problemas de CORS, puedes crear un proxy:

```typescript
// src/app/api/media/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  const path = params.path.join('/');
  
  const r2BaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  const r2Url = `${r2BaseUrl}/${path}`;
  
  const response = await fetch(r2Url);
  
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  return new NextResponse(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
```

**Uso del proxy**:
```
/api/media/uuid/Portada/timestamp-cover.webp
```

---

## 9. Consumo en Componentes React

```tsx
// Ejemplo en un componente
import { R2_PUBLIC_URL } from '@/lib/constants';

// Opción A: Usando la URL construida desde el servidor
<img src={model.coverUrl} alt={model.alias} />

// Opción B: Construyendo la URL con fallback
<img src={model.coverUrl || `${R2_PUBLIC_URL}/${model.id}/Portada/cover.webp`} />

// Opción C: Usando el path directamente
<img src={`${R2_PUBLIC_URL}/${model.cover_path}`} />
```

---

## 10. Estructura de Archivos en R2

```
bucket/
├── {model_id}/
│   ├── Portada/
│   │   └── {timestamp}-cover.webp
│   ├── Portfolio/
│   │   └── {timestamp}-portfolio.webp
│   └── Contraportada/
│       ├── {timestamp}-comp_0.webp
│       ├── {timestamp}-comp_1.webp
│       └── ...
```

---

## 11. Dependencias npm Requeridas

```json
{
  "@aws-sdk/client-s3": "^3.x.x"
}
```

Instalar con:
```bash
npm install @aws-sdk/client-s3
```

---

## 📊 Resumen del Flujo Completo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│  Supabase   │────▶│     R2      │
│  (Browser)  │     │   (paths)   │     │  (archivos) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │                    ▼                    │
      │            cover_path: "uuid/          │
      │            Portada/123-cover.webp"     │
      │                    │                    │
      └────────────────────┼────────────────────┘
                           ▼
              URL Final: R2_PUBLIC_URL + cover_path
              https://cdn.ejemplo.com/uuid/Portada/123-cover.webp
```

---

## 🔧 Troubleshooting

### Las imágenes no se muestran

1. **Verificar que `R2_PUBLIC_URL` esté definido** en las variables de entorno
2. **Verificar que el bucket tenga acceso público** habilitado en Cloudflare
3. **Verificar que el archivo exista** en R2 con el path correcto
4. **Revisar la consola del navegador** para errores de CORS

### Errores de CORS

- Usar el proxy `/api/media/[...path]` en lugar de la URL directa de R2
- O configurar reglas CORS en el bucket de Cloudflare R2

### Cache no se actualiza

- Los archivos usan timestamp en el nombre (`1704153600000-cover.webp`)
- Esto asegura que cada nueva versión tenga una URL única
- El header `Cache-Control: immutable` permite cachear agresivamente
