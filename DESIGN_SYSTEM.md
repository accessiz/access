# DESIGN_SYSTEM.md (NYXA v3.0)

**Estándar:** Material Design 3 (2025 Expressive)
**Estado:** 🟢 Sincronizado con Codebase & M3 Guidelines
**Tema:** Purple (Primary: `#87189D`)

---

## 0. 👤 Usuario Principal (Brief)

> **Diseñamos para María, no para nosotros.**

### Contexto Real
María es la asistente principal de una agencia de modelos en Guatemala. Su perfil:

| Factor | Realidad |
|--------|----------|
| **Familia** | Madre de 2 hijos pequeños que requieren mucha atención |
| **Trabajo** | Tiene OTRO trabajo además de este |
| **Jefe** | El dueño es desorganizado, mandón, y exigente |
| **Carga** | Ella lleva la mayor parte del trabajo operativo |
| **Equipo** | No hay empleados fijos, solo freelancers |
| **Estrés** | ALTO - constantemente interrumpida |

### Implicaciones de Diseño

Basado en **Steve Jobs**, **Des Traynor (Intercom)**, y **Don Norman**:

| Principio | Aplicación |
|-----------|------------|
| **Simplicidad (Jobs)** | Cada elemento debe GANAR su lugar en pantalla |
| **JTBD (Traynor)** | María está BUSCANDO, no navegando. La búsqueda es protagonista. |
| **Signifiers (Norman)** | Todo debe ser obvio. ¿Qué puedo hacer? ¿Qué significa esto? |
| **Error Tolerance (Norman)** | Ella está distraída. Los errores deben ser reversibles. |
| **Cognitive Load** | Su cerebro ya está agotado. Mínima información por pantalla. |

### Reglas Derivadas
1. **Máximo 3-4 datos** visibles en items de lista
2. **Búsqueda siempre visible** y grande
3. **Indicadores de estado claros** (ocupado hoy = dot rojo pulsante)
4. **Acciones con etiquetas**, no solo iconos
5. **Mobile-first** - ella probablemente está con el teléfono mientras cuida niños

---

## 1. 🏗️ Fundamentos del Sistema (Core)

#### 1.1 Sistema de Color

El sistema utiliza **roles semánticos** y elimina la dependencia del gris para estados comunicativos. No uses hex codes duros; usa variables CSS `--*` (y en Tailwind, las clases semánticas).

> [!IMPORTANT]
> **Regla base:** Si no hay gris, ningún estado es “invisible”. Todo comunica algo a través de colores con significado cognitivo fuerte.

**Fuente de verdad:** `src/app/globals.css` (tokens en `:root` y `.dark`). `tailwind.config.ts` define cómo se consumen (ej. `rgb(var(--primary) / <alpha-value>)`).

#### F. Colores Vibrantes (Paleta Semántica)

> [!TIP]
> Estos colores son la paleta base para estados visuales, badges, iconos, gráficas y feedback. Todos están disponibles como clases Tailwind (ej: `bg-cyan`, `text-purple`, `border-orange/20`).

| Color | Token | Light (raw) | Dark (raw) | Uso Semántico |
| :--- | :--- | :--- | :--- | :--- |
| **Red** | `--red` | `255 56 60` | `255 69 69` | Errores, rechazos, cancelaciones, pérdidas. |
| **Orange** | `--orange` | `255 149 0` | `255 159 10` | Advertencias fuertes, pausas, atención urgente. |
| **Yellow** | `--yellow` | `255 204 0` | `255 214 10` | Pendiente, en revisión, requiere acción. |
| **Green** | `--green` | `52 199 89` | `48 209 88` | Éxito, pagado, aprobado, dinero recibido. |
| **Mint** | `--mint` | `0 200 179` | `0 218 195` | Estados frescos, nuevo, disponible. |
| **Teal** | `--teal` | `0 195 208` | `0 210 224` | Progreso, activo alternativo. |
| **Cyan** | `--cyan` | `0 192 232` | `60 211 254` | En tránsito, enviado, procesando. |
| **Blue** | `--blue` | `0 122 255` | `10 132 255` | Informativo, draft, interno. |
| **Indigo** | `--indigo` | `97 85 245` | `109 124 255` | Archivado, histórico, inactivo. |
| **Purple** | `--purple` | `203 48 224` | `176 47 194` | Estados finales (completado), CTAs principales. |
| **Access Purple** | `--access-purple` | `134 50 155` | `99 13 135` | Brand primario (primary), navegación activa. |
| **Pink** | `--pink` | `255 45 85` | `255 55 95` | Especiales, eventos, destacados. |
| **Brown** | `--brown` | `172 127 94` | `183 138 102` | Terreno, orgánico, neutral cálido. |


#### E. Reglas de Uso (importante)

1. **Nunca** uses hex hardcode en componentes. Consume tokens (`bg-*`, `text-*`, `border-*`).
2. Para overlays usa `popover`/`card`, no colores nuevos.
3. Para texto secundario usa `text-muted-foreground` (no grises arbitrarios).
4. Para focus usa `ring` (no `outline` custom).

#### F. Tokens Especiales (Elemento Único)

> **Elemento único y especial:** *WOW Progress Strip* en la **vista pública del cliente**.

Este elemento requiere un gradiente específico (no “token estándar”) para lograr el look premium sin “blancos” en modo oscuro.

**Fuente de verdad (código):** `src/app/globals.css`

**Tokens (raw RGB):**

| Uso | Token | Light (raw RGB) | Dark (raw RGB) | Hex aproximado |
| :--- | :--- | :--- | :--- |
| **Edge** | `--wow-progress-bg-edge` | `255 255 255` | `13 2 15` | `#FFFFFF` / `#0D020F` |
| **Mid** | `--wow-progress-bg-mid` | `243 231 245` | `27 4 31` | `#F3E7F5` / `#1B041F` |

**Gradiente requerido (stops):**
- 20% → `--wow-progress-bg-edge`
- 50% → `--wow-progress-bg-mid`
- 80% → `--wow-progress-bg-edge`

**Modo claro (Light):**
- La superficie del WOW progress strip es **sólida** `rgb(var(--card))` (sin gradientes).
- El borde animado se mantiene; el gradiente especial aplica solo en modo oscuro.

