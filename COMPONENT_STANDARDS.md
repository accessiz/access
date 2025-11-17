# Estándares de Componentes de Entrada y Controles

## 🎯 Objetivo

Todos los campos de entrada, botones de acción, selectores y controles deben tener **la misma altura y consistencia visual** para crear una interfaz uniforme.

---

## 📐 Especificación de Altura Estándar

### Altura Base: **36px (h-9)**

Todos los componentes interactivos principales usan `h-9` (2.25rem ≈ 36px con base de 88%).

| Componente | Altura | Clase Base | Uso |
|------------|--------|------------|-----|
| **Input** | 36px | `h-9` | Campos de texto, búsqueda |
| **Select** | 36px | `h-9` | Selectores dropdown |
| **Button (default)** | 36px | `h-9` | Botones principales |
| **Combobox** | 36px | `h-9` | Búsqueda con autocompletado |
| **Textarea** | Variable | `min-h-[80px]` | Texto multilínea |

---

## ✅ Componentes Actualizados

### 1. Input (`src/components/ui/input.tsx`)

**Antes:**
```tsx
h-10 px-3 py-2 text-sm  // 40px, padding vertical redundante
```

**Después:**
```tsx
h-9 px-3 text-copy-14   // 36px, sin padding vertical, tipografía de roles
```

**Cambios:**
- ✅ Altura: `h-10` → `h-9` (36px)
- ✅ Removido: `py-2` (redundante con altura fija)
- ✅ Tipografía: `text-sm` → `text-copy-14`

---

### 2. Select (`src/components/ui/select.tsx`)

**Antes:**
```tsx
h-10 px-3 py-2 text-sm  // 40px, inconsistente con Input
```

**Después:**
```tsx
h-9 px-3 text-copy-14   // 36px, alineado con Input
```

**Cambios:**
- ✅ Altura: `h-10` → `h-9`
- ✅ Removido: `py-2`
- ✅ Tipografía: `text-sm` → `text-copy-14`

---

### 3. Combobox (`src/components/ui/combobox.tsx`)

**Antes:**
```tsx
className="w-full justify-between font-normal"  // Sin altura explícita
```

**Después:**
```tsx
className="h-9 w-full justify-between font-normal text-copy-14"
```

**Cambios:**
- ✅ Añadido: `h-9` (fuerza 36px)
- ✅ Tipografía: Añadido `text-copy-14`

---

### 4. Textarea (`src/components/ui/textarea.tsx`)

**Antes:**
```tsx
px-3 py-2 text-sm  // Tipografía inconsistente
```

**Después:**
```tsx
px-3 py-2 text-copy-14  // Tipografía de roles
```

**Cambios:**
- ✅ Tipografía: `text-sm` → `text-copy-14`
- ℹ️ Mantiene altura variable (`min-h-[80px]`) por naturaleza de textarea

---

### 5. Button (ya actualizado previamente)

```tsx
default: h-9 px-3 text-button-14   // 36px
sm:      h-7 px-2 text-button-12   // 28px (toolbars)
lg:      h-11 px-4 text-button-16  // 44px (CTAs)
icon:    h-9 w-9                   // 36px cuadrado
```

---

## 🔧 Componentes de Toolbars Estandarizados

### DashboardQuickSearch

**Antes:**
```tsx
<Button type="submit" variant="outline"><Search /></Button>
```

**Después:**
```tsx
<Button type="submit" variant="outline" size="icon">
  <Search className="h-4 w-4" />
</Button>
```

**Cambios:**
- ✅ Añadido `size="icon"` → h-9 w-9 (botón cuadrado 36px)
- ✅ Ícono con tamaño explícito `h-4 w-4`

---

### ModelsToolbar

**Antes:**
```tsx
<Button variant="outline" size="sm" className="h-10 gap-1.5">
  <ListFilter className="h-4 w-4" />
  <span className="hidden sm:inline">{currentCountry || 'País'}</span>
</Button>
```

**Después:**
```tsx
<Button variant="outline" size="icon" className="flex-shrink-0">
  <ListFilter className="h-4 w-4" />
  <span className="sr-only">{currentCountry || 'País'}</span>
</Button>
```

**Cambios:**
- ✅ `size="sm" className="h-10"` → `size="icon"` (36px consistente)
- ✅ Texto oculto visualmente, accesible para screen readers (`sr-only`)
- ✅ Botón de acción principal sin `size="sm" className="h-10"` → usa `default` (36px)
- ✅ Removido override de altura manual

