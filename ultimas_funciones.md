# 📋 Últimas Funciones - Plan de Implementación

> **Filosofía de diseño (Don Norman):** "El diseño es realmente un acto de comunicación. Un buen diseño es evidente y explícito sobre su estado." Cada alerta debe comunicar claramente QUÉ acción se requiere, POR QUÉ es importante, y CÓMO resolverla.

---

## 1. Sistema de Alertas Inteligentes

### 1.1 Nueva Alerta: "Proyecto sin monto a cobrar"

**Objetivo:** Notificar cuando un proyecto completado no tiene `revenue` definido pero ya debería facturarse.

**Condiciones para mostrar:**
- `status = 'completed'`
- Tiene al menos 1 modelo aprobado (`client_selection = 'approved'`)
- La última fecha del schedule ya pasó (`<= hoy`)
- `revenue IS NULL OR revenue = 0`

**Archivo a modificar:**
- `src/app/api/alerts/route.ts`

**Cambios específicos:**
```typescript
// Nueva sección después de línea 156:
// 4. ALERTAS: Proyectos completados sin monto a cobrar definido
const { data: noRevenueProjects, error: noRevenueError } = await supabase
    .from('projects')
    .select(`
        id,
        project_name,
        schedule,
        revenue,
        projects_models!projects_models_project_id_fkey(client_selection)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .or('revenue.is.null,revenue.eq.0');

// Filtrar: tiene modelos aprobados + fecha pasada
```

---

### 1.2 Nueva Sección en Sidebar: "Alertas"

**Objetivo:** Agregar una pestaña dedicada en el sidebar con icono de alerta (AlertTriangle).

**Archivo a modificar:**
- `src/components/organisms/AppSidebar.tsx`

**Cambios específicos:**
1. Agregar import: `AlertTriangle` de lucide-react
2. Agregar nuevo item en `navMain`:
   ```typescript
   {
     title: "Alertas",
     url: "/dashboard/alerts",
     icon: AlertTriangle,
   }
   ```
3. Mostrar contador de alertas pendientes (badge con número)

---

### 1.3 Nueva Página: Dashboard de Alertas

**Objetivo:** Vista detallada de todas las alertas con información completa.

**Archivos a crear:**
- `src/app/dashboard/alerts/page.tsx`
- `src/app/dashboard/alerts/alerts-client-page.tsx`

**Funcionalidades:**
- Lista de alertas agrupadas por tipo (Pagos, Facturación, Atención)
- Cada alerta muestra:
  - Título descriptivo
  - Proyecto/Modelo afectado
  - Monto involucrado (si aplica)
  - Fecha limite/deadline
  - Botón de acción principal (ir a resolver)
  - Botón "Snooze" (aplazar 1 día)

---

### 1.4 Sistema de Snooze (Aplazar Alertas)

**Objetivo:** Permitir al usuario "silenciar" una alerta por 24 horas.

**Base de datos (migración):**
```sql
CREATE TABLE alert_dismissals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    alert_id TEXT NOT NULL,  -- ID de la alerta (formato: type_entityId)
    dismissed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_dismissals_user ON alert_dismissals(user_id);