**Reglas:**
1. ✅ Permitido **solo** para `.client-wow-progress`.
2. ❌ No reutilizar estos tokens en otros componentes (no forman parte del set semántico M3).
3. En componentes/TSX, nunca usar hex; siempre consumir vía `rgb(var(--wow-progress-*) / <alpha>)`.

---

> **Elemento único:** *Calendar Dropdown* en la **vista pública del cliente** (Navbar).

Este dropdown utiliza **glassmorphism** para lograr un efecto premium semi-transparente.

**Ubicación:** `src/app/c/_components/ClientNavbar.tsx` → `PopoverContent`

**Clases Tailwind aplicadas:**
```
bg-white/30 dark:bg-black/40 backdrop-blur-xl backdrop-saturate-150 border border-black/5 dark:border-white/15 shadow-2xl
```

**Descripción de propiedades:**
| Propiedad | Valor | Efecto |
| :--- | :--- | :--- |
| `bg-white/30` | Blanco 30% | Transparencia alta para notar fondo |
| `bg-black/40` | Negro 40% | Transparencia oscura |
| `backdrop-blur-xl` | Desenfoque alto | Definición "hielo" |
| `backdrop-saturate-150` | Saturación 150% | Realza colores traseros |
| `border-black/5` | Borde oscuro mínimo | Limita en light mode |
| `border-white/15` | Borde claro suave | Limita en dark mode |
| `shadow-2xl` | Sombra extra grande | Profundidad máxima |

**Nota de Implementación:**
El *overlay* global (`fixed inset-0`) es `bg-black/20` **SIN blur** para maximizar el contraste del glassmorphism local.

**Reglas:**
1. ✅ Permitido **solo** para el dropdown de calendario en `ClientNavbar`.
2. ❌ No aplicar glassmorphism a otros popovers sin aprobación de diseño.

#### G. Mapeo M3 → Tokens Actuales (guía práctica)

Usamos lenguaje M3 como guía, pero **en código** se consume este mapeo:

| Rol M3 (conceptual) | En nuestra app (Tailwind / tokens) | Nota |
| :--- | :--- | :--- |
| `surface` | `bg-background` (base) o `bg-card` (contenedores) | Evitar inventar “levels” si no existen como tokens. |
| `on-surface` | `text-foreground` | Texto principal. |
| `surface-variant` | `bg-muted` | Fondos sutiles (chips/rows). |
| `on-surface-variant` | `text-muted-foreground` | Texto secundario / desactivado visualmente. |
| `outline` / `outline-variant` | `border-border` / `bg-border` | Dividers y bordes. |
| `inverse-surface` | `bg-foreground` | Para snackbars/elementos invertidos. |
| `inverse-on-surface` | `text-background` | Texto sobre superficie invertida. |

#### 1.2 Tipografía (SOLO 4 tamaños)
*Fuente de Verdad: `tailwind.config.ts` (`theme.extend.fontSize`)*

Regla estricta: en todo el producto solo existen estas 4 clases.

| Token | Pixels | Rem (para 16px base) | Uso principal |
| :--- | :---: | :---: | :--- |
| `text-label` | 11px | 0.6875rem | Metadatos, ayudas, counters.  |
| `text-body` | 13 px | 0.8125 rem | Texto por defecto: inputs, tablas, navegación, botones, segmented labels y badges compactos |
| `text-title` | 18.72px | 1.17rem | Títulos de secciones/cards, encabezados de diálogos/paneles. |
| `text-display` | 22.464px | 1.404rem | KPIs, números/valores destacados, hero/title grande (sin tamaños crudos). |

Prohibido:
- `text-heading-*`, `text-copy-*`, `text-label-*`, `text-button-*` (ya no existen)
- `text-sm`, `text-lg`, etc.
- `text-[...]` (tamaños arbitrarios)

---

### 1.3 Lógica de Estados y Workflow (No Gray)

A continuación se detalla la estandarización de estados usando colores con significado cognitivo fuerte.

#### A. Principios de Color Semántico
*   **Morado** → Estado final / aprobado / éxito máximo.
*   **Verde** → Dinero recibido / resuelto.
*   **Amarillo** → Pendiente / atención / en proceso.
*   **Rojo** → Rechazo / error / pérdida.
*   **Azul / Cyan** → Informativo / enviado / borrador / archivado (sin acción inmediata).
*   **Orange** → Advertencia / riesgo leve / bloqueo temporal.
*   **Indigo** → Histórico / archivado con valor.

#### B. Workflow de Proyectos
| Estado | Color | Token | Asociación humana |
| :--- | :--- | :--- | :--- |
| **Borrador** | Azul | `--blue` | Neutral, trabajo interno |
| **Enviado** | Cyan | `--cyan` | En tránsito / comunicado |
| **En revisión** | Amarillo | `--yellow` | Atención / espera |
| **Aprobado** | **Morado (TOP)** | `--purple` | Logro, validado |
| **Completado** | **Morado (TOP)** | `--purple` | Cierre definitivo |
| **Rechazado** | Rojo | `--red` | No aprobado |
| **Archivado** | Indigo | `--indigo` | Histórico con valor |

> 📌 **Borrador ≠ Archivado**: Borrador es azul (activo pero privado). Archivado es índigo (cerrado pero consultable).

#### C. Finanzas – Cobros a Clientes
| Estado | Color | Token | Lógica contable |
| :--- | :--- | :--- | :--- |
| **Pendiente de cobro** | Amarillo | `--yellow` | Dinero esperado |
| **Facturado** | Azul | `--blue` | Documento emitido |
| **Cobrado** | Verde | `--green` | Dinero recibido |
| **Vencido / Incobrable** | Rojo | `--red` | Riesgo / pérdida |
| **Archivado** | Indigo | `--indigo` | Histórico financiero |

#### D. Finanzas – Pagos a Modelos
| Estado | Color | Token | Asociación humana |
| :--- | :--- | :--- | :--- |
| **Pendiente de pago** | Amarillo | `--yellow` | Obligación |
| **Pagado** | Verde | `--green` | Deuda saldada |
| **En disputa / Retenido** | Orange | `--orange` | Advertencia |
| **Cancelado** | Rojo | `--red` | No se paga |
| **Archivado** | Indigo | `--indigo` | Histórico |

> [!IMPORTANT]
> **Nunca** usar morado para dinero. El verde se reserva estrictamente para cuando el dinero ya ha sido transaccionado/recibido.

