# CONVENTIONS.md — Referencia Rápida del Proyecto

> **Propósito**: Un solo archivo con TODAS las reglas críticas. Si un agente AI solo lee un archivo, que sea este.

---

| Deploy | Vercel (free tier) | — |


---

## 2. Arquitectura de Archivos

### Co-locación por Sección en Ruta

Cada página co-localiza sus secciones como **private folders** (`_prefix/`) de Next.js directamente dentro de la ruta. Esto elimina la carpeta `components/templates/`.

```
src/
├── app/                           # App Router (páginas, layouts y secciones co-localizadas)
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx            # Pegamento: importa secciones, arma layout
│   │       ├── _hero/              # Sección co-localizada (private folder)
│   │       │   ├── Hero.tsx
│   │       │   ├── Hero.styles.css
│   │       │   ├── Hero.types.ts
│   │       │   ├── Hero.logic.ts       # (opcional)
│   │       │   └── Hero.animations.ts  # (opcional)
│   │       └── _login-form/
│   │           ├── LoginForm.tsx
│   │           ├── LoginForm.styles.css
│   │           └── LoginForm.types.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Importa _kpi-cards, _top-brands, _activity, etc.
│   │   │   ├── _kpi-cards/
│   │   │   │   ├── KpiCards.tsx
│   │   │   │   ├── KpiCards.styles.css
│   │   │   │   ├── KpiCards.types.ts
│   │   │   │   ├── KpiCards.logic.ts
│   │   │   │   └── KpiCards.animations.ts
│   │   │   ├── _top-brands/
│   │   │   │   ├── TopBrands.tsx
│   │   │   │   ├── TopBrands.styles.css
│   │   │   │   ├── TopBrands.types.ts
│   │   │   │   └── TopBrands.logic.ts
│   │   │   ├── _activity/
│   │   │   └── _seasonality/
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   ├── _quote-list/
│   │   │   ├── _quote-filters/
│   │   │   └── new/
│   │   │       ├── page.tsx
│   │   │       ├── _editor-header/
│   │   │       ├── _editor-sections/
│   │   │       └── _editor-preview/
│   │   └── ...                     # directory/, catalog/, templates/, settings/
│   └── (client)/
│       └── quote/[id]/
│           ├── page.tsx
│           ├── _quote-header/
│           ├── _quote-body/
│           └── _quote-actions/
├── components/
│   ├── ui/                         # Atómicos COMPARTIDOS: Button, Input, Badge, Select, Toast
│   └── layout/                     # Shell compartido: Sidebar, Navbar, Header
├── features/                       # Lógica de dominio reutilizable (hooks, utils, types)
│   ├── auth/
│   ├── quotes/
│   └── directory/
├── lib/
│   ├── supabase/                   # client.ts, server.ts
│   └── utils/                      # cn(), formatCurrency()
├── stores/                         # Zustand stores
└── types/                          # TypeScript interfaces globales
```

> ⚠️ **`components/templates/` YA NO EXISTE**. Las secciones de pantalla viven co-localizadas en su ruta.
> `components/ui/` y `components/layout/` se mantienen para piezas compartidas entre vistas.

### Arquitectura de 3 Vistas (AISLADAS)

La app tiene **3 vistas completamente independientes**. Cambios en una NO deben afectar las otras.

| Vista | Route Group | Layout | Descripción |
|-------|------------|--------|-------------|
| **Login** |Pantalla de autenticación |
| **Dashboard** | `(dashboard)/` | App principal del usuario autenticado supabase |
| **Cliente** | 

> ⚠️ **Regla**: Cada vista tiene su propio layout, sus propios estilos, y sus propias secciones co-localizadas. NO comparten shell UI (sidebar, navbar, topbar).

### Patrón de archivos por sección/componente (3 obligatorios + 2 opcionales)
```
_section-name/                      # Private folder con _ prefix (Next.js lo ignora como ruta)
├── SectionName.tsx                 # JSX + imports (OBLIGATORIO)
├── SectionName.styles.css          # @apply + var() (OBLIGATORIO)
├── SectionName.types.ts            # Interfaces y props (OBLIGATORIO)
├── SectionName.logic.ts            # Hooks y lógica (opcional si es puro visual)
└── SectionName.animations.ts       # SOLO definiciones de animación (opcional si no anima)
```

> ⚠️ **`animations.ts` contiene ÚNICAMENTE** definiciones de animación: objetos de `transition`, `variants`, `spring configs`, `keyframes`, duraciones y easings. **NO hooks, NO lógica de estado, NO side-effects**. Si un componente no tiene animaciones, el archivo se omite.
> ⚠️ **`logic.ts`** se omite si la sección es puramente visual (sin hooks ni handlers).

---

## 3. Reglas de CSS y Diseño

> 💡 **Fuente de Verdad**: Para cualquier cuestión de diseño, colores, sombras, tipografías, espaciados o tokens, `src/app/globals.css` es la única fuente de verdad. No inventar valores ad-hoc.