CREATE INDEX idx_alert_dismissals_expires ON alert_dismissals(expires_at);
```

**API endpoints:**
- `POST /api/alerts/dismiss` - Aplazar una alerta
- `POST /api/alerts/dismiss-all` - Aplazar todas las alertas

**Lógica:**
- Al generar alertas, filtrar las que tienen un `dismissal` activo (expires_at > now())
- Cron job opcional para limpiar dismissals expirados

---

## 2. Corrección de Error: Exchange Rate Caching

**Problema:** `Error caching exchange rate: {}` en exchange-rates.ts:41

**Causa probable:** La tabla `exchange_rates` tiene restricciones RLS que impiden INSERT/UPSERT desde el server action.

**Archivo a modificar:**
- `src/lib/actions/exchange-rates.ts`

**Solución:**
1. Cambiar el log para mostrar el error real:
   ```typescript
   console.error('Error caching exchange rate:', JSON.stringify(insertError, null, 2));
   ```

2. Usar cliente con bypass de RLS (service role) para operaciones de cache:
   ```typescript
   // Opción A: Silenciar el warning si no es crítico
   // Opción B: Usar supabase admin client si disponible
   ```

3. Alternativa: No loguear como error, ya que el rate se devuelve correctamente:
   ```typescript
   if (insertError) {
       // Solo log de debug, no error - el rate se devuelve correctamente
       console.debug('[ExchangeRate] Cache write skipped:', insertError.code);
   }
   ```

---

## 3. Mejora de Exportación Excel

**Objetivo:** Incluir todos los datos relevantes en las exportaciones.

**Archivo a modificar:**
- `src/app/api/finances/export/route.ts`

### 3.1 Mejoras en Export de Modelos (líneas 100-116)

**Columnas a agregar:**
```typescript
ws.columns = [
    { header: 'Modelo', key: 'modelo', width: 20 },
    { header: 'Nombre Completo', key: 'nombre_completo', width: 25 },
    { header: 'Proyecto', key: 'proyecto', width: 30 },
    { header: 'Cliente', key: 'cliente', width: 20 },
    { header: 'Marca', key: 'marca', width: 15 },
    { header: 'Primera Fecha', key: 'primera_fecha', width: 12 },  // NUEVO
    { header: 'Última Fecha', key: 'ultima_fecha', width: 12 },    // NUEVO
    { header: 'Días', key: 'dias', width: 6 },
    { header: 'Tipo Pago', key: 'tipo_pago', width: 12 },          // NUEVO
    { header: 'Tarifa/Día (Efectivo)', key: 'tarifa_dia', width: 18 },
    { header: 'Tarifa/Día (Canje)', key: 'tarifa_canje', width: 18 }, // NUEVO
    { header: 'Total Efectivo', key: 'total_efectivo', width: 14 },
    { header: 'Total Canje', key: 'total_canje', width: 14 },       // NUEVO
    { header: 'Categoría Canje', key: 'categoria_canje', width: 15 }, // NUEVO
    { header: 'Pagado', key: 'pagado', width: 12 },
    { header: 'Pendiente', key: 'pendiente', width: 12 },
    { header: 'Moneda', key: 'moneda', width: 8 },
    { header: 'Monto GTQ', key: 'monto_gtq', width: 12 },           // NUEVO
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Fecha Pago', key: 'fecha_pago', width: 12 },
];
```

### 3.2 Mejoras en Export de Clientes (líneas 254-267)

**Columnas a agregar:**
```typescript
ws.columns = [
    { header: 'Proyecto', key: 'proyecto', width: 30 },
    { header: 'Cliente', key: 'cliente', width: 20 },
    { header: 'Marca', key: 'marca', width: 15 },
    { header: 'Tipo Pago', key: 'tipo_pago', width: 12 },           // NUEVO
    { header: 'Subtotal Efectivo', key: 'subtotal', width: 16 },
    { header: 'Valor Canje', key: 'valor_canje', width: 12 },       // NUEVO
    { header: 'IVA (%)', key: 'iva_percent', width: 10 },
    { header: 'Monto IVA', key: 'iva_monto', width: 12 },
    { header: 'Total con IVA', key: 'total', width: 12 },
    { header: 'Moneda', key: 'moneda', width: 8 },
    { header: 'Tipo Cambio', key: 'tipo_cambio', width: 12 },       // NUEVO
    { header: 'Total GTQ', key: 'total_gtq', width: 12 },           // NUEVO
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Fecha Factura', key: 'fecha_factura', width: 12 },
    { header: 'No. Factura', key: 'no_factura', width: 15 },
    { header: 'Fecha Pago', key: 'fecha_pago', width: 12 },
    { header: 'Fecha Proyecto', key: 'fecha_proyecto', width: 14 }, // NUEVO
];
```

---

## 4. Orden de Implementación

| # | Tarea | Prioridad | Archivos |
|---|-------|-----------|----------|
| 1 | Fix error exchange rate | Alta | exchange-rates.ts |
| 2 | Nueva alerta "sin revenue" | Alta | alerts/route.ts |
| 3 | Migración tabla dismissals | Alta | SQL migration |
| 4 | API dismiss alerts | Media | api/alerts/dismiss/route.ts |
| 5 | Sidebar: agregar Alertas | Media | AppSidebar.tsx |
| 6 | Página de Alertas | Media | dashboard/alerts/*.tsx |
| 7 | Mejorar export Excel | Baja | finances/export/route.ts |

---

## 5. Plan de Verificación

### Tests Automatizados

**Archivo existente:** `src/lib/__tests__/constants.test.ts`

**Comando:** 
```bash
npm test
```

### Tests Manuales

1. **Exchange Rate Error:**
   - Navegar a `/dashboard/models`
   - Verificar que NO aparezca el error en consola
   - Si aparece, debe ser un log de debug (no error)

2. **Nueva Alerta sin Revenue:**
   - Crear proyecto sin revenue, con modelo aprobado, fecha pasada
   - Navegar a alertas
   - Verificar que aparece la alerta

3. **Sistema de Snooze:**
   - Click en "Aplazar" en una alerta
   - Verificar que desaparece
   - Esperar 24h (o modificar BD) y verificar que reaparece

4. **Export Excel Mejorado:**
   - Descargar excel de modelos
   - Verificar columnas nuevas (canje, GTQ, etc.)
   - Descargar excel de clientes
   - Verificar columnas nuevas

---

## 6. Consideraciones Don Norman

| Principio | Aplicación |
|-----------|------------|
| **Visibilidad** | El icono de alerta en sidebar debe tener badge con número de alertas pendientes |
| **Retroalimentación** | Al aplazar, mostrar toast "Alerta aplazada por 24 horas" |
| **Restricciones** | No permitir aplazar alertas de alta prioridad por más de 3 días consecutivos |
| **Consistencia** | Usar los mismos colores del design system (--warning para alertas) |
| **Affordance** | Botones de acción claramente distinguibles (resolver vs aplazar) |
| **Mapping** | La alerta debe llevar directamente a la pantalla donde se resuelve |

---

## 7. Estilos (Referencia globals.css)

```css
/* Colores a usar */
--warning: 234 179 8;      /* Amarillo para alertas */
--destructive: 239 68 68;  /* Rojo para errores críticos */
--success: 34 197 94;      /* Verde para resuelto */
--purple: 134 50 155;      /* Morado para acciones principales */
```

---

**Fecha de creación:** 2026-01-15
**Estado:** Pendiente de aprobación
