# 🚀 Plan de Optimización Vercel - IZ ACCESS

## Estado Actual (2026-01-29)

### Métricas al inicio del sprint:
| Recurso | Uso | Límite | % |
|---------|-----|--------|---|
| Fluid Active CPU | 3h 8m | 4h | 78% |
| Fast Origin Transfer | 7.12 GB | 10 GB | 71% |
| Function Invocations | 428K | 1M | 43% |
| Edge Requests | 261K | 1M | 26% |

---

## ✅ Fase 1: Optimizaciones Críticas (COMPLETADO)

### 1.1 Eliminar Polling Agresivo
- [x] `NotificationButton.tsx` - Polling 60s → Solo cuando pestaña visible
- [x] `AppSidebar.tsx` - Polling 5min → Solo cuando pestaña visible
- **Impacto**: ~50-70% menos invocaciones de API cuando usuario inactivo

### 1.2 Bypass Proxy R2
- [x] Configurar CORS en Cloudflare R2
- [x] Agregar `NEXT_PUBLIC_R2_PUBLIC_URL` a `.env.local`
- [x] Actualizar `src/lib/constants.ts` para usar variable pública
- [x] Actualizar `src/lib/utils.ts` - `mediaUrl()` retorna URL directa
- [x] Actualizar `FeaturedModelsPanel.tsx`
- [x] Actualizar `BirthdayPanel.tsx`
- [x] Actualizar `web-client-page.tsx`
- [x] Actualizar `birthdays-client-page.tsx`
- **Impacto**: ~5GB menos de Fast Origin Transfer

### 1.3 Dynamic Imports
- [x] `web/page.tsx` - Lazy load con skeleton
- [x] `birthdays/page.tsx` - Lazy load con skeleton
- [x] `alerts/page.tsx` - Lazy load con skeleton
- [x] `settings/page.tsx` - Lazy load con skeleton
- **Impacto**: Menor bundle inicial, mejor FCP

### 1.4 Cache Headers en API Routes
- [x] `/api/notifications` - Cache 60s + stale-while-revalidate
- [x] `/api/alerts` - Cache 60s + stale-while-revalidate
- [x] `/api/dashboard/activity` - Cache 30s + stale-while-revalidate
- **Impacto**: Menos invocaciones de función

---

## ✅ Fase 2: Optimizaciones Server-Side (COMPLETADO)

### 2.1 React.cache() para Deduplicación ✅
- [x] Envolver `createClient` en `React.cache()` - `src/lib/supabase/server.ts`
- [x] Crear `src/lib/api/cached.ts` con funciones cacheadas
- [x] Actualizar `projects/[id]/page.tsx` para usar versiones cacheadas
- [x] Actualizar `models/page.tsx` para usar versiones cacheadas
- **Impacto**: Menos queries a Supabase por request (reutiliza cliente)

### 2.2 Suspense Boundaries para Streaming ✅
- [x] Refactorizar `dashboard/page.tsx` en componentes async separados
- [x] Agregar `<Suspense>` con skeletons para cada sección
- [x] KPICards, RecentActivityCard, IncompleteProfilesCard, ModelRankingsSection
- **Impacto**: Mejor TTFB, UX más responsive (contenido aparece progresivamente)

---

## ⏳ Fase 3: Optimizaciones Client-Side (PENDIENTE)

### 3.1 useTransition para Updates No-Urgentes
- [x] Envolver actualizaciones de filtros en `startTransition`
- [x] Evitar bloquear UI durante búsquedas/filtrado
- **Archivos candidatos**:
  - `models-client-page.tsx` (filtros) ✅
  - `projects-client-page.tsx` (filtros) ✅
  - `finances-client-page.tsx` (tabs, filtros)
- **Impacto**: UI más fluida

### 3.2 content-visibility para Listas Largas
- [x] Agregar CSS `content-visibility: auto` a tablas/listas
- [x] Aplicar a `ScrollArea` con muchos items
- **Archivos CSS a modificar**:
  - `src/app/globals.css`
- **Impacto**: Mejor rendering performance

---

## ✅ Fase 4: Limpieza de Proyecto (COMPLETADO)

### 4.1 Eliminar Archivos Temporales
- [x] `.tmp-tailwind.css` (79KB)
- [x] `tmp-tailwind-out.css` (99KB)
- [x] `material-theme.json` (15KB)
- [x] `new-globals.html` (2.6KB)
- [x] `original.html` (16KB)

### 4.2 Revisar Carpetas
- [x] `audits/` - Eliminada (Backup innecesario)
- [x] `archivos.md/` - No encontrado
- [x] `skills/` en raíz - MANTENIDA (Solicitud usuario)
- [x] `supabase 11 - 01/` - No encontrado

### 4.3 Simplificar DESIGN_SYSTEM.md
- [x] Reducir de 1115 líneas a ~300 líneas esenciales
- [x] Mantener solo: tokens, colores, tipografía, reglas críticas

---

## 📋 Prioridad de Implementación

| Orden | Tarea | Impacto | Esfuerzo |
|-------|-------|---------|----------|
| 1 | ✅ Polling + R2 Bypass | CRÍTICO | Medio |
| 2 | ✅ Dynamic Imports | ALTO | Bajo |
| 3 | React.cache() | MEDIO | Medio |
| 4 | Suspense Boundaries | MEDIO | Medio |
| 5 | useTransition | BAJO | Bajo |
| 6 | ✅ content-visibility | BAJO | Bajo |
| 7 | ✅ Limpieza archivos | BAJO | Bajo |

---
