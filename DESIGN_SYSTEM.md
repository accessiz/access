# DESIGN_SYSTEM.md (NYXA v3.0)

**Estándar:** Material Design 3 (2025 Expressive)
**Estado:** 🟢 Sincronizado con Codebase & M3 Guidelines
**Tema:** Sky Blue (Seed: `#AECBFA`)

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


### 1.3 Layout & Grid
*   **Master-Detail:** Sidebar fijo (`18rem`) + Master (`400px`) + Detail (Flex).
*   **Espaciado:** Grid de 4pt. Contenedores `p-6`, items `p-4`, separación `gap-2`.
*   **Radios:** 
    *   *M3 Default:* Cards 12px, Dialogs 28px.
    *   *App Actual:* Cards 8px (`rounded-lg`), Inputs 4px (`rounded-md`).
    *   *Regla:* Mantener 8px para consistencia hasta refactorización mayor.


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
| **5. Segmented Buttons** | --- | ❌ **No instalado.** (Falta `toggle-group`). <br> *Alternativa:* Usar `Tabs` (estilo Pill) para selectores. |
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
*   **Variantes M3:**
    1.  **Elevated:** `bg-surface-container-low` + `shadow-sm`. *Para contenido movible.*
    2.  **Filled:** `bg-surface-container-highest` + `border-none`. *Mayor énfasis visual.*
    3.  **Outlined:** `bg-surface` + `border-outline-variant` + `shadow-none`. *Contenido agrupado (Default).*
*   **Anatomía:** Header (Title/Desc), Content (Body), Footer (Actions). Padding 16dp.

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
*   **Estado:** ❌ No instalado.
*   **Regla:** Usar para configuraciones de encendido/apagado inmediato (ej: "Modo Oscuro"). Si no está crítico, usar Checkbox.

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

## 3. ✅ Checklist de Calidad
1. [ ] ¿El componente usa tokens `surface` en lugar de `white`?
2. [ ] ¿Tiene estados `hover`, `focus`, `pressed` definidos?
3. [ ] ¿El texto cumple con la escala 14px?
4. [ ] ¿Es accesible por teclado (`Tab`, `Enter`)?
