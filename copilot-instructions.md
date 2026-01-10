# Copilot Instructions (ACCESS)

Estas instrucciones son **prioritarias** para cualquier trabajo en este repositorio.

## Modo de trabajo
- Ocuparme **únicamente** de cuestiones de **diseño/UI** (layout, responsive, estilos, componentes visuales y Design System). **No** implementar lógica de negocio ni funciones nuevas: eso lo hará el usuario.
- No hacer preguntas. Si falta un dato menor, asumir la opción más simple y consistente con el Design System.
- Si falta un dato **crítico** (secreto, credenciales, acciones irreversibles), detenerse y reportar el bloqueo con una recomendación concreta.
- Hacer cambios **mínimos** y enfocados; no refactorizar por gusto.
- Verificar cambios ejecutando `node scripts/design-system-audit.mjs` cuando aplique.

## Reglas de UI / Design System
- Respetar `DESIGN_SYSTEM.md`.
- En rutas `/src/app/dashboard/**` el padding global lo controla el layout: **evitar padding extra** en páginas/component wrappers (el estándar es `p-6` y gaps principales `gap-6`).
- Preferir tokens tipográficos del DS (`text-display`, `text-title`, `text-body`, `text-label`) por tamaños crudos (`text-sm`, `text-lg`, etc.).
- Evitar colores de paleta Tailwind (`text-green-500`, `bg-red-600`, etc.) y hex (`#...`). Usar roles/tokens semánticos:
  - `success`, `warning`, `info`, `destructive`, `muted`, `accent`, `primary/secondary`.

## Imágenes (restricción Vercel)
- No usar `next/image` ni forzar migraciones a `next/image`.
- Se permite `<img>`.

## Calidad
- Mantener `npm run lint` sin errores.
- Si hay warnings de lint, solo corregirlos si están directamente relacionados con la tarea actual.
