# Convenciones del Sistema de Diseño (CSS-based & Multi-App)

Este documento define la arquitectura y las reglas para construir un **sistema de diseño agnóstico y reutilizable** a nivel de CSS. El objetivo es estructurar componentes y estilos de tal forma que puedan ser compartidos entre múltiples proyectos (`access`, `boost-app`, `boost-landing`) en el futuro, permitiendo que cada aplicación personalice su apariencia (colores, bordes) simplemente alterando variables CSS globales.

---

## 1. Arquitectura de Estilos

El sistema se divide en tres capas de CSS claramente diferenciadas:

```
[Aplicación Host (ej. access)] ──> Define los tokens locales (colores, bordes) en su globals.css
            │
            └───> [Shared UI (Componentes)] ──> Aplica los estilos de estructura, tamaño y estados
                                                basándose únicamente en variables CSS.
```

### Capa 1: Tokens Globales (Definidos por la App)
Cada aplicación es responsable de declarar los valores reales de sus variables CSS. El sistema de diseño compartido **no define colores físicos** (morados, naranjas o azules); define **roles semánticos**.

### Capa 2: Clases de Componentes Compartidos (Shared CSS)
Los estilos de los componentes se escriben una sola vez. Estos estilos definen:
* Comportamientos de layout (`flex`, `grid`, `display`).
* Espaciados, paddings, transiciones y micro-interacciones (`hover`, `active`, `disabled`, `focus`).
* **Regla de Oro:** Solo consumen variables CSS (`var(--ds-*)`), nunca valores planos (Hex, RGB estáticos).

---

## 2. Registro de Variables CSS (Tokens Requeridos)

Cualquier aplicación que desee consumir los componentes compartidos debe proveer la siguiente lista de variables CSS en su archivo de estilos global (`globals.css`):

### 2.1 Colores de Marca y UI (Brand & UI Colors)
```css
:root {
  /* Marca Principal */
  --ds-color-primary: 112 67 236;          /* RGB: Morado / Naranja / Azul */
  --ds-color-primary-hover: 90 50 200;
  --ds-color-primary-foreground: 255 255 255;

  /* Fondos (M3 Surface & Card) */
  --ds-color-bg-base: 245 245 247;         /* Fondo de la app */
  --ds-color-bg-card: 255 255 255;         /* Fondo de tarjetas/contenedores */
  --ds-color-bg-tertiary: 236 236 241;     /* Fondo de inputs o áreas secundarias */

  /* Bordes y Separadores */
  --ds-color-border: 60 60 68 / 0.12;       /* Separador con opacidad */

  /* Estados Semánticos (Estados de negocio) */
  --ds-color-success: 52 199 89;           /* Verde */
  --ds-color-error: 255 56 60;             /* Rojo */
  --ds-color-warning: 255 149 0;           /* Naranja/Amarillo */
  --ds-color-info: 0 122 255;              /* Azul */
}
```
*Nota: Se recomienda usar el formato RGB separado por espacios (ej. `112 67 236`) para que los componentes puedan aplicar opacidades dinámicas si es necesario (ej: `rgba(var(--ds-color-primary), 0.1)`).*

### 2.2 Bordes y Formas (Border Radius)
```css
:root {
  --ds-radius-sm: 8px;     /* Para botones pequeños, badges, inputs */
  --ds-radius-md: 16px;    /* Para cards pequeñas, popovers */
  --ds-radius-lg: 24px;    /* Para cards madre, secciones contenedoras */
  --ds-radius-full: 9999px;/* Para botones redondos, avatares, pills */
}
```

---

## 3. Ejemplo de Implementación de Componentes

### 3.1 CSS del Botón Compartido (`shared-ui/src/styles/button.css`)

```css
.ds-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 13px; /* text-body */
  font-weight: 600;
  height: 48px; /* Altura estándar móvil/accesible */
  padding: 0 24px;
  border-radius: var(--ds-radius-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
}

/* Variante Primaria */
.ds-btn-primary {
  background-color: rgb(var(--ds-color-primary));
  color: rgb(var(--ds-color-primary-foreground));
  border-color: rgb(var(--ds-color-primary));
}

.ds-btn-primary:hover:not(:disabled) {
  background-color: rgb(var(--ds-color-primary-hover));
  border-color: rgb(var(--ds-color-primary-hover));
}

/* Variante Outlined */
.ds-btn-outline {
  background-color: transparent;
  color: rgb(var(--ds-color-primary));
  border-color: rgba(var(--ds-color-primary), 0.24);
}

.ds-btn-outline:hover:not(:disabled) {
  background-color: rgba(var(--ds-color-primary), 0.08);
  border-color: rgb(var(--ds-color-primary));
}

/* Estados Globales */
.ds-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ds-btn:focus-visible {
  outline: 2px solid rgb(var(--ds-color-primary));
  outline-offset: 2px;
}
```

### 3.2 Componente React Reutilizable (`button.tsx`)

```tsx
import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    const baseClass = 'ds-btn';
    const variantClass = variant === 'primary' ? 'ds-btn-primary' : 'ds-btn-outline';
    
    return (
      <button
        ref={ref}
        className={`${baseClass} ${variantClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

## 4. Estrategia de Migración Pragmática (Paso a Paso)

Para migrar el portal de modelos localmente antes de exportar el código a un módulo compartido:

1. **Definir Variables Locales:** Crear un archivo `src/app/styles/tokens-ds.css` en el proyecto `access` que declare las variables `--ds-*` descritas en la sección 2.
2. **Crear Estilos Compartidos Locales:** Escribir los estilos CSS de los componentes básicos (`button.css`, `card.css`, `input.css`, `select.css`) usando variables `--ds-*` y guardarlos en una carpeta local de componentes (ej: `src/components/ui/ds/`).
3. **Construir Componentes Limpios:** Crear los componentes React que solo rendericen HTML plano (`button`, `input`, `select`) y apliquen las clases de estilos anteriores.
4. **Reemplazar en el Portal:** Modificar la vista `/m/[public_id]` para que use estas implementaciones nativas.
5. **Validar:** Probar que el comportamiento visual y la responsividad móvil sean idénticos o mejores. 
6. **Futuro:** Cuando se configure el monorepo u otro repositorio, esta carpeta `src/components/ui/ds/` y su respectivo archivo CSS se podrán mover directamente sin cambiar una sola línea de lógica en la aplicación host, ya que todo el branding depende exclusivamente de variables cargadas en el archivo CSS global del host.
