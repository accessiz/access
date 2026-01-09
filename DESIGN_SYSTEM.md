# DESIGN_SYSTEM.md (NYXA v3.0)

**Estándar:** Material Design 3 (2025 Expressive)
**Estado:** 🟢 Sincronizado con Codebase & M3 Guidelines
**Tema:** Sky Blue (Seed: `#AECBFA`)

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

#### 1.1 Sistema de Color (roles M3)
*Fuente de Verdad: `material-theme.json`*

El sistema utiliza roles semánticos. No uses hex codes duros, usa las variables CSS `--[role]`.

#### A. Colores Clave (Key Colors)
| Rol | Token Variable | Light | Dark | Uso (Prominencia) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--primary` | `#435F89` | `#D9E6FF` | **Alta.** FABs, botones rellenos, estados activos. |
| **On Primary** | `--primary-foreground` | `#FFFFFF` | `#0F3157` | Texto e iconos sobre color Primary. |
| **Primary Container** | `--primary-container` | `#AECBFA` | `#AECBFA` | **Media.** Botones tonales, selección de items. |
| **Secondary** | `--secondary` | `#555F71` | `#BCC7DB` | **Media-Baja.** Elementos de soporte, filtros. |
| **Secondary Container** | `--secondary-container` | `#D8E3F8` | `#3D4758` | Fondos de tarjetas secundarias o listas. |
| **Tertiary** | `--tertiary` | `#78517B` | `#FFDAFE` | **Acento.** Romper la monotonía (ej. gráficas). |
| **Tertiary Container** | `--tertiary-container` | `#EABAEB` | `#EABAEB` | Variantes de acento menos agresivas. |

#### B. Superficies (The "Paper" System)
M3 no usa sombras para profundidad, usa **tonos de superficie**.

| Nivel | Rol | Token | Light | Dark | Aplicación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Base** | Surface | `--background` | `#FAF9FD` | `#121316` | Fondo general de la aplicación. |
| **Lv 1** | Surface Low | `--surface-container-low` | `#F4F3F7` | `#1A1C1E` | Sidebar, Tarjetas simples. |
| **Lv 2** | Surface | `--surface-container` | `#EEEDF1` | `#1E2022` | Navegación, Inputs, Listas. |
| **Lv 3** | Surface High | `--surface-container-high` | `#E9E8EB` | `#292A2D` | Diálogos, Popovers, Menús. |
| **Lv 4** | Surface Highest| `--surface-container-highest`| `#E3E2E6` | `#343538` | Elementos flotantes muy altos. |

#### C. Utilidad y Contenido
| Rol | Token | Uso |
| :--- | :--- | :--- |
| **Outline** | `--border-outline` | Bordes importantes (Inputs, botones outlined). |
| **Outline Variant** | `--border-outline-variant` | Divisores decorativos, bordes de tablas. |
| **Error** | `--destructive` | Estados de error crítico (`#BA1A1A`). |
| **On Surface** | `--foreground` | Texto principal (Negro/Blanco). |
| **On Surface Variant** | `--muted-foreground` | Texto secundario (Gris). |


### 1.3 Master Grid System (Pixel-Perfect Layout)

> **Regla de Oro:** Todo elemento debe alinearse a la cuadrícula de 8pt. Sin excepciones.

#### A. Estructura de Página Principal

```
┌──────────────────────────────────────────────────────────────────────┐
│                         VIEWPORT (100vw)                             │
├────────────┬─────────────────────────────────────────────────────────┤
│            │                    MAIN CONTENT AREA                    │
│  SIDEBAR   │  ┌──────────────────────────────────────────────────┐   │
│            │  │ HEADER (Título + Acciones)          h: 64px      │   │
│  w: 288px  │  ├──────────────────────────────────────────────────┤   │
│  (18rem)   │  │                                                  │   │
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
    <h1 className="text-heading-24 font-semibold">Título</h1>
    <p className="text-copy-12 text-muted-foreground">Subtítulo/conteo</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Acciones */}
  </div>
</header>
```

| Elemento | Especificación |
|----------|----------------|
| Título (h1) | `text-heading-24` (24px), `font-semibold` |
| Subtítulo | `text-copy-12` (12px), `text-muted-foreground` |
| Gap título-subtítulo | 4px (implícito en div) |
| Padding bottom header | 16px (`pb-4`) |
| Border bottom | `border-b` (1px, outline-variant) |
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

Material 3 define 9 tipos de botones. Aquí su mapeo en nuestra App:

| Tipo M3 | Archivo / Estado | Regla de Diseño |
| :--- | :--- | :--- |
| **1. Buttons (Common)** | `button.tsx` | **Mapeo de Variantes M3:** <br> 1. **Filled:** `variant="default"` (Alta Énfasis). <br> 2. **Tonal:** `variant="secondary"` (Media Énfasis). <br> 3. **Elevated:** No existe (Usar `secondary` + `shadow`). <br> 4. **Outlined:** `variant="outline"` (Baja Énfasis/Bordes). <br> 5. **Text:** `variant="ghost"` (Iconos/Tablas). |
| **2. Icon Buttons** | `button.tsx` | Usar `size="icon"` y `variant="ghost"`. <br> Ideal para Top Bars o acciones de tabla (`Edit`, `Delete`). |
| **3. Floating Action (FAB)** | `button.tsx` (Custom) | ✅ **Simulado.** Usar `h-14 w-14 rounded-2xl shadow-md`. <br> *Solo una por pantalla.* |
| **4. Extended FAB** | `button.tsx` (Custom) | ✅ **Simulado.** Botón con Icono + Texto. <br> Altura 56px (`h-14`). Radio `rounded-2xl`. |
| **5. Segmented Buttons** | `toggle-group.tsx` | ✅ **Implementado.** Usar para selectores tipo on/off múltiples. |
| **6. Split Button** | `button.tsx` + `dropdown` | ⚠️ **Manual.** Unir un botón y un trigger de dropdown con `gap-px`. |
| **7. Button Groups** | --- | ❌ **No existe.** Evitar agrupar botones pegados. Usar spacing `gap-2`. |
| **8. FAB Menu** | --- | ❌ **No existe.** Evitar complejidad. Usar Dropdown Menu estándar. |

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
*   **Specs:** Color `error` (`#BA1A1A`) sobre icono. Border radius completo.


