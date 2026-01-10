# Plan: Sistema de Actividad y Notificaciones

## Objetivo
Implementar un sistema completo de log de actividades que alimente:
1. **Campanita de notificaciones** (NotificationBell) — funcional
2. **Actividad Reciente en Dashboard** — datos reales
3. **Log de auditoría** — quién hizo qué y cuándo

---

## Estado Actual de Supabase

### Tabla `activity_logs` ✅ YA EXISTE

| Columna | Tipo | Uso |
|---------|------|-----|
| `id` | uuid | PK auto-generado |
| `created_at` | timestamptz | Timestamp automático |
| `user_id` | uuid | Dueño del log |
| `category` | text | Tipo: `project`, `model`, `client` |
| `title` | text | Título visible: "Creaste proyecto X" |
| `message` | text | Descripción detallada |
| `metadata` | jsonb | `{ entity_id, entity_type, action, old_value, new_value }` |
| `is_urgent` | boolean | Para notificaciones destacadas |

### RLS Actual
- ✅ `SELECT` para `authenticated` → `true`
- ❌ **Falta** `INSERT` para usuarios autenticados

---

## Cambios Requeridos

### 1. Supabase — Agregar Policy INSERT

```sql
-- Ejecutar en Supabase SQL Editor
CREATE POLICY "Users can insert their own activity logs"
ON activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

---

### 2. Backend — Logger

#### [NEW] `src/lib/activity-logger.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export type ActivityCategory = 'project' | 'model' | 'client' | 'brand';

export interface LogActivityParams {
  category: ActivityCategory;
  title: string;
  message?: string;
  metadata?: {
    entity_id?: string;
    entity_type?: string;
    action?: string;
    [key: string]: unknown;
  };
  isUrgent?: boolean;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    category: params.category,
    title: params.title,
    message: params.message || null,
    metadata: params.metadata || {},
    is_urgent: params.isUrgent || false,
  });
}
```

---

### 3. Integración en Server Actions

| Archivo | Dónde insertar | Título ejemplo |
|---------|----------------|----------------|
| `projects.ts` → `createProject` | Después de insert exitoso | "Creaste proyecto {name}" |
| `projects.ts` → `updateProject` | Después de update exitoso | "Editaste proyecto {name}" |
| `projects.ts` → `deleteProject` | Después de delete exitoso | "Eliminaste proyecto {name}" |
| `projects.ts` → `updateProjectStatus` | Después de cambio | "Cambiaste estado a {status}" |
| `projects_models.ts` → `addModelToProject` | Después de insert | "Añadiste a {model} en {project}" |
| `projects_models.ts` → `removeModelFromProject` | Después de delete | "Removiste a {model} de {project}" |
| `models.ts` → `createModel` | Después de insert | "Añadiste talento {name}" |
| `models.ts` → `updateModel` | Después de update | "Editaste perfil de {name}" |
| `client_actions.ts` → `updateClientModelSelection` | Después de update | "Cliente aprobó/rechazó a {model}" |

---

### 4. API — Actualizar `getRecentActivity()`

#### [MODIFY] `src/lib/api/dashboard.ts`

```typescript
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(log => ({
    id: log.id,
    type: log.category as 'model' | 'project',
    title: log.title,
    when: log.created_at,
    meta: log.message || undefined,
  }));
}
```

---

### 5. UI — Mejorar visualización

Sin cambios de estructura necesarios, solo recibirán mejores datos.

---

## Lista de Tareas

### Fase 1: Base de Datos
- [ ] Agregar policy INSERT en `activity_logs`

### Fase 2: Backend Logger
- [ ] Crear `src/lib/activity-logger.ts`
- [ ] Integrar en `projects.ts`
- [ ] Integrar en `projects_models.ts`
- [ ] Integrar en `models.ts`
- [ ] Integrar en `client_actions.ts`

### Fase 3: API
- [ ] Actualizar `getRecentActivity()` en `dashboard.ts`

### Fase 4: UI
- [ ] Verificar que NotificationBell muestra datos
- [ ] Verificar que Dashboard muestra actividad

### Fase 5: Testing
- [ ] Crear proyecto → ver en campanita
- [ ] Añadir modelo → ver en dashboard

---

## Nota Importante

**Antes de implementar**, ejecuta este SQL en Supabase:

```sql
CREATE POLICY "Users can insert their own activity logs"
ON activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

---

# Nueva Funcionalidad: Visibilidad Web de Modelos

## Objetivo
Permitir a María controlar qué modelos aparecen en la página web pública de la agencia.

## Cambios en Base de Datos

```sql
-- Agregar columna a models
ALTER TABLE models 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Índice para consultas rápidas
CREATE INDEX idx_models_is_public ON models(is_public) WHERE is_public = true;

-- RLS: La web pública solo ve modelos públicos
CREATE POLICY "Public can view public models"
ON models
FOR SELECT
TO anon
USING (is_public = true);
```

## Cambios en UI

### Sidebar
- Agregar item "Web" con icono `Globe` debajo de Cumpleaños
- Ruta: `/dashboard/web`

### Página `/dashboard/web`
- Header: "Visibilidad Web"
- Lista de modelos similar a Cumpleaños
- Cada item: Avatar + Nombre + Switch (is_public)
- Búsqueda/filtro opcional

## Archivos a crear/modificar

| Archivo | Cambio |
|---------|--------|
| Supabase | `ALTER TABLE models ADD COLUMN is_public` |
| `sidebar.tsx` | Agregar item "Web" con icono Globe |
| `src/app/dashboard/web/page.tsx` | Nueva página |
| `src/lib/actions/models.ts` | Action `toggleModelVisibility(modelId, isPublic)` |

## Flujo
1. María va a Dashboard > Web
2. Ve lista de modelos con switches
3. Activa/desactiva visibilidad
4. Web pública muestra solo `is_public = true`