**Resultado:**
- Todos los botones y campos: **36px de altura**
- Botones de vista (List/Grid): **32px** (`h-8 w-8`) dentro de contenedor con borde

---

### ProjectsToolbar

**Sin cambios necesarios:**
- Ya usa `Input` con altura consistente
- Ya usa `SelectTrigger` con altura consistente
- Todos los componentes alineados automáticamente a 36px

---

## 📊 Tabla de Consistencia

| Componente | Altura | Padding H | Font | Estado |
|------------|--------|-----------|------|--------|
| Input | 36px (h-9) | 12px (px-3) | text-copy-14 | ✅ |
| Select | 36px (h-9) | 12px (px-3) | text-copy-14 | ✅ |
| Combobox | 36px (h-9) | 12px (px-3) | text-copy-14 | ✅ |
| Button default | 36px (h-9) | 12px (px-3) | text-button-14 | ✅ |
| Button icon | 36px (h-9) | — | — | ✅ |
| Badge medium | 24px (h-6) | 8px (px-2) | text-xs | ✅ |
| Textarea | Variable | 12px (px-3) | text-copy-14 | ✅ |

---

## 🎨 Ejemplos de Uso

### Formulario Estándar

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label>Nombre del Proyecto</Label>
    <Input placeholder="Ej: Campaña Verano 2025" />
  </div>
  
  <div className="space-y-2">
    <Label>País</Label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar país" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="mx">México</SelectItem>
        <SelectItem value="gt">Guatemala</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <div className="flex gap-2">
    <Button variant="outline">Cancelar</Button>
    <Button>Crear Proyecto</Button>
  </div>
</form>
```

**Resultado:** Todos los campos tienen 36px de altura.

---

### Toolbar con Búsqueda y Filtros

```tsx
<div className="flex items-center gap-2">
  {/* Input de búsqueda: 36px */}
  <div className="relative w-64">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
    <Input className="pl-9" placeholder="Buscar..." />
  </div>
  
  {/* Botón de filtro: 36px */}
  <Button variant="outline" size="icon">
    <ListFilter className="h-4 w-4" />
  </Button>
  
  {/* Botón de acción: 36px */}
  <Button>
    <PlusCircle className="h-4 w-4" />
    Añadir
  </Button>
</div>
```

**Resultado:** Todos los controles alineados perfectamente.

---

## 🚫 Anti-Patrones

### ❌ EVITAR: Alturas inconsistentes

```tsx
// ❌ Mezclar tamaños
<Input className="h-10" />           {/* 40px */}
<Button size="sm" className="h-10">  {/* Override manual */}

// ✅ CORRECTO
<Input />                            {/* 36px por defecto */}
<Button>                             {/* 36px por defecto */}
```

### ❌ EVITAR: Padding vertical redundante

```tsx
// ❌ Con altura fija, py es redundante
<Input className="py-2" />

// ✅ CORRECTO - La altura fija controla todo
<Input />
```

### ❌ EVITAR: Tipografías genéricas

```tsx
// ❌ text-sm es inconsistente
<Input className="text-sm" />

// ✅ CORRECTO - Usa roles
// (Ya aplicado en el componente base)
```

---

## 📋 Checklist de Implementación

Al crear un nuevo componente de entrada/control:

- [ ] ¿Usa `h-9` (36px) como altura base?
- [ ] ¿Usa `text-copy-14` o `text-button-14` según sea input/button?
- [ ] ¿Evita `py-*` redundante con altura fija?
- [ ] ¿Usa `px-3` (12px) para padding horizontal?
- [ ] ¿Los íconos internos usan `h-4 w-4` (16px)?
- [ ] ¿Es accesible (labels, sr-only, aria-*)?

---

## 🔄 Migración de Código Existente

### Buscar y Reemplazar

```bash
# Buscar componentes con altura inconsistente
grep -r "h-10" src/components/ui/

# Buscar botones con override de altura
grep -r 'size="sm" className="h-' src/
```

### Patrones a Actualizar

1. **Input/Select con h-10:**
   - Remover `h-10`, el componente base ya usa `h-9`

2. **Botones con `size="sm" className="h-10"`:**
   - Cambiar a `size="default"` (sin className)
   - O usar `size="icon"` si es solo ícono

3. **Text genéricos (`text-sm`):**
   - Ya están en componentes base, no override necesario

---

**Última actualización:** Octubre 2025
**Componentes estandarizados:** Input, Select, Combobox, Textarea, Button, Badge