#### E. Dashboard / KPIs
| Métrica | Color | Motivo |
| :--- | :--- | :--- |
| **Total generado** | Verde | Ganancia |
| **Pagados** | Verde | Flujo positivo |
| **Por cobrar** | Amarillo | Atención |
| **Por pagar** | Orange | Riesgo leve |
| **Margen bruto** | Cyan | Dato analítico |
| **Modelos pendientes** | Rojo | Bloqueo operativo |

---

### 1.4 Uso Estricto del Morado (Regla de Oro)
`--purple: 134 50 155;`

Para mantener el peso psicológico y la autoridad del color de marca, el morado tiene reglas de uso restringidas:

**✅ Úsalo SOLO para:**
*   Aprobado / Completado / Estado final.
*   CTA principal (uno por vista).
*   Highlights de navegación (Sidebar activo).

**❌ NO usarlo para:**
*   Dinero / Finanzas.
*   Estados pendientes o intermedios.
*   Errores o advertencias.

---

### 1.5 Master Grid System (Pixel-Perfect Layout)

> **Regla de Oro:** Todo elemento debe alinearse a la cuadrícula de 8pt. Sin excepciones.

#### A. Estructura de Página Principal

```
┌──────────────────────────────────────────────────────────────────────┐
│                         VIEWPORT (100vw)                             │
├────────────┬─────────────────────────────────────────────────────────┤
│            │                    MAIN CONTENT AREA                    │
│  SIDEBAR   │  ┌──────────────────────────────────────────────────┐   │
│            │  │ HEADER (Título + Acciones)          h: 64px      │   │
│  w: 240px  │  ├──────────────────────────────────────────────────┤   │
│  (15rem)   │  │                                                  │   │
│            │  │ PAGE CONTENT                                     │   │
│ collapsed: │  │ padding: 24px (p-6)                              │   │
│  56px      │  │ gap entre secciones: 24px                        │   │
│            │  │                                                  │   │
│            │  └──────────────────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────────────┘
```

#### B. Espaciado Global (Tokens)

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-xs` | 4px | Micro gaps (icon-text) |
| `--spacing-sm` | 8px | Gaps entre elementos inline |
| `--spacing-md` | 16px | Padding interno cards, gaps de items |
| `--spacing-lg` | 24px | Padding de página, gaps entre secciones |
| `--spacing-xl` | 32px | Separación de bloques grandes |
| `--spacing-2xl` | 48px | Hero sections, separación mayor |

#### C. Alineación Sidebar ↔ Contenido

> **Problema Detectado:** Los íconos del sidebar no alinean con los títulos de sección.

**Solución:** 

```
SIDEBAR (expanded)              CONTENIDO
┌──────────────────────┐       ┌─────────────────────────────────┐
│ px-4 (16px)          │       │ pl-6 (24px)                     │
│                      │       │                                 │
│ ┌──────────────────┐ │       │ ┌─────────────────────────────┐ │
│ │⚙️ Icon  Texto    │ │       │ │ Título de Sección           │ │
│ │  24px   rest     │ │       │ │ ← alignado con ícono        │ │
│ └──────────────────┘ │       │ └─────────────────────────────┘ │
```

| Elemento | Medida | Clase Tailwind |
|----------|--------|----------------|
| Sidebar padding X | 16px | `px-4` |
| Sidebar icon size | 24px | `h-6 w-6` |
| Sidebar gap icon-text | 12px | `gap-3` |
| Content padding left | 24px | `pl-6` |
| Content padding right | 24px | `pr-6` |
| Content padding top | 24px | `pt-6` |

#### D. Page Header Consistente

Todas las páginas deben seguir este patrón exacto:

```jsx
<header className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
  <div>
        <h1 className="text-title font-semibold">Título</h1>
        <p className="text-label text-muted-foreground">Subtítulo/conteo</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Acciones */}
  </div>
