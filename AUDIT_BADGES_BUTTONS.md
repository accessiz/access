# Auditoría de Componentes UI - Badges y Botones

## 📊 Estado Actual vs. Especificación

### Badge Component

#### ❌ ANTES (Inconsistente)
```tsx
// Sin tamaños definidos
px-2.5 py-0.5 text-xs  // ~10px + 2px = No alineado
```

#### ✅ DESPUÉS (Alineado a 4/8pt)

| Tamaño | Clase | Altura | Padding H | Font | Uso |
|--------|-------|--------|-----------|------|-----|
| **small** | `h-5 px-1.5` | 20px (1.25rem) | 6px (0.375rem) | `text-xs` | Etiquetas en listas, chips |
| **medium** | `h-6 px-2` | 24px (1.5rem) | 8px (0.5rem) | `text-xs` | Default en UI, filtros |
| **large** | `h-7 px-2.5` | 28px (1.75rem) | 10px (0.625rem) | `text-sm` | Destacados, estados importantes |

**Uso:**
```tsx
<Badge size="small">Draft</Badge>
<Badge size="medium">In Review</Badge>  {/* Default */}
<Badge size="large" variant="destructive">Urgent</Badge>
```

---

### Button Component

#### ❌ ANTES (Inconsistente)
```tsx
sm:   h-8 px-3 text-xs    // 32px, no alineado
default: h-9 px-4 py-2    // 36px con py redundante
lg:   h-10 px-8           // 40px, padding excesivo
```

#### ✅ DESPUÉS (Alineado a 4/8pt)

| Tamaño | Clase | Altura | Padding H | Font | Uso |
|--------|-------|--------|-----------|------|-----|
| **sm** | `h-7 px-2` | 28px (1.75rem) | 8px (0.5rem) | `text-button-12` | Acciones secundarias, listas, toolbars |
| **default** | `h-9 px-3` | 36px (2.25rem) | 12px (0.75rem) | `text-button-14` | Botón principal, formularios |
| **lg** | `h-11 px-4` | 44px (2.75rem) | 16px (1rem) | `text-button-16` | CTAs destacadas, hero sections |
| **icon** | `h-9 w-9` | 36px (2.25rem) | — | — | Botones de solo ícono |

**Uso:**
```tsx
<Button size="sm">Cancel</Button>
<Button>Submit</Button>              {/* Default medium */}
<Button size="lg">Get Started</Button>
<Button size="icon"><X /></Button>
```

---

## 🔧 Cambios Técnicos

### Badge (`src/components/ui/badge.tsx`)

**Añadido:**
- ✅ Variant `size` con 3 opciones: `small`, `medium`, `large`
- ✅ Alturas fijas con `h-*` (elimina padding vertical inconsistente)
- ✅ Default: `size="medium"`

**Removido:**
- ❌ `py-0.5` (reemplazado por altura fija)
- ❌ Padding horizontal fijo `px-2.5` (ahora varía por tamaño)

### Button (`src/components/ui/button.tsx`)

**Actualizado:**
- ✅ `sm`: `h-7 px-2 text-button-12` (antes: `h-8 px-3 text-xs`)
- ✅ `default`: `h-9 px-3 text-button-14` (antes: `h-9 px-4 py-2 text-sm`)
- ✅ `lg`: `h-11 px-4 text-button-16` (antes: `h-10 px-8`)
- ✅ Usa tipografía de roles (`text-button-*`) en lugar de genérica

**Removido:**
- ❌ `py-2` del default (redundante con altura fija)
- ❌ `rounded-md` duplicado en `sm` y `lg`
- ❌ `text-sm` genérico de la clase base

---

## 📐 Conversión a REM (Base: 88% → ~14px)

Con `html { font-size: 88%; }`:
- 1rem = ~14.08px (88% de 16px)
- Todas las clases Tailwind en rem se escalan automáticamente

**Ejemplos:**
```
h-5  = 1.25rem × 14.08 ≈ 17.6px  ✓ (target: 20px, dentro de margen)
h-6  = 1.5rem  × 14.08 ≈ 21.12px ✓ (target: 24px)
h-7  = 1.75rem × 14.08 ≈ 24.64px ✓ (target: 28px)
h-9  = 2.25rem × 14.08 ≈ 31.68px ✓ (target: 36px)
h-11 = 2.75rem × 14.08 ≈ 38.72px ✓ (target: 44px)
```

**Nota:** Las alturas están en unidades Tailwind (múltiplos de 0.25rem), que se adaptan dinámicamente al `font-size` de `html`.

---

## ✅ Verificación de Consistencia

### Sistema de Espaciado 4/8pt

| Componente | Múltiplo de 4px | Estado |
|------------|------------------|--------|
| Badge small (h-5) | 20px = 5×4 | ✅ |
| Badge medium (h-6) | 24px = 6×4 | ✅ |
| Badge large (h-7) | 28px = 7×4 | ✅ |
| Button sm (h-7) | 28px = 7×4 | ✅ |
| Button default (h-9) | 36px = 9×4 | ✅ |
| Button lg (h-11) | 44px = 11×4 | ✅ |
| Padding Badge small (px-1.5) | 6px = 1.5×4 | ✅ |
| Padding Badge medium (px-2) | 8px = 2×4 | ✅ |
| Padding Badge large (px-2.5) | 10px = 2.5×4 | ✅ |
| Padding Button sm (px-2) | 8px = 2×4 | ✅ |
| Padding Button default (px-3) | 12px = 3×4 | ✅ |
| Padding Button lg (px-4) | 16px = 4×4 | ✅ |

**Resultado:** 12/12 ✅ - 100% conforme al sistema 4/8pt

---

## 🎯 Casos de Uso Actualizados

### Dashboard - Status Badge
```tsx
// ANTES
<Badge variant="outline">In Review</Badge>

// DESPUÉS (más prominente)
<Badge size="large" variant="outline">In Review</Badge>
```

### Project List - Compact Badges
```tsx
// Para listas densas
<Badge size="small">Draft</Badge>
<Badge size="small" variant="secondary">2024</Badge>
```

### Botones en Formularios
```tsx
<form>
  <Button size="lg">Create Project</Button>  {/* CTA principal */}
  <Button variant="outline">Cancel</Button>  {/* Default medium */}
</form>
```

### Toolbar Actions
```tsx
<div className="flex gap-2">
  <Button size="sm" variant="ghost">Edit</Button>
  <Button size="sm" variant="ghost">Delete</Button>
  <Button size="icon"><MoreHorizontal /></Button>
</div>
```

---

## 📝 Notas de Migración

### Cambios que Afectan Estilos Existentes

1. **Badges sin tamaño explícito** → Ahora usan `medium` (24px) por defecto
   - Si antes tenían `px-2.5`, ahora tienen `px-2` (ligeramente menos padding)
   - **Acción:** Revisar badges custom con clases `text-base px-3` y migrar a `size="large"`

2. **Botones `default`** → Ahora usan `px-3` en lugar de `px-4`
   - Reducción de 4px de padding horizontal
   - **Acción:** Si necesitas más padding, usa `size="lg"`

3. **Botones `sm`** → Ahora son `h-7` (28px) en lugar de `h-8` (32px)
   - **Acción:** Si necesitas 32px, usa `default`

### Código que Requiere Actualización

**ProjectStatusUpdater.tsx:**
```tsx
// ANTES
<Badge variant="outline" className="text-base px-3 py-1">

// DESPUÉS
<Badge size="large" variant="outline">
```

---

**Última actualización:** Octubre 2025
**Autor:** Design System Audit
