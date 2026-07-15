# Estructura de Carpetas

> Arquitectura híbrida: **UI genérica** en `components/` + **features específicas** por dominio.

---

## 🎯 Principio Fundamental

```
┌─────────────────────────────────────────────────────────────────────┐
│  REGLA DE ORO: Diseño y lógica SIEMPRE separados                   │
│                                                                     │
│  *.styles.css    → Tailwind @apply + CSS Variables                 │
│  *.logic.ts      → Funciones, hooks, handlers                      │
│  *.animations.ts → Framer Motion configs (opcional)                │
│  *.types.ts      → Interfaces y tipos                              │
│  *.tsx           → Componente que importa todo                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura Completa

```
mac-estudios-cotizaciones/
│
├── 📂 app/                           # Next.js App Router
│   ├── (auth)/
│   │   └── login/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx              # Lista
│   │   │   ├── [id]/page.tsx         # Editor
│   │   │   └── new/page.tsx
│   │   ├── directory/page.tsx        # Agencias, Marcas, Contactos
│   │   ├── templates/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx                # Layout con sidebar
│   │
│   ├── quote/[uuid]/page.tsx         # Vista pública (sin auth)
│   │
│   ├── api/                          # API Routes (mínimas)
│   │   └── quotes/[id]/actions/route.ts
│   │
│   ├── layout.tsx
│   ├── globals.css
│   └── error.tsx
│
├── 📂 src/
│   │
│   ├── 📂 components/                # UI Genérica Reutilizable
│   │   │
│   │   ├── 📂 ui/                    # Atómicos genéricos
│   │   │   ├── button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.styles.css
│   │   │   │   ├── Button.logic.ts
│   │   │   │   └── Button.types.ts
│   │   │   │
│   │   │   ├── input/
│   │   │   ├── select/
│   │   │   ├── badge/
│   │   │   ├── avatar/
│   │   │   ├── card/
│   │   │   ├── chip-select/
│   │   │   ├── animated-number/
│   │   │   ├── status-icon/
│   │   │   └── spinner/
│   │   │
│   │   └── 📂 layout/                # ⭐ Shell compartido (multi-ruta)
│   │       ├── sidebar/
│   │       │   ├── Sidebar.tsx
│   │       │   ├── Sidebar.styles.css
│   │       │   ├── Sidebar.logic.ts
│   │       │   └── Sidebar.types.ts
│   │       │
│   │       └── navbar/
│   │           ├── Navbar.tsx
│   │           ├── Navbar.styles.css
│   │           └── Navbar.types.ts
│   │
│   ├── 📂 features/                  # Lógica + UI por Dominio
│   │   │
│   │   ├── 📂 auth/
│   │   │   ├── auth.hooks.ts
│   │   │   ├── auth.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 dashboard/             # ⭐ Feature del Dashboard
│   │   │   ├── 📂 components/
│   │   │   │   ├── kpi/
│   │   │   │   │   ├── StatCard.tsx
│   │   │   │   │   ├── StatCard.styles.css
│   │   │   │   │   ├── StatCard.logic.ts
│   │   │   │   │   └── StatCard.types.ts
│   │   │   │   │
│   │   │   │   ├── estacionalidad/
│   │   │   │   │   ├── SeasonalityChart.tsx
│   │   │   │   │   ├── SeasonalityChart.styles.css
│   │   │   │   │   ├── SeasonalityChart.logic.ts
│   │   │   │   │   ├── SeasonalityChart.types.ts
│   │   │   │   │   └── SeasonalityChart.animations.ts
│   │   │   │   │
│   │   │   │   ├── top-marcas/
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   └── actividad-reciente/
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── dashboard.hooks.ts
│   │   │   ├── dashboard.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 quotes/
│   │   │   ├── 📂 components/
│   │   │   │   ├── quote-editor/
│   │   │   │   ├── quote-header/
│   │   │   │   └── quote-preview/
│   │   │   ├── quotes.hooks.ts
│   │   │   ├── quotes.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 directory/
│   │   │   ├── 📂 components/
│   │   │   │   ├── entity-card/
│   │   │   │   └── entity-form/
│   │   │   ├── directory.hooks.ts
│   │   │   └── index.ts
│   │   │
│   │   └── 📂 public-quote/          # Vista pública con animaciones
│   │       ├── 📂 components/
│   │       │   └── quote-glass-card/
│   │       └── index.ts
│   │
│   ├── 📂 lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils/
│   │       └── cn.ts
│   │
│   ├── 📂 stores/                    # Zustand
│   │   └── index.ts
│   │
│   └── 📂 types/                     # Tipos globales
│       └── index.ts
│
├── 📂 public/
│   ├── images/
│   ├── videos/
│   └── audio/
│
└── 📂 _temp_docs/                    # Documentación
    └── docs/
```

---

## 🔑 Diferencia Clave

| Ubicación | Criterio | Ejemplos |
|-----------|----------|----------|
| `components/ui/` | Atómico, sin lógica de negocio, usado en cualquier parte | Button, Input, Badge, Select, AnimatedNumber |
| `components/layout/` | Shell/estructura, aparece en múltiples rutas | Sidebar, Navbar, Footer |
| `features/*/components/` | Específico de UN dominio, no se usa en otro lado | SeasonalityChart, QuoteEditor, StatCard |

---

## 📦 Estructura de un Componente

```
component-name/
├── ComponentName.tsx          # JSX + imports
├── ComponentName.styles.css   # @apply + var()
├── ComponentName.logic.ts     # Hooks, handlers (si tiene lógica)
├── ComponentName.types.ts     # Props, interfaces
└── ComponentName.animations.ts # Framer Motion (opcional)
```

**Reglas:**
- Sin `index.ts` barrel files en `components/ui/` → imports directos
- `features/` sí usa `index.ts` para exports públicos
- Máximo 200 líneas por archivo

---

## 🚀 Imports

```typescript
// Componente UI genérico
import { Button } from '@/components/ui/button/Button';

// Feature específica
import { SeasonalityChart } from '@/features/dashboard';

// Hook de feature
import { useDashboard } from '@/features/dashboard';
```

---

> **Última actualización**: Febrero 2026