#### 5. Progress Indicators (Loading)
*   **Archivo:** `skeleton.tsx`
*   **Estado:** ✅ Skeletons implementados.
*   **Faltante:** ❌ Circular Progress (Spinners).
*   **Regla:** Preferir **Skeletons** (`animate-pulse`) para carga de contenedores. Usar Spinners solo para acciones de botón (Guardando...).

#### 6. Snackbars
*   **Archivo:** `sonner.tsx`
*   **M3 Guideline:** Mensajes temporales breves al pie de pantalla.
*   **Regla:** Fondo inverso (`bg-inverse-surface`). Texto `on-inverse-surface`. Duración 4-6s. Botón de acción opcional ("Deshacer").

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
| **Elevated** | `bg-surface-container-low` + `shadow-sm` | Sombra para mayor separación del fondo. Para contenido movible. |
| **Filled** | `bg-surface-container-highest` + `border-none` | Separación sutil del fondo. Menor énfasis que Elevated u Outlined. |
| **Outlined** | `bg-surface` + `border-outline-variant` + `shadow-none` | Borde visual alrededor del contenedor. Mayor énfasis. **(Default)** |

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
| **Carousel** | Cards en fila horizontal, scrollable. |

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
*   **Estilo:** `bg-surface-container-high` (`Lv 3`).
*   **M3 Guideline:** Interrumpen al usuario para confirmar o informar. 
*   **Regla:** Título (24px), Cuerpo (14px). Botones alineados a la derecha (`flex-end`). Scrim (fondo oscuro) al 32%.

#### 9. Dividers
*   **Archivo:** `separator.tsx`
*   **Regla:** Usar `border-outline-variant`. Espesor 1px. Usar para separar grupos lógicos (fechas, secciones).

#### 10. Bottom Sheets
*   **Archivo:** `sheet.tsx`
*   **Estado:** ✅ Implementado (Side Sheet).
*   **Regla:** Usar para formularios largos o filtrado complejo en móviles.

---

### D. Navegación (Navigation)

#### 11. Navigation Drawer (Sidebar)
*   **Archivo:** `sidebar.tsx`
*   **M3 Guideline:** Navegación principal para escritorio.
*   **Regla:** Elemento activo con `active-nav-glow`. Iconos filled para estado activo, outlined para inactivo. Ancho: 288px.

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
| 0 | Container | `surface` |
| 1 | Active indicator | `primary` |
| 2 | Active icon | `primary` |
| 3 | Active label | `on-surface-variant` |
| 4 | Inactive icon/label | `on-surface-variant` |
| 5 | Divider | `outline-variant` |
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
| 0 | Container | `surface` |
| 1 | Active label | `on-surface` |
| 2 | Inactive label | `on-surface-variant` |
| 3 | Divider | `outline-variant` |
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
| Container height (label only) | 48dp |
| Container height (icon + label) | 64dp |
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
*   **Regla:** Selección múltiple. Color `primary` al estar marcado. Borde `on-surface-variant` al estar desmarcado.

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
*   **Archivo:** `calendar.tsx`
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
*   **App Reality:** Altura **36dp** (h-9) para densidad SaaS.
*   **Anatomía:**
    1.  **Container:** Borde `outline` (gris) -> `primary` (foco) -> `destructive` (error).
    2.  **Label:** Arriba del input (no flota dentro).
    3.  **Supporting Text:** Debajo del input. **Regla de Error:** El texto de error *reemplaza* al texto de ayuda, no se suma (evita saltos de layout).
    4.  **Slots:** Leading Icon (Search), Trailing Icon (Clear/Eye/Error), Prefix/Suffix ($/kg).
*   **Comportamiento del Input:**
    *   *Single-line:* Scroll horizontal automático.
    *   *Text Area:* Altura fija, scroll vertical. Usar para descripciones largas.
    *   *Read-Only:* Estilo estándar pero no editable.


#### 20b. Text Fields (Filled)
*   **Estado:** ❌ No implementado.
*   **M3 Standard:** Fondo `surface-container-highest` con línea inferior `primary`.
*   **Uso:** M3 prefiere Filled para énfasis visual, pero la App estandariza en **Outlined** para limpieza.

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

#### 24. Search
*   **Archivo:** `command.tsx`
*   **Estilo:** "Search Bar" expandible o Modal (`Ctrl+K`).
*   **Regla:** Borde redondeado `rounded-full` (si es barra) o `rounded-xl` (si es modal).

#### 25. Carousel
*   **Estado:** ❌ No existe.
*   **Regla:** Evitar. M3 recomienda "Hero Images" o "Masonry Grids" para galerías.

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
| **Default** | Borde `outline-variant` (gris) |
| **Focused** | Borde `primary` (2px), ring `primary/20` |
| **Error** | Borde `destructive`, texto helper rojo |
| **Disabled** | Opacity 50%, cursor not-allowed |
| **Read-only** | Fondo `surface-container-low`, sin borde activo |

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
| Button size | 32px | `h-8 w-8` |
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

**Archivo:** `calendar.tsx`, `date-picker.tsx`

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
- [ ] ¿Usa tokens `surface` en lugar de `white`?
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