</header>
```

| Elemento | Especificación |
|----------|----------------|
| Título (h1) | `text-title`, `font-semibold` |
| Subtítulo | `text-label`, `text-muted-foreground` |
| Gap título-subtítulo | 4px (implícito en div) |
| Padding bottom header | 16px (`pb-4`) |
| Border bottom | `border-b border-border` (1px) |
| Gap header-content | 16px (`space-y-4` en parent) |

#### E. Breakpoints Responsivos

| Breakpoint | Valor | Sidebar | Layout |
|------------|-------|---------|--------|
| `sm` | ≥640px | Colapsado (56px) | Single column |
| `md` | ≥768px | Expandible | Two columns |
| `lg` | ≥1024px | Expandido | Master-Detail |
| `xl` | ≥1280px | Expandido | Master-Detail + Extra space |

#### F. Border Radius

| Elemento | Radio | Clase |
|----------|-------|-------|
| Cards | 8px | `rounded-lg` |
| Inputs | 6px | `rounded-md` |
| Buttons | 6px | `rounded-md` |
| Dialogs | 16px | `rounded-xl` |
| Avatars | 50% | `rounded-full` |
| Badges | 4px | `rounded` |
| Chips | 8px | `rounded-lg` |


### 1.4 Movimiento (Motion)
M3 usa movimiento expresivo. Las transiciones no deben ser instantáneas ni lineales.

#### A. Easing (Curvas de Aceleración)
| Token | Valor CSS (Cubic Bezier) | Uso |
| :--- | :--- | :--- |
| **Emphasized** | `0.2, 0.0, 0.0, 1.0` | **Estándar M3.** Elementos que entran/salen o se expanden mucho. |
| **Standard** | `0.2, 0.0, 0, 1.0` | Cambios simples de propiedades (color, opacidad secundaria). |
| **Sidebar Special** | `0.27, 1.06, 0.18, 1.00` | Exclusivo para el Sidebar (efecto rebote sutil). |
| **Linear** | `linear` | Solo para opacidad (fade-in/out) o loaders rotativos. |

#### B. Duración (Velocidad)
| Escala | Tiempo | Uso |
| :--- | :--- | :--- |
| **Short** | `100ms - 200ms` | Botones, Checkboxes, cambios de estado pequeños. |
| **Medium** | `250ms - 400ms` | Diálogos, Menús desplegables, expansión de Cards. |
| **Long** | `500ms+` | Transiciones de página completa o Sidebar (`750ms`). |

---

## 2. 🧩 Catálogo de Componentes (Guía M3)

### A. Acciones (Actions)

Material 3 define varios tipos de botones. Aquí su mapeo en nuestra App:

**Altura Estándar de Controles (Responsive):**
- **Mobile:** 48px (`h-12`)
- **Tablet/Desktop (`md+`):** 40px (`md:h-10`)

> [!NOTE]
> Esta es la **altura total del control** (tap-target). En `SegmentedControl`, el contenedor NO debe sumar altura extra con padding; usa `ring/outline` en lugar de `border + p-*` si necesitas borde visual.

Aplicar en **botones**, **inputs/search**, y **segmented**.

| Tipo M3 | Archivo / Estado | Regla de Diseño |
| :--- | :--- | :--- |
| **1. Buttons (Common)** | `button.tsx` | **Mapeo de Variantes M3:** <br> 1. **Filled:** `variant="default"` (Alta Énfasis). <br> 2. **Tonal:** `variant="secondary"` (Media Énfasis). <br> 3. **Elevated:** No existe (Usar `secondary` + `shadow`). <br> 4. **Outlined:** `variant="outline"` (Baja Énfasis/Bordes). <br> 5. **Text:** `variant="ghost"` (Iconos/Tablas). |
| **2. Icon Buttons** | `button.tsx` | Usar `size="icon"` y `variant="ghost"`. <br> Ideal para Top Bars o acciones de tabla (`Edit`, `Delete`). |
| **3. Floating Action (FAB)** | `button.tsx` (Custom) | ✅ **Simulado.** Usar `h-14 w-14 rounded-2xl shadow-md`. <br> *Solo una por pantalla.* |
| **4. Extended FAB** | `button.tsx` (Custom) | ✅ **Simulado.** Botón con Icono + Texto. <br> Altura 56px (`h-14`). Radio `rounded-2xl`. |
| **5. Segmented Buttons** | `toggle-group.tsx` | ✅ **Implementado.** Usar para selectores tipo on/off múltiples. |
| **6. Split Button** | `button.tsx` + `dropdown` | ⚠️ **Manual.** Unir un botón y un trigger de dropdown con `gap-px`. |

**Regla de Estándar (Segmented):**
- **O icono, o texto. Nunca ambos en el mismo item.**
- Para filtros de estado (ej. "Todas / En revisión / Aprobadas / Rechazadas"), usar **solo texto**.

#### Reglas de Comportamiento (Best Practices)
1.  **Ancho Dinámico:** Los botones deben ajustarse a su texto (`w-auto`). No cortes el texto.
2.  **Ancho Responsivo:** En móviles o formularios estrechos, el botón puede ocupar todo el ancho (`w-full`).
3.  **Evitar Saturación:** No pongas más de **3 botones** juntos.
    *   *Do:* 1 Filled + 1 Tonal + 1 Text.
    *   *Don't:* 3 Buttons Filled pegados.
    *   *Solución:* Mueve acciones de baja prioridad a un "Menu" (`...`).


---

### B. Comunicación (Communication)

#### 4a. Badges (Dynamic / Chips)
*   **Archivo:** `badge.tsx`
*   **M3 Guideline:** Etiquetas de estado o filtros compactos.
*   **Regla:** Usar variantes semánticas (`success`, `warning`). Radios de 4px (Soft Rect). No confundir con "Red Dots".

#### 4b. Notification Badges (Dots)
*   **Estado:** ⚠️ Implementación CSS (`absolute top-0 right-0`).
*   **Contexto:** Siempre anclados a iconos de navegación (Sidebar, Header, Tabs).
*   **Variantes:**
    1.  **Small (🔴 Unread):** Círculo simple `6dp` (h-1.5). Indica "Novedad sin leer".
    2.  **Large (🔢 Count):** Contenedor numérico (min-height `16dp`). Indica "Cantidad" (ej: `9+`).
*   **Specs:** Usar token semántico (`bg-destructive text-destructive-foreground`) sobre icono. Border radius completo.


#### 5. Progress Indicators (Loading)
*   **Archivo:** `skeleton.tsx`
*   **Estado:** ✅ Skeletons implementados.
*   **Regla:** Preferir **Skeletons** (`animate-pulse`) para carga de contenedores. Para acciones de botón, usar loader inline del propio botón (sin componente spinner global).

#### 6. Snackbars
*   **Archivo:** `sonner.tsx`
*   **M3 Guideline:** Mensajes temporales breves al pie de pantalla.
*   **Regla:** Fondo inverso con tokens existentes: `bg-foreground text-background`. Duración 4-6s. Botón de acción opcional ("Deshacer").

---

### C. Contención (Containment)

#### 7. Cards
*   **Archivo:** `card.tsx` (Default = Outlined + Shadow híbrido)
*   **M3 Standard:** 3 Tipos distintos. Radio **12dp** (`rounded-xl`).
*   **App Reality:** Radio **8px** (`rounded-lg`) por consistencia.

##### Uso
Las cards muestran contenido y acciones sobre un tema único. Deben ser fáciles de escanear para encontrar información relevante y accionable.

##### Tipos de Cards
| Tipo | Estilo App | Descripción |
| :--- | :--- | :--- |
| **Elevated** | `bg-card` + `shadow-sm` | Sombra para mayor separación del fondo. Para contenido movible. |
| **Filled** | `bg-muted` + `border-none` | Separación sutil del fondo. Menor énfasis que Elevated u Outlined. |
| **Outlined** | `bg-card` + `border border-border` + `shadow-none` | Borde visual alrededor del contenedor. Mayor énfasis. **(Default)** |

##### Anatomía
| # | Elemento | Descripción |
| :--- | :--- | :--- |
| 1 | **Container** | Único elemento requerido. Tamaño determinado por el contenido. |
| 2 | **Headline** | Comunica el sujeto de la card (nombre del álbum, artículo). |
| 3 | **Subhead** | Elementos de texto más pequeños (byline, ubicación). |
| 4 | **Supporting text** | Contenido del cuerpo (resumen, descripción). |
| 5 | **Image** | Fotos, ilustraciones y gráficos. |
| 6 | **Button** | Acciones como "Learn more" o "Add to cart". |

##### Bloques de Contenido
Los contenidos se agrupan en bloques con diferentes niveles de énfasis visual según importancia.

##### Dividers en Cards
| Tipo | Uso |
| :--- | :--- |
| **Full-width** | Para contenido que puede expandirse. |
| **Inset** | Para separar contenido relacionado (no cubre todo el ancho). |

##### Media
| Tipo | Descripción |
| :--- | :--- |
| **Thumbnail** | Avatar o logo. |
| **Image** | Fotos, ilustraciones, iconos (ej: clima). |
| **Video** | Contenido de video embebido. |

##### Texto sobre Imágenes
> [!CAUTION]
> No se recomienda colocar texto o iconos sobre imágenes. Si es necesario, añadir un scrim translúcido o forma contenedora debajo para asegurar contraste accesible.

##### Acciones
| Área | Descripción |
| :--- | :--- |
| **Primary action area** | La card completa puede ser un target táctil que expande a pantalla detalle. |
| **Buttons** | Botones para acciones (Learn more, Add to cart). |
| **Icon Buttons** | Iconos para acciones (Save, Heart, Rating). |
| **Selection controls** | Chips, sliders, checkboxes y otros controles. |
| **Linked text** | Enlaces en el texto de soporte. |
| **Overflow Menu** | Menú `...` ubicado en esquina superior-derecha o inferior-derecha. |

##### Cards en Colección
| Layout | Descripción |
| :--- | :--- |
| **Grid** | Cards en cuadrícula. Puede ser staggered o mosaic. |
| **Vertical List** | Cards en lista vertical. |

*   Las cards en colección son **coplanares** (misma elevación) hasta que se levantan o arrastran.
*   Los filtros/ordenamiento se colocan **fuera** de la colección de cards.

##### Diseño Adaptativo
| Factor | Regla |
| :--- | :--- |
| **Posición y alineación** | Cambia según el tamaño de ventana (izq/der/centro). |
| **Ergonomía** | Card horizontal en móvil → vertical más grande en tablet. |
| **Espaciado** | Optimizar espacio según breakpoint. |
| **Columnas** | En pantallas grandes, usar múltiples columnas en lugar de estirar UI. |
| **Compact fallback** | En pantallas pequeñas, considerar reemplazar cards por listas. |

##### Comportamiento
| Interacción | Descripción |
| :--- | :--- |
| **Expanding** | Container transform para revelar contenido. Reservar para momentos hero. |
| **Navigation** | Patrón forward/backward para navegar entre pantallas consecutivas. |
| **Swipe** | Descartar o cambiar estado (archivar, marcar). Solo una acción swipe por card. |
| **Pick up & move** | Mover y reordenar cards. Aumentar elevación al levantar. |
| **Scrolling** | Contenido más alto que el máximo se trunca. Card puede expandirse y scrollear dentro de pantalla. |

##### Medidas
| Atributo | Valor |
| :--- | :--- |
| Container padding | 16dp |
| Border radius (M3) | 12dp (`rounded-xl`) |
| Border radius (App) | 8px (`rounded-lg`) |

#### 8. Dialogs (Modals)
*   **Archivo:** `alert-dialog.tsx` / `dialog.tsx`
*   **Estilo:** `bg-popover` (overlay) o `bg-card` (panel), según el componente.
*   **M3 Guideline:** Interrumpen al usuario para confirmar o informar. 
*   **Regla:** Título (24px), Cuerpo (14px). Botones alineados a la derecha (`flex-end`). Scrim (fondo oscuro) al 32%.

#### 9. Dividers
*   **Archivo:** `separator.tsx`
*   **Regla:** Usar `border-border` (1px) / `bg-border` en separators. Separar grupos lógicos (fechas, secciones).

#### 10. Bottom Sheets
*   **Archivo:** `sheet.tsx`
*   **Estado:** ✅ Implementado (Side Sheet).
*   **Regla:** Usar para formularios largos o filtrado complejo en móviles.

---

### D. Navegación (Navigation)

#### 11. Navigation Drawer (Sidebar)
*   **Archivo:** `sidebar.tsx`
*   **M3 Guideline:** Navegación principal para escritorio.
*   **Regla:** Elemento activo con `active-nav-glow`. Iconos filled para estado activo, outlined para inactivo. Ancho: 240px.

#### 12. Tabs
*   **Archivo:** `tabs.tsx`
*   **M3 Guideline:** Organizar contenido al mismo nivel jerárquico.
*   **Regla:** Usar estilo "Underline" para páginas contenidas, "Pill" para filtros en tablas.

##### Anatomía Primary Tabs
| # | Elemento | Descripción |
| :--- | :--- | :--- |
| 0 | **Container** | Contenedor principal de las tabs. |
| 1 | **Badge** | Opcional. Indicador de notificación. |
| 2 | **Icon** | Opcional. Icono representativo. |
| 3 | **Label** | Texto de la tab. |
| 4 | **Divider** | Línea separadora en la base. |
| 5 | **Active indicator** | Indicador visual del tab activo. |

##### Primary Tabs Color Roles (Light/Dark)
| # | Elemento | Rol de Color |
| :--- | :--- | :--- |
| 0 | Container | `background` o `card` |
| 1 | Active indicator | `primary` |
| 2 | Active icon | `primary` |
| 3 | Active label | `foreground` |
| 4 | Inactive icon/label | `muted-foreground` |
| 5 | Divider | `border` |
| 6 | Focus/Hover state | `primary` |

##### Estados de Primary Tabs
| # | Estado | Descripción |
| :--- | :--- | :--- |
| 0 | Enabled (active) | Tab activo por defecto. |
| 1 | Hover (active) | Hover sobre tab activo. |
| 2 | Focused (active) | Focus de teclado sobre tab activo. |
| 3 | Pressed (active) | Click/tap sobre tab activo. |
| 4 | Enabled (inactive) | Tab inactivo por defecto. |
| 5 | Hover (inactive) | Hover sobre tab inactivo. |
| 6 | Focused (inactive) | Focus de teclado sobre tab inactivo. |
| 7 | Pressed (inactive) | Click/tap sobre tab inactivo. |

##### Anatomía Secondary Tabs
| # | Elemento | Descripción |
| :--- | :--- | :--- |
| 0 | **Container** | Contenedor principal. |
| 1 | **Badge** | Opcional. Indicador de notificación. |
| 2 | **Label** | Texto de la tab. |
| 3 | **Divider** | Línea separadora en la base. |
| 4 | **Active indicator** | Indicador visual del tab activo. |

> [!NOTE]
> Secondary tabs no incluyen iconos, solo badges opcionales y labels.

##### Secondary Tabs Color Roles (Light/Dark)
| # | Elemento | Rol de Color |
| :--- | :--- | :--- |
| 0 | Container | `background` o `card` |
| 1 | Active label | `foreground` |
| 2 | Inactive label | `muted-foreground` |
| 3 | Divider | `border` |
| 4 | Active indicator | `primary` |

##### Estados de Secondary Tabs
| # | Estado | Descripción |
| :--- | :--- | :--- |
| 0 | Enabled (active) | Tab activo por defecto. |
| 1 | Hover (active) | Hover sobre tab activo. |
| 2 | Focused (active) | Focus de teclado sobre tab activo. |
| 3 | Pressed (active) | Click/tap sobre tab activo. |
| 4 | Enabled (inactive) | Tab inactivo por defecto. |
| 5 | Hover (inactive) | Hover sobre tab inactivo. |
| 6 | Focused (inactive) | Focus de teclado sobre tab inactivo. |
| 7 | Pressed (inactive) | Click/tap sobre tab inactivo. |

##### Medidas
| Atributo | Valor |
| :--- | :--- |
| Container height (label only) | 48px mobile / 40px md+ |
| Container height (icon + label) | 48px mobile / 40px md+ |
| Icon size | 24dp |
| Divider height | 1dp |
| Primary active indicator height | 3dp |
| Secondary active indicator height | 2dp |
| Active indicator shape | 3, 3, 0, 0 (top-rounded) |
| Active indicator min length | 24dp |
| Padding (inline icon-text) | 8dp |
| Padding (inline text-badge) | 4dp |
| Badge overlap on stacked icon | 6dp |

> [!IMPORTANT]
> Las tabs se dividen en secciones iguales. Labels e iconos se centran verticalmente. El divider se incluye en la altura, dentro del contenedor.

> [!TIP]
> Los indicadores activos de Primary tabs tienen inset de 2dp en cada lado, border-radius completamente redondeado, y longitud mínima de 24dp.

#### 13. App Bars (Top/Bottom)
*   **Estado:** ⚠️ No usamos Top App Bar estándar.
*   **Regla:** El Header de cada página (`.header`) cumple esta función. Debe contener: Título de página (izq) y Acciones globales/Perfil (der).

---

### E. Selección e Inputs (Selection)

#### 14. Checkbox
*   **Archivo:** `checkbox.tsx`
*   **Regla:** Selección múltiple. Color `primary` al estar marcado. Borde `border` / `muted-foreground` al estar desmarcado.

#### 15. Chips
*   **Archivo:** `badge.tsx` (Simulado) / `button.tsx` (Simulado)
*   **M3 Guideline:** Elementos compactos. Altura `32dp` (h-8). **Radio `8dp`** (No 4dp ni full).
*   **Variantes Espécificas:**
    1.  **Assist Chip:** Acción rápida (ej: "Añadir al calendario"). Usar `Button` variant `outline` + `h-8` + icon left.
    2.  **Filter Chip:** Selección (Selected/Unselected). Usar `Badge` container + `checkbox` hidden.
    3.  **Input Chip:** Entradas complejas (Contactos). Avatar left + Texto + Close Icon right.
    4.  **Suggestion Chip:** Sugerencias dinámicas. Estilo similar a Assist.
*   **Regla de Construcción:** padding horizontal `16dp` (sin icono) o `8dp` (con icono). Gap `8dp`.

#### 16. Date & Time Pickers
*   **Archivo:** `date-picker.tsx` (usa `calendar.tsx` internamente)
*   **M3 Guideline:** Diálogo modal o input de texto.
*   **App:** Usa **Date Input** (Popover).
*   **Regla:** Permitir escritura manual (keyboard entry) además del selector visual.


#### 17. Radio Buttons
*   **Archivo:** `radio-group.tsx`
*   **Regla:** Selección única. Siempre vertical si hay más de 2 opciones.

#### 18. Sliders
*   **Archivo:** `slider.tsx`
*   **Regla:** Selección de valores en rango. Mostrar valor numérico `tooltip` al arrastrar.

#### 19. Switch
*   **Archivo:** `switch.tsx`
*   **Estado:** ✅ Implementado.
*   **Regla:** Usar para configuraciones de encendido/apagado inmediato (ej: "Modo Oscuro").

#### 20a. Text Fields (Outlined) - **Default**
*   **Archivo:** `input.tsx`
*   **M3 Standard:** Altura 56dp. Label corta la línea.
*   **App Reality:** Altura **48px mobile** (`h-12`) y **40px md+** (`md:h-10`) como estándar.
*   **Anatomía:**
    1.  **Container:** Borde `border` (gris) -> `ring`/`primary` (foco) -> `destructive` (error).
    2.  **Label:** Arriba del input (no flota dentro).
    3.  **Supporting Text:** Debajo del input. **Regla de Error:** El texto de error *reemplaza* al texto de ayuda, no se suma (evita saltos de layout).
    4.  **Slots:** Leading Icon (Search), Trailing Icon (Clear/Eye/Error), Prefix/Suffix ($/kg).
*   **Comportamiento del Input:**
    *   *Single-line:* Scroll horizontal automático.
    *   *Text Area:* Altura fija, scroll vertical. Usar para descripciones largas.
    *   *Read-Only:* Estilo estándar pero no editable.

---

### F. Varios (Misc)

#### 21. Lists (Expressive)
*   **Archivo:** `table.tsx` (Data) / `<ul>` (Content)
*   **Anatomía M3 (Slots):**
    1.  **Leading (24-56dp):** Avatar (40px) / Icono / Media. *Es parte del Área de Acción Primaria.*
    2.  **Content (Fluid):** Headline (16px) + Supporting Text (14px). *Max 3 líneas.*
    3.  **Trailing (Secondary Action):** Meta text, Checkbox (Multi-select), Radio (Single-select), o Menú (`...`).
*   **Variantes de Altura:**
    *   **1-Line:** Min 56dp. solo Headline.
    *   **2-Line:** Min 72dp. Headline + Supporting Text.
    *   **3-Line:** Min 88dp. Headline + 2 Supporting lines.
*   **Modos de Comportamiento:**
    *   *Single-select:* Usar `Radio Button` (Trailing).
    *   *Multi-select:* Usar `Checkbox` o `Switch` (Trailing).
    *   *Multi-action:* El clic en el texto navega; el clic en el icono trailing ejecuta acción secundaria.
*   **Adaptabilidad:**
    *   **Longitud de Línea:** Ideal 40-60 caracteres. Si excede 120, aumentar line-height o usar columnas.
    *   **Swapping:** En expandido (Desktop), listas complejas pueden mutar a `Cards` o `Tablas`.

#### 22. Menus
*   **Archivo:** `dropdown-menu.tsx`
*   **Regla:** Elevación Lv 2. Usar para acciones secundarias en items de lista (`...`).

#### 23. Tooltips
*   **Archivo:** `tooltip.tsx`
*   **Regla:** Texto plano. Solo para elementos icono sin etiqueta ("Guardar", "Editar"). Fondo oscuro.

---

## 3. 📋 Form Layout

> **Principio:** Formularios deben ser legibles, predecibles, y con mínimo esfuerzo cognitivo.

### A. Estructura de Formulario

```
┌─────────────────────────────────────────────────────────────────┐
│ Section Header (opcional)                                        │
│ ┌───────────────────────┐ ┌───────────────────────┐             │
│ │ Label               ⓘ │ │ Label               ⓘ │             │
│ │ ┌───────────────────┐ │ │ ┌───────────────────┐ │             │
│ │ │ Input             │ │ │ │ Input / Select    │ │             │
│ │ └───────────────────┘ │ │ └───────────────────┘ │             │
│ │ Helper text           │ │ Helper text           │             │
│ └───────────────────────┘ └───────────────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│ [ Cancelar ]                                    [ Guardar (●) ] │
└─────────────────────────────────────────────────────────────────┘
```

### B. Especificaciones

| Elemento | Medida | Clase |
|----------|--------|-------|
| Gap entre campos (horizontal) | 16px | `gap-4` |
| Gap entre campos (vertical) | 16px | `gap-4` |
| Gap label-input | 8px | `gap-2` (Field component) |
| Gap input-helper | 4px | Implícito |
| Section header margin-top | 24px | `mt-6` |
| Section header margin-bottom | 16px | `mb-4` |
| Form padding | 24px | `p-6` |
| Buttons gap | 12px | `gap-3` |

### C. Layouts de Columnas

| Contexto | Columnas | Breakpoint |
|----------|----------|------------|
| Móvil | 1 columna full-width | `< md` |
| Tablet | 2 columnas | `md` |
| Desktop | 2-3 columnas según densidad | `lg+` |

### D. Estados de Campos

| Estado | Visual |
|--------|--------|
| **Default** | Borde `border` (gris) |
| **Focused** | Borde `primary` (2px), ring `primary/20` |
| **Error** | Borde `destructive`, texto helper rojo |
| **Disabled** | Opacity 50%, cursor not-allowed |
| **Read-only** | Fondo `muted`, sin borde activo |

### E. Reglas

1. **Labels siempre visibles** - No flotan dentro del input
2. **Helper text** - Solo 1 línea, texto de error REEMPLAZA helper (no se suma)
3. **Asterisco obligatorio** - `*` después de label para campos requeridos
4. **Grupos lógicos** - Separar secciones con `Section Header` + divider opcional
5. **Botones al final** - Alineados a la derecha, primario al final

---

## 4. 🖼️ Avatar

**Archivo:** `avatar.tsx`

### A. Tamaños

| Nombre | Medida | Clase | Uso |
|--------|--------|-------|-----|
| `xs` | 24px | `h-6 w-6` | Inline mentions, dense lists |
| `sm` | 32px | `h-8 w-8` | Table cells, chips |
| `md` | 40px | `h-10 w-10` | List items, cards |
| `lg` | 48px | `h-12 w-12` | Headers, destacados |
| `xl` | 64px | `h-16 w-16` | Profile pages |
| `2xl` | 96px | `h-24 w-24` | Hero profile |

### B. Variantes

| Tipo | Uso |
|------|-----|
| **Image** | Foto de perfil (personas) |
| **Initials** | Fallback con iniciales (1-2 chars) |
| **Icon** | Fallback con icono User |

### C. Estados

| Estado | Visual |
|--------|--------|
| **Online** | Dot verde esquina inferior derecha |
| **Busy/Working** | Dot rojo pulsante |
| **Offline** | Sin indicador |

### D. Anatomía

```
┌───────────────┐
│               │
│    Image      │  ← rounded-full
│               │
│          🟢   │  ← status indicator (opcional)
└───────────────┘
```

---

## 5. 📄 Pagination

**Archivo:** `pagination.tsx`

### A. Anatomía

```
◀ Anterior   1  2  3  ...  10  11  12   Siguiente ▶     Página 5 de 12
└──────────────────────────────────────────────────┘    └──────────────┘
           Navigation                                       Info
