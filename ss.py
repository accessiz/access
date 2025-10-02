import os

# Directorio raíz del proyecto (ajusta si es necesario, asumiendo que ejecutas el script desde la raíz del proyecto)
ROOT_DIR = "."

# Contenido modificado para src/app/page.tsx
modified_page_tsx = """
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "@/components/organisms/Hero/Hero";
import Footer from "@/components/organisms/Footer/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isHeroAnimationComplete, setIsHeroAnimationComplete] = useState(false);

  useLayoutEffect(() => {
    // Bloquear el scroll al montar el componente
    document.body.classList.add("no-scroll");

    const ctx = gsap.context(() => {
      // Configurar el footer como inicialmente oculto
      gsap.set(".site-footer", { autoAlpha: 0, y: 50 });

      // Animación del footer cuando se hace scroll (opcional, si quieres mantenerla)
      gsap.from(".site-footer", {
        scrollTrigger: {
          trigger: ".site-footer",
          start: "top bottom-=100px",
          toggleActions: "play none none none",
        },
        autoAlpha: 0,
        y: 50,
        duration: 1,
        ease: "power2.out",
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  // Función que se ejecuta cuando la animación del Hero termina
  const handleAnimationComplete = () => {
    setIsHeroAnimationComplete(true);
    document.body.classList.remove("no-scroll"); // Desbloquear el scroll
  };

  return (
    <main ref={mainRef}>
      <Hero onAnimationComplete={handleAnimationComplete} />
      {isHeroAnimationComplete && <Footer />}
    </main>
  );
}
"""

# Contenido modificado para src/components/organisms/Footer/Footer.module.css
# (Añadimos visibility: hidden; al final de la declaración .footer)
original_footer_css_path = os.path.join(ROOT_DIR, "src/components/organisms/Footer/Footer.module.css")
with open(original_footer_css_path, 'r', encoding='utf-8') as f:
    footer_css_content = f.read()

# Encontrar la declaración .footer y añadir visibility: hidden; si no está
if "visibility: hidden;" not in footer_css_content:
    # Encontrar el final de .footer { ... }
    footer_css_content = footer_css_content.replace(
        ".footer {",
        ".footer {\n  visibility: hidden; /* Añadir esto para ocultar inicialmente */"
    )
else:
    print("visibility: hidden; ya existe en Footer.module.css, no se modifica.")

# Escribir los cambios
page_tsx_path = os.path.join(ROOT_DIR, "src/app/page.tsx")
with open(page_tsx_path, 'w', encoding='utf-8') as f:
    f.write(modified_page_tsx.strip())

footer_css_path = os.path.join(ROOT_DIR, "src/components/organisms/Footer/Footer.module.css")
with open(footer_css_path, 'w', encoding='utf-8') as f:
    f.write(footer_css_content)

print("Modificaciones completadas:")
print(f"- {page_tsx_path} ha sido actualizado.")
print(f"- {footer_css_path} ha sido actualizado (si era necesario).")
print("¡Copia y pega este script en un archivo .py, ejecútalo en la raíz de tu proyecto y verifica los cambios!")