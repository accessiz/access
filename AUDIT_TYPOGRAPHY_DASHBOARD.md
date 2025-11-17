# Auditoría de Tipografía - Sección Dashboard
## Aplicación del Sistema Geist/Vercel

---

## 📋 Filosofía de Diseño

### Principios Aplicados

**Don Norman (Significantes):**
- La tipografía es el principal significante de jerarquía
- La consistencia absoluta es obligatoria
- Cualquier inconsistencia rompe la confianza y usabilidad

**Henry Dreyfuss (Ergonomía):**
- Diseñamos para humanos
- `text-copy-14` y `text-copy-16` son la base de lectura
- El sistema debe sentirse ordenado, claro y sin esfuerzo

---

## 🚫 Regla de Oro

**PROHIBIDAS las clases genéricas de Tailwind:**
- ❌ `text-xs`
- ❌ `text-sm`
- ❌ `text-base`
- ❌ `text-lg`
- ❌ `text-xl`
- ❌ `text-2xl`
- ❌ `text-3xl`

**OBLIGATORIAS las clases semánticas Geist/Vercel:**
- ✅ `text-heading-*`
- ✅ `text-copy-*`
- ✅ `text-label-*`
- ✅ `text-button-*`

---

## ✅ Correcciones Aplicadas - Paso 1

### 1. Dashboard Principal (`src/app/dashboard/page.tsx`)

#### Actividad Reciente

**ANTES:**
```tsx
<li className="text-sm">
  {/* contenido */}
</li>
{activity.length === 0 && <li className="text-sm text-muted-foreground">...</li>}
```

**DESPUÉS:**
```tsx
<li className="text-copy-14">
  {/* contenido */}
</li>
{activity.length === 0 && <li className="text-copy-13 text-muted-foreground">...</li>}
```

**Justificación:**
- `text-copy-14`: Texto de cuerpo principal (lista de actividad)
- `text-copy-13`: Texto secundario/muted (estado vacío)

---

#### Perfiles por Completar

**ANTES:**
```tsx
<Link href={`/dashboard/models/${m.id}`} className="text-sm font-medium">
  {m.alias || 'Sin alias'}
</Link>
<span className="text-sm text-muted-foreground">
  {Math.round(m.profile_completeness || 0)}%
</span>
{lowModels.length === 0 && <li className="text-sm text-muted-foreground">...</li>}
```

**DESPUÉS:**
```tsx
<Link href={`/dashboard/models/${m.id}`} className="text-label-14">
  {m.alias || 'Sin alias'}
</Link>
<span className="text-copy-13 text-muted-foreground">
  {Math.round(m.profile_completeness || 0)}%
</span>
{lowModels.length === 0 && <li className="text-copy-13 text-muted-foreground">...</li>}
```

**Justificación:**
- `text-label-14`: Nombre del modelo (elemento de UI interactivo/link)
- `text-copy-13`: Porcentaje (metadato numérico)

---

### 2. Layout Dashboard (`src/app/dashboard/layout.tsx`)

#### Sidebar Desktop - Logo

**ANTES:**
```tsx
<span className="text-lg">IZ Access</span>
```

**DESPUÉS:**
```tsx
<span className="text-heading-16">IZ Access</span>
```

**Justificación:**
- `text-heading-16`: Logo/marca (significante de identidad)

---

#### Sidebar Desktop - Navegación

**ANTES:**
```tsx
<nav className="grid items-start p-4 text-sm font-medium">
  {/* links */}
</nav>
```

**DESPUÉS:**
```tsx
<nav className="grid items-start p-4">
  {/* links - tipografía en DashboardNavLink */}
</nav>
```

**ANTES (Settings):**
```tsx
<nav className="grid items-start text-sm font-medium">
  <Link className="... text-muted-foreground ...">
    {/* settings link */}
  </Link>
</nav>
```

**DESPUÉS:**
```tsx
<nav className="grid items-start">
  <Link className="... text-label-14 text-muted-foreground ...">
    {/* settings link */}
  </Link>
</nav>
```

**Justificación:**
- Removido `text-sm font-medium` del `<nav>` (redundante)
- `text-label-14` aplicado explícitamente en link de Settings
- DashboardNavLink ya tiene tipografía correcta heredada

---

#### Mobile Sheet - Logo

**ANTES:**
```tsx
<span className="text-lg">IZ Access</span>
```

**DESPUÉS:**
```tsx
<span className="text-heading-16">IZ Access</span>
```

---

#### Mobile Sheet - Navegación

**ANTES:**
```tsx
<nav className="flex-1 flex flex-col gap-1 p-4 text-base font-medium overflow-y-auto">
```

**DESPUÉS:**
```tsx
<nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
```

**ANTES (Settings en Sheet):**
```tsx
<Link className="... text-muted-foreground ...">
```

**DESPUÉS:**
```tsx
<Link className="... text-label-14 text-muted-foreground ...">
```

---

#### Header - Email Usuario

**ANTES:**
```tsx
<p className="text-sm font-medium text-foreground">{user.email}</p>  {/* Mobile */}
<p className="text-sm text-muted-foreground hidden sm:block">{user.email}</p>  {/* Desktop */}
```

**DESPUÉS:**
```tsx
<p className="text-copy-14 text-foreground">{user.email}</p>  {/* Mobile */}
<p className="text-copy-13 text-muted-foreground hidden sm:block">{user.email}</p>  {/* Desktop */}
```

**Justificación:**
- `text-copy-14`: Información de usuario (móvil, más prominente)
- `text-copy-13`: Información secundaria (desktop, más sutil)

---

### 3. Sidebar Component (`src/components/organisms/Sidebar.tsx`)

