# Plan: Sistema de Conversión de Monedas USD → GTQ

## Objetivo

Implementar conversión automática de USD a GTQ en toda la plataforma, guardando tasas históricas para pagos ya realizados y usando tasa actual para pendientes.

---

## API de Tasas de Cambio

**Seleccionada:** [Open Exchange Rates API](https://open.er-api.com) (gratuita, sin API key)

```
GET https://open.er-api.com/v6/latest/USD
→ { "rates": { "GTQ": 7.67, ... } }
```

- ✅ Gratis sin límites estrictos
- ✅ No requiere API key
- ✅ Actualiza diariamente

---

## Cambios en Base de Datos

### 1. Nueva tabla: `exchange_rates` (cache de tasas)

```sql
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  usd_to_gtq numeric NOT NULL,
  fetched_at timestamptz DEFAULT now()
);
```

### 2. Modificar `model_assignments`

```sql
ALTER TABLE model_assignments 
  ADD COLUMN exchange_rate_used numeric,
  ADD COLUMN amount_gtq numeric;
```

### 3. Modificar `projects` (para cobros a clientes)

```sql
ALTER TABLE projects
  ADD COLUMN client_exchange_rate_used numeric,
  ADD COLUMN client_amount_gtq numeric;
```

---

## Componentes a Crear/Modificar

### Backend

| Archivo | Cambio |
|---------|--------|
| `lib/utils/currency.ts` | **NUEVO** - Funciones de conversión y fetch de tasa |
| `lib/actions/exchange-rates.ts` | **NUEVO** - Server actions para tasas |
| `app/api/cron/exchange-rate/route.ts` | **NUEVO** - Cron job para actualizar tasa diaria |

### Frontend - Finanzas

| Archivo | Cambio |
|---------|--------|
| `finances-client-page.tsx` | Mostrar KPIs en GTQ, indicar moneda original |
| Diálogo de pago | Mostrar conversión antes de confirmar |

### Frontend - Modelo

| Archivo | Cambio |
|---------|--------|
| `page-client.tsx` (modelo) | Mostrar historial con montos en GTQ |

---

## Lógica de Conversión

```
┌─────────────────────────────────────────┐
│           AL MARCAR COMO PAGADO         │
├─────────────────────────────────────────┤
│ 1. IF currency === 'GTQ'                │
│      amount_gtq = amount_original       │
│      exchange_rate = 1                  │
│ 2. ELSE (USD)                           │
│      rate = getTodayRate()              │
│      amount_gtq = amount × rate         │
│      exchange_rate = rate               │
│ 3. Guardar en BD                        │
└─────────────────────────────────────────┘
```

---

## KPIs Unificados

| KPI | Fórmula |
|-----|---------|
| **Total Pagado** | Σ `amount_gtq` (ya convertido) |
| **Por Cobrar** | Σ (`amount` × `tasa_actual`) donde currency='USD' + Σ `amount` donde currency='GTQ' |
| **Total Generado** | Σ `amount_gtq` (histórico) |

---

## UI: Indicador de Moneda

En tarjetas de pago mostrar:
- Badge con moneda original: `USD 150`
- Tooltip o texto secundario: `≈ Q 1,150.50 @ 7.67`

---

## Fases de Implementación

### Fase 1: Base de datos y utilidades
- [ ] Crear tabla `exchange_rates`
- [ ] Agregar columnas a `model_assignments` y `projects`
- [ ] Crear `lib/utils/currency.ts`
- [ ] Crear `lib/actions/exchange-rates.ts`

### Fase 2: Integración en pagos
- [ ] Modificar flujo de "Marcar como Pagado" para guardar `exchange_rate_used` y `amount_gtq`
- [ ] Modificar flujo de cobro a cliente igual

### Fase 3: KPIs y visualización
- [ ] Actualizar cálculos de KPIs en finanzas
- [ ] Actualizar vista de trabajos del modelo
- [ ] Mostrar indicadores de moneda en las tarjetas

### Fase 4: Cron y mantenimiento
- [ ] Crear Edge Function para actualizar tasa diaria
- [ ] Configurar cron en Supabase (o Vercel)

---

## Migración de Datos Existentes

Para pagos ya marcados como "paid" que no tienen `exchange_rate_used`:
- Opción A: Usar tasa de hoy (menos preciso pero simple)
- Opción B: Dejar en blanco y mostrar "?" en UI
- **Recomendado:** Opción A con nota que son aproximados

---

## Estimación

| Fase | Tiempo |
|------|--------|
| Fase 1 | 30 min |
| Fase 2 | 45 min |
| Fase 3 | 30 min |
| Fase 4 | 15 min |
| **Total** | ~2 horas |

---

## ¿Aprobado?

Confirma para proceder con la implementación.
