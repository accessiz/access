# Guía de Uso del Design System (Geist/Vercel)

Esta guía documenta cómo usar consistentemente el sistema de diseño implementado en NYXA.

## 🎨 Principios de Diseño

### 1. Usa Variables del Tema (NUNCA colores hardcoded)

✅ **CORRECTO:**
```tsx
<div className="bg-background text-foreground border-border">
<Card className="bg-card text-card-foreground">
<p className="text-muted-foreground">
```

❌ **INCORRECTO:**
```tsx
<div className="bg-white text-black dark:bg-black dark:text-white">
<div className="text-gray-500">
```

**Variables disponibles:**
- `bg-background` / `text-foreground` → Fondo/texto principal
- `bg-card` / `text-card-foreground` → Tarjetas elevadas
- `bg-muted` / `text-muted-foreground` → Fondos sutiles/texto secundario
- `bg-primary` / `text-primary-foreground` → Acento principal (morado)
- `bg-destructive` / `text-destructive-foreground` → Errores/eliminaciones
- `border-border` → Bordes
- `bg-input` → Campos de formulario

---

## 📝 Tipografía por Roles

**REGLA DE ORO:** Piensa en el PROPÓSITO del texto, no en el tamaño visual.

### Encabezados (Headings)

Usa para títulos de páginas/secciones:

```tsx
<h1 className="text-heading-72">      {/* Hero marketing (72px) */}
<h1 className="text-heading-48">      {/* Título principal página (48px) */}
<h1 className="text-heading-32">      {/* Título sección dashboard (32px) */}
<h2 className="text-heading-24">      {/* Subtítulo sección (24px) */}
<h3 className="text-heading-20">      {/* Título de tarjeta (20px) */}
```

**Escala completa:** `text-heading-72/64/56/48/40/32/24/20/16/14`

### Copy (Cuerpo de texto)

Usa para párrafos y contenido principal:

```tsx
<p className="text-copy-24">          {/* Hero marketing (24px) */}
<p className="text-copy-16">          {/* Párrafo principal (16px) */}
<p className="text-copy-14">          {/* Párrafo estándar (14px) */}
<p className="text-copy-13">          {/* Texto secundario (13px) */}
<code className="text-copy-13-mono">  {/* Código inline */}
```

**Escala completa:** `text-copy-24/20/18/16/14/13` + `text-copy-13-mono`

### Labels (Etiquetas y UI)

Usa para labels de formularios, menús, tooltips:

```tsx
<Label className="text-label-14">           {/* Label de formulario (14px) */}
<span className="text-label-13">            {/* Texto secundario UI (13px) */}
<span className="text-label-12 uppercase">  {/* CAPS pequeñas (12px) */}
<code className="text-label-14-mono">       {/* Código en UI */}
```

**Escala completa:** `text-label-20/18/16/14/13/12` + variantes `-mono`

### Botones

Usa exclusivamente en componentes `<Button>`:

```tsx
<Button className="text-button-16">  {/* Botón grande (16px) */}
<Button className="text-button-14">  {/* Botón estándar (14px) */}
<Button className="text-button-12">  {/* Botón mini (12px, raro) */}
```

---

## 📏 Espaciado (Sistema 4/8pt)

**REGLA DE ORO:** Usa SOLO la escala de Tailwind. NUNCA valores arbitrarios.

### Escala de Referencia

| Clase       | Valor    | Uso Común                          |
|-------------|----------|------------------------------------|
| `p-1/m-1`   | 4px      | Espacios mínimos                   |
| `p-2/m-2`   | 8px      | Padding de badges/pills            |
| `p-3/m-3`   | 12px     | Padding interno pequeño            |
| `p-4/m-4`   | 16px     | Padding de botones/inputs          |
| `p-6/m-6`   | 24px     | Padding de cards/secciones         |
| `p-8/m-8`   | 32px     | Márgenes entre secciones           |
| `p-12/m-12` | 48px     | Espaciado generoso                 |
| `p-16/m-16` | 64px     | Padding de modales/heros           |
| `p-24/m-24` | 96px     | Márgenes de página                 |
| `p-56/m-56` | 224px    | Espacios dramáticos (hero)         |

