# DESIGN_SYSTEM.md (NYXA v3.0 - Lite)

**Estándar:** Material Design 3 (2025 Expressive)
**Estado:** 🟢 Sincronizado con Codebase
**Tema:** Purple (Primary: `#87189D`)

## 1. 🏗️ Fundamentos del Sistema

### 1.1 Color System (Semantic & Dynamic)
No usar hex codes. Usar clases/tokens semánticos.

#### Roles Semánticos (Estados)
| Rol | Token | Clase Tailwind | Uso |
|:---|:---|:---|:---|
| **Primary** | `--access-purple` | `text/bg-access-purple` | Brand, navegación activa. |
| **Success** | `--green` | `text/bg-green` | Éxito, pagado, dinero recibido. |
| **Error** | `--red` | `text/bg-red` | Error, rechazo, pérdida. |
| **Warning** | `--orange` | `text/bg-orange` | Advertencia, pausa, retenido. |
| **Pending** | `--yellow` | `text/bg-yellow` | En revisión, pendiente de pago/cobro. |
| **Info** | `--blue` | `text/bg-blue` | Informativo, borrador, facturado. |
| **Processing** | `--cyan` | `text/bg-cyan` | En tránsito, margen bruto. |
| **Fresh** | `--mint` | `text/bg-mint` | Nuevo, disponible. |
| **Progress** | `--teal` | `text/bg-teal` | Activo alternativo. |
| **Archived** | `--indigo` | `text/bg-indigo` | Histórico, cerrado. |
| **Special** | `--pink` | `text/bg-pink` | Eventos, destacados. |
| **Organic** | `--brown` | `text/bg-brown` | Terreno, neutral cálido. |

#### Tokens Especiales (UI Única)
1. **WOW Progress Strip:** Requiere gradiente específico (`--wow-progress-*`) en modo oscuro.
2. **Glassmorphism (Navbar):** `bg-white/30 dark:bg-black/40 backdrop-blur-xl`.

#### Mapeo M3 → Tailwind
| M3 | Tailwind |
|:---|:---|
| Surface | `bg-background` / `bg-card` |
| On Surface | `text-foreground` |
| Outline | `border-border` |
| Surface Variant | `bg-muted` |
| On Surface Variant | `text-muted-foreground` |

### 1.2 Tipografía (Strict 4-Scale)
Solo existen estos 4 tamaños.

| Token | Clase | Tamaño | Uso |
|:---|:---|:---|:---|
| **Label** | `text-label` | 11px | Metadatos, ayudas. |
| **Body** | `text-body` | 13px | Default text, inputs, botones. |
| **Title** | `text-title` | 18.72px | Encabezados de cards/secciones. |
| **Display** | `text-display` | 22.46px | KPIs, H1, números grandes. |

### 1.3 Spacing & Layout (8pt Grid)

| Token | Valor | Uso |
|:---|:---|:---|
| `xs` | 4px | Gap icon-text |
| `sm` | 8px | Gap elementos inline |
| `md` | 16px | Padding interno cards |
| `lg` | 24px | Padding página, secciones |
| `xl` | 32px | Bloques grandes |

**Ancho Sidebar:** 240px (Expandido), 56px (Colapsado).
**Page Header:** Siempre `flex-col` gap-4 (mobile) -> `flex-row` (desktop).

---

## 2. 🧩 Workflow & Estados

### Proyectos
| Estado | Color |
|:---|:---|
| **Borrador** | Azul |
| **En revisión** | Amarillo |
| **Aprobado** | Morado |
| **Rechazado** | Rojo |
| **Archivado** | Indigo |
| **Enviado** | Cyan |

### Finanzas
| Estado | Color | Lógica |
|:---|:---|:---|
| **Pendiente** | Amarillo | Dinero esperado/obligación. |
| **Pagado/Cobrado** | Verde | Dinero recibido/saldado. |
| **Facturado** | Azul | Documento emitido. |
| **Vencido** | Rojo | Riesgo/Pérdida. |

> **Regla de Oro:** NUNCA usar morado para dinero. Verde es exclusivo de dinero completado.

**Display Moneda:**
- **GTQ:** `Q 1,500.00`
- **USD:** `USD 200 (Q 1,534.02)` (Equivalente al lado, nunca abajo).

---

## 3. 🛠️ Principales Componentes (Reglas Clave)

### Botones (`button.tsx`)
- **Primary:** `variant="default"` (High emphasis)
- **Secondary:** `variant="secondary"` (Medium)
- **Terciary:** `variant="ghost"` (Low/Icon)
- **Outlined:** `variant="outline"`
- **Mobile Height:** 48px (`h-12`). **Desktop:** 40px (`h-10`).

### Cards (`card.tsx`)
- **Radio:** `rounded-lg` (8px).
- **Estilo:** `bg-card border border-border`.
- **Shadow:** `shadow-sm` solo si es elevable.

### Inputs (`input.tsx`)
- **Altura:** 40px (md) / 48px (mobile).
- **Label:** Externa (arriba).
- **Error:** Reemplaza helper text (no layout shift).

### Listas
- **Leading:** Avatar/Icon (24-40px).
- **Trailing:** Acción secundaria o meta-data.
- **Content:** Headline (16px) + Supporting (14px).

### Modals (`dialog.tsx`)
- **Radio:** `rounded-xl` (16px).
- **Overlay:** `bg-background/80 backdrop-blur-sm`.
- **Botones:** Alineados a la derecha (`justify-end`).

---

## 4. ✅ Calidad Checks

1. **No Grises:** Usar `muted-foreground` para texto secundario.
2. **Focus:** Usar `ring`, nunca quitar outline sin reemplazo.
3. **Responsive:** Mobile-first. Botones `w-full` en mobile.
4. **Motion:** `duration-200` ease-out para acciones micro. `duration-500` para layout.