```

### B. Especificaciones

| Elemento | Medida | Clase |
|----------|--------|-------|
| Button size | 48px mobile / 40px md+ | `h-12 w-12 md:h-10 md:w-10` |
| Gap entre items | 4px | `gap-1` |
| Font size | 14px | `text-sm` |
| Border radius | 6px | `rounded-md` |

### C. Estados

| Estado | Visual |
|--------|--------|
| **Active** | `bg-primary`, `text-primary-foreground` |
| **Inactive** | `bg-transparent`, `text-foreground` |
| **Hover** | `bg-muted` |
| **Disabled** | `opacity-50`, `pointer-events-none` |

### D. Reglas

1. Mostrar máximo 7 números + 2 ellipsis
2. Siempre mostrar primera y última página
3. Mostrar `Página X de Y` al final (opcional)
4. Flechas disabled en primera/última página

---

## 6. 📅 Calendar / Date Picker

**Archivo:** `date-picker.tsx` (usa `calendar.tsx` internamente)

### A. Anatomía del Calendario

```
┌─────────────────────────────────────┐
│  ◀   Enero 2026                 ▶   │  ← Header con navegación
├─────────────────────────────────────┤
│  Lu   Ma   Mi   Ju   Vi   Sa   Do   │  ← Weekday headers
├─────────────────────────────────────┤
│  29   30   31    1    2    3    4   │
│   5    6    7   [8]   9   10   11   │  ← [8] = selected
│  12   13   14   15   16   17   18   │
│  19   20   21   22   23   24   25   │
│  26   27   28   29   30   31    1   │
└─────────────────────────────────────┘
```

### B. Especificaciones

| Elemento | Medida | Clase |
|----------|--------|-------|
| Day cell size | 36px | `h-9 w-9` |
| Gap entre cells | 0 | Grid tight |
| Border radius (selected) | 50% | `rounded-full` |
| Weekday font | 12px | `text-xs` |
| Day font | 14px | `text-sm` |

### C. Estados de Día

| Estado | Visual |
|--------|--------|
| **Default** | `text-foreground` |
| **Selected** | `bg-primary`, `text-primary-foreground`, `rounded-full` |
| **Today** | `border-primary` (ring), no fill |
| **Outside month** | `text-muted-foreground`, opacity 50% |
| **Disabled** | `text-muted-foreground`, `line-through` |
| **Hover** | `bg-muted` |

### D. Date Picker Input

```
┌─────────────────────────────────────┐
│ 📅  15 de Enero, 2026          ▼   │
└─────────────────────────────────────┘
```

- Formato display: `DD de MMMM, YYYY` (Guatemala)
- Icono leading: Calendar
- Trailing: Chevron o Clear (si tiene valor)

---

## 7. 📋 Lists (Material Design 3)

### A. Descripción General

Las listas son arreglos verticales de elementos optimizados para escaneo rápido. Establecen jerarquía visual clara y soportan acciones.

### B. Variantes de Altura

| Variante | Altura Min | Contenido |
|----------|------------|-----------|
| **1-Line** | 56dp | Solo label |
| **2-Line** | 72dp | Label + supporting text (1 línea) |
| **3-Line** | 88dp | Label + supporting text (2-3 líneas, truncado) |

### C. Anatomía

```
┌────────────────────────────────────────────────────────────────┐
│  ┌────┐                                              ┌────┐   │
│  │ 📷 │  Headline (Label)                    Meta    │ ⋮  │   │
│  │    │  Supporting text...                  text    │    │   │
│  └────┘                                              └────┘   │
│  Leading                Content                      Trailing │
└────────────────────────────────────────────────────────────────┘
```

| Slot | Tamaño | Contenido |
|------|--------|-----------|
| **Leading** | 24-56dp | Avatar (40px círculo), Icono (24px), Media (56px) |
| **Content** | Fluid | Headline (16px) + Supporting (14px). Max 3 líneas. |
| **Trailing** | Variable | Meta text, Checkbox, Radio, Switch, Menu (...) |

### D. Espaciado

| Elemento | Medida |
|----------|--------|
| Padding horizontal | 16px |
| Padding vertical | 8-12px |
| Gap leading-content | 16px |
| Gap content-trailing | 16px |

### E. Tipos de Interacción

| Modo | Control Trailing |
|------|------------------|
| **Selección única** | Radio button |
| **Selección múltiple** | Checkbox o Switch |
| **Navegación** | Item entero clickeable |
| **Multi-acción** | Área central navega, trailing ejecuta secundaria |

### F. Reglas

> [!IMPORTANT]
> 1. **Alineación consistente** - No varíes posiciones dentro de una lista
> 2. **Elementos distintivos al inicio** - Avatar/icono en leading
> 3. **Texto meta al final** - Precio, fecha en trailing
> 4. **Limitar texto** - Truncar para escaneabilidad
> 5. **No centrar visuals** - Siempre alinear a la izquierda
> 6. **Gaps en listas contenidas** - Evitar dividers en listas simples
> 7. **Dividers solo si necesario** - En listas complejas o no contenidas

---

## 8. ✅ Checklist de Calidad

### Componentes
- [ ] ¿Usa tokens `background/card` en lugar de `white`?
- [ ] ¿Tiene estados `hover`, `focus`, `pressed` definidos?
- [ ] ¿El texto cumple con la escala tipográfica?
- [ ] ¿Es accesible por teclado (`Tab`, `Enter`)?
- [ ] ¿Los radios coinciden con la tabla de Border Radius?

### Layout
- [ ] ¿El espaciado sigue la cuadrícula de 8pt?
- [ ] ¿El header sigue el patrón documentado?
- [ ] ¿Los íconos alinean verticalmente con el contenido?
- [ ] ¿El padding lateral es consistente (24px)?

### Formularios
- [ ] ¿Labels siempre visibles (no flotan)?
- [ ] ¿Campos obligatorios marcados con `*`?
- [ ] ¿Helper text es de 1 línea?
- [ ] ¿Error reemplaza helper (no se suma)?
- [ ] ¿Botones alineados a la derecha?

### Listas
- [ ] ¿Alineación consistente en toda la lista?
- [ ] ¿Leading/Trailing correctamente posicionados?
- [ ] ¿Texto truncado si excede límite?
- [ ] ¿Gaps en vez de dividers para listas contenidas?


---

## 7. 🎨 Estilos Específicos por Vista

### A. Client Grid Portfolio (`/c/[public_id]/[model_id]`)

Esta vista tiene requerimientos de diseño únicos para impresionar al cliente final.

#### 1. Botones Glassmorphism (Unique)
*   **Contexto:** Footer de acciones (Aprobar/Rechazar) y acciones dentro del Lightbox.
*   **Estilo:** Efecto vidrio con blur y transparencia, diferenciado del resto de la app.
*   **Clases Base:** `backdrop-blur-md shadow-lg transition-all duration-300 border`
*   **Estados:**
    *   *Default (Inactive):* `bg-background/60 text-[color] border-[color]/30 hover:bg-[color]/20`
    *   *Active/Selected:* `bg-[color]/90 text-white border-[color] shadow-[color]/20`

#### 2. Lightbox Experience
*   **Comportamiento:**
    *   Navegación con flechas (Desktop) y Swipe (Mobile).
    *   Contador de fotos simple.
    *   Botones de acción (Aprobar/Rechazar) **persistentes** dentro del lightbox.
*   **Overlay:** `bg-background/95 backdrop-blur-sm` (Alta cobertura para enfoque total).