✅ **CORRECTO:**
```tsx
<div className="py-24 sm:py-56">
<Card className="p-6">
<div className="space-y-8">
```

❌ **INCORRECTO:**
```tsx
<div className="py-[220px]">      {/* ❌ Arbitrario */}
<Card className="p-[30px]">       {/* ❌ No es múltiplo de 4/8 */}
<div style={{ marginTop: '30px' }}> {/* ❌ Inline styles */}
```

---

## 🔲 Bordes

El sistema usa `--radius: 0rem` (bordes cuadrados, estilo Geist).

✅ **CORRECTO:**
```tsx
<Card className="rounded-lg">     {/* Usa var(--radius) → 0 */}
<Button className="rounded-md">   {/* Consistente */}
```

Si en el futuro quieres bordes sutiles, cambia SOLO:
```css
/* globals.css */
--radius: 0.375rem; /* 6px → Se aplicará AUTOMÁTICAMENTE a todo */
```

---

## 🎯 Casos de Uso Comunes

### Página de Dashboard

```tsx
<div className="space-y-6 p-8 md:p-12">
  <header>
    <h1 className="text-heading-32">Dashboard</h1>
    <p className="text-muted-foreground">Resumen general de proyectos.</p>
  </header>
  
  <Card>
    <CardHeader>
      <CardTitle>Resumen de Proyectos</CardTitle>  {/* text-heading-20 aplicado automáticamente */}
      <CardDescription>Conteos por estado.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-copy-14">Contenido principal</div>
    </CardContent>
  </Card>
</div>
```

### Hero de Cliente

```tsx
<header className="py-24 sm:py-56">
  <p className="text-label-12 uppercase tracking-widest text-muted-foreground">
    PROYECTO
  </p>
  <h1 className="text-heading-40 sm:text-heading-48 md:text-heading-72">
    {projectName}
  </h1>
</header>
```

### Formulario

```tsx
<form className="space-y-8">
  <div className="space-y-2">
    <Label className="text-label-14">Nombre del Proyecto</Label>
    <Input className="bg-input border-border" />
  </div>
  <Button className="text-button-14">Crear Proyecto</Button>
</form>
```

---

## 🚫 Anti-Patrones (Evitar)

1. **Colores hardcoded:**
   ```tsx
   ❌ className="text-white bg-black"
   ✅ className="text-foreground bg-background"
   ```

2. **Tamaños tipográficos genéricos:**
   ```tsx
   ❌ className="text-3xl font-bold"
   ✅ className="text-heading-32"
   ```

3. **Valores arbitrarios de spacing:**
   ```tsx
   ❌ className="py-[220px]"
   ✅ className="py-56"
   ```

4. **Mezclar HSL con RGB:**
   ```tsx
   ❌ hsl(var(--primary))      {/* Variables son RGB */}
   ✅ rgb(var(--primary))
   ```

---

## 🔍 Checklist de Auditoría

Antes de hacer un commit, verifica:

- [ ] ¿Uso `bg-background` en lugar de `bg-white`/`bg-black`?
- [ ] ¿Uso clases tipográficas por ROL (`text-heading-*`, `text-copy-*`)?
- [ ] ¿Mis espacios son múltiplos de 4px (`p-4`, `p-6`, `p-8`)?
- [ ] ¿Uso `rounded-lg`/`rounded-md` en lugar de valores hardcoded?
- [ ] ¿Evito `text-xl`/`text-3xl` y uso la escala Geist?

---

## 📚 Recursos

- **Íconos:** https://vercel.com/geist/icons (recomendado para consistencia)
- **Variables del tema:** Ver `src/app/globals.css`
- **Configuración Tailwind:** Ver `tailwind.config.ts`

---

**Última actualización:** Octubre 2025
