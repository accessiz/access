# NYXA Platform

Plataforma para la gestión de agencias de modelaje, enfocada en una experiencia de usuario moderna y fluida.

## Instalación y Uso

Sigue estos pasos para poner en marcha el entorno de desarrollo.

### Requisitos

- Node.js (versión 18 o superior)
- npm o yarn

### Pasos

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/nyxa.git](https://github.com/tu-usuario/nyxa.git)
    cd nyxa
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Inicia el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Tecnologías Utilizadas

-   **Framework**: Next.js 15
-   **Lenguaje**: TypeScript
-   **Estilos**: CSS Modules & Tailwind CSS (para configuración base y utilidades)
-   **Animaciones**: GSAP (GreenSock Animation Platform)
-   **Componentes**: React

## Design System (Tema Geist/Vercel)

- Tailwind está conectado a variables CSS (ver `src/app/globals.css`). Puedes usar utilidades como `bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.
- El radio de borde usa `--radius`. Clases como `rounded-lg` respetan esa variable global para mantener consistencia.
- Se añadió una escala tipográfica con roles Geist:
    - Encabezados: `text-heading-72`, `text-heading-64`, `text-heading-56`, `text-heading-48`, `text-heading-40`, `text-heading-32`, `text-heading-24`, `text-heading-20`, `text-heading-16`, `text-heading-14`.
    - Botones: `text-button-16`, `text-button-14`, `text-button-12`.
    - Labels: `text-label-20`, `text-label-18`, `text-label-16`, `text-label-14`, `text-label-13`, `text-label-12` (+ variantes `-mono`).
    - Copy: `text-copy-24`, `text-copy-20`, `text-copy-18`, `text-copy-16`, `text-copy-14`, `text-copy-13` (+ `text-copy-13-mono`).

### Espaciado (4/8pt)

Usa la escala de Tailwind (múltiplos de 4/8). Evita valores arbitrarios (`mt-[30px]`). Ejemplo: `py-24` (96px), `sm:py-56` (224px).

### Íconos

Se recomienda usar los íconos de Geist: https://vercel.com/geist/icons.
- Opción rápida: exportar SVGs desde el sitio e importarlos como componentes.
- Alternativa: seguir usando `lucide-react` donde ya esté integrado, migrando íconos gradualmente si se desea.