**ANTES:**
```tsx
<span className="text-lg">IZ Access</span>
<nav className="grid items-start p-4 text-sm font-medium">
<nav className="grid items-start text-sm font-medium">
```

**DESPUÉS:**
```tsx
<span className="text-heading-16">IZ Access</span>
<nav className="grid items-start p-4">
  {/* links con text-label-14 inline */}
</nav>
<nav className="grid items-start">
  {/* settings link con text-label-14 inline */}
</nav>
```

**Cambios específicos en links:**
```tsx
// Removido: text-sm font-medium del nav
// Añadido: text-label-14 inline en className de Link
className={cn(
  "flex items-center gap-3 rounded-lg px-3 py-2 text-label-14 text-muted-foreground ...",
  // estado activo
)}
```

---

## 📊 Resumen de Cambios - Paso 1

### Archivos Modificados: 3

1. ✅ `src/app/dashboard/page.tsx`
2. ✅ `src/app/dashboard/layout.tsx`
3. ✅ `src/components/organisms/Sidebar.tsx`

### Correcciones por Tipo:

| Tipo de Cambio | Antes | Después | Cantidad |
|----------------|-------|---------|----------|
| Logo/Marca | `text-lg` | `text-heading-16` | 3× |
| Links de navegación | `text-sm font-medium` | `text-label-14` | 6× |
| Texto de actividad | `text-sm` | `text-copy-14` | 1× |
| Estados vacíos | `text-sm` | `text-copy-13` | 2× |
| Nombres de modelos | `text-sm font-medium` | `text-label-14` | 1× |
| Porcentajes | `text-sm` | `text-copy-13` | 2× |
| Email usuario | `text-sm` | `text-copy-13/14` | 2× |

**Total de correcciones:** 17

---

## 🔍 Violaciones Detectadas - Pendientes

### Sección Models (9 instancias encontradas)

1. `src/app/dashboard/models/[id]/page-client.tsx`:
   - Línea 38: `text-sm font-medium` (label de campo)
   - Línea 39: `text-base` (valor de campo)
   - Línea 246: `text-lg font-semibold` (título "Zona de peligro")
   - Línea 247: `text-sm` (descripción de peligro)

2. `src/app/dashboard/models/models-client-page.tsx`:
   - Línea 129: `text-lg font-semibold` (estado vacío)
   - Línea 144: `text-2xl` (avatar fallback)
   - Línea 149: `text-sm` (país del modelo)
   - Línea 185: `text-xs` (porcentaje de completitud)
   - Línea 265: `text-sm` (paginación)

---

## 📝 Próximos Pasos

### Paso 2: Auditar Sección Models
- [ ] Corregir `models-client-page.tsx` (5 violaciones)
- [ ] Corregir `models/[id]/page-client.tsx` (4 violaciones)
- [ ] Verificar `ModelForm.tsx`
- [ ] Verificar `ModelsToolbar.tsx`

### Paso 3: Auditar Sección Projects
- [ ] Ya auditada previamente
- [ ] Verificar nuevas violaciones tras cambios

### Paso 4: Componentes Globales
- [ ] Header.tsx
- [ ] Footer.tsx
- [ ] NotificationBell.tsx
- [ ] Otros componentes organisms/

---

## 🎯 Guía de Aplicación Semántica

### 1. Headings (Jerarquía Visual)

| Clase | Uso | Ejemplo |
|-------|-----|---------|
| `text-heading-72` a `40` | Marketing, landing pages | ❌ No usar en dashboard |
| `text-heading-32` | **H1 de página** (1× por página) | "Dashboard", "Talento" |
| `text-heading-20` | **H2 sección/card** | "Resumen de Proyectos", CardTitle |
| `text-heading-16` | **Subtítulo menor** o **Logo/Marca** | "IZ Access" |
| `text-heading-14` | Widget pequeño | Poco usado |

---

### 2. Copy (Texto de Lectura)

| Clase | Uso | Ejemplo |
|-------|-----|---------|
| `text-copy-14` | **Texto de cuerpo DEFAULT** | Listas, párrafos, contenido principal |
| `text-copy-16` | Texto con más legibilidad | Modales, descripciones largas |
| `text-copy-13` | **Texto secundario/muted** | Estados vacíos, metadatos |

**Modificador Subtle:**
- Añadir `text-muted-foreground` para reducir énfasis

---

### 3. Label (Etiquetas de UI)

| Clase | Uso | Ejemplo |
|-------|-----|---------|
| `text-label-14` | **Navegación, menús, links** | Sidebar, DashboardNavLink |
| `text-label-13` | Metadatos tabulares | Números, contadores |
| `text-label-12` | Terciario, uppercase | TableHead, estados (`uppercase`) |

---

### 4. Buttons

**NO aplicar manualmente.** El componente `<Button>` aplica automáticamente:
- `text-button-14` (default)
- `text-button-16` (size="lg")
- `text-button-12` (size="sm")

---

## ✅ Estado Actual

### Dashboard Home: 100% CONFORME ✅
- ✅ Sin violaciones de `text-sm/lg/xl`
- ✅ Toda tipografía usa roles semánticos
- ✅ Jerarquía clara (H1 → CardTitle → Copy)
- ✅ 0 errores de compilación

### Layout & Navigation: 100% CONFORME ✅
- ✅ Sidebar desktop corregido
- ✅ Mobile sheet corregido
- ✅ Header corregido
- ✅ DashboardNavLink sin violaciones

### Próximo: Sección Models
- ⚠️ 9 violaciones detectadas
- 🔄 Corrección en progreso

---

**Última actualización:** Octubre 28, 2025  
**Estado:** Paso 1 Completado - Dashboard Home & Layout  
**Errores de compilación:** 0  
**Archivos auditados:** 3/26  
**Violaciones corregidas:** 17  
**Violaciones pendientes:** 9 (Models)
