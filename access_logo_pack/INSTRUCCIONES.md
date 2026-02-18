# Animación del Logo ACCESS y Hero

Este paquete contiene los archivos necesarios para implementar la animación de entrada y el uso del logo de ACCESS tal como se utiliza en el proyecto original.

## Contenido

*   **Hero.tsx**: Componente principal que orquesta la animación de entrada usando GSAP.
*   **Header.tsx**: Componente del encabezado que incluye la línea animada (`.line`).
*   **LogoLight.jsx / LogoDark.jsx**: Componentes React (SVG) del logo de ACCESS.
*   **Archivos SVG y JPG**: Assets gráficos originales.

## Requisitos

El proyecto depende de **GSAP** para las animaciones.

```bash
npm install gsap
```

## Implementación

### Lógica de Animación (GSAP)

La animación principal se encuentra en `Hero.tsx`. Utiliza `gsap.timeline()` para secuenciar los efectos:

1.  **Image Mask**: Revelado de la imagen de fondo (`clipPath`).
2.  **Center Text**: Aparición del texto "IZ ACCESS".
3.  **Header**: Aparición del header y expansión de la línea divisoria.
4.  **Footer**: Aparición del footer.

**Importante**: La animación depende de las siguientes clases CSS en los elementos:
*   `.imageMask` (Imagen de fondo)
*   `.centerText` (Texto principal)
*   `.header-anim` (Contenedor del Header)
*   `.line` (Línea divisoria dentro del Header)
*   `.footer-anim` (Contenedor del Footer)

### Variables CSS (Colores)

Los componentes SVG (`LogoLight`, `LogoDark`) utilizan variables CSS para sus colores, por ejemplo: `var(--primary)` y `var(--purple)`.
Se incluye el archivo **`tokens.css`** en este paquete con las definiciones de color necesarias. Asegúrate de incluir estas variables en tu CSS global para que el logo se visualice con los colores correctos.

```css
/* Ejemplo de tokens.css */
:root {
  --primary: 11 11 12;      /* RGB channels */
  --purple: 203 48 224;     /* RGB channels */
}
```

### Ejemplo de Uso

Puedes adaptar `Hero.tsx` a tu nuevo proyecto asegurándote de mantener la estructura del DOM y las clases mencionadas.

```jsx
// Ejemplo simplificado de cómo se inicializa la animación
useLayoutEffect(() => {
    const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        
        // Animación de la máscara de imagen
        tl.to(".imageMask", { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' })
        
        // Animación del texto
        .to(".centerText", { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, "-=0.2")
        
        // Animación de la línea del header
        .to(".line", { scaleX: 1, duration: 1, ease: 'power2.out' }, "<");
        
    }, scopeRef);
    
    return () => ctx.revert();
}, []);
```

## Activos (Assets)

Los archivos `.svg` y `.jpg` se incluyen para importarlos directamente si no desea utilizar los componentes React.
