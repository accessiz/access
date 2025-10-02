"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "@/components/organisms/Hero/Hero";
import Footer from "@/components/organisms/Footer/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isHeroAnimationComplete, setIsHeroAnimationComplete] = useState(false);

  // 1. Bloquear/desbloquear el scroll del body
  // Este efecto se encarga únicamente de la clase 'no-scroll'.
  useEffect(() => {
    if (!isHeroAnimationComplete) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [isHeroAnimationComplete]);


  // 2. Usamos useCallback para evitar que esta función se recree en cada render,
  // lo que causaba que la animación del Hero se repitiera.
  const handleAnimationComplete = useCallback(() => {
    setIsHeroAnimationComplete(true);
  }, []);

  // 3. Este efecto se ejecuta SÓLO cuando el footer está en el DOM.
  // Se encarga de la animación de aparición del footer.
  useEffect(() => {
    if (isHeroAnimationComplete) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".site-footer",
          { autoAlpha: 0, y: 50 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".site-footer",
              start: "top bottom-=100px",
              toggleActions: "play none none none",
            },
          }
        );
      }, mainRef);
      return () => ctx.revert();
    }
  }, [isHeroAnimationComplete]);


  return (
    <main ref={mainRef}>
      <Hero onAnimationComplete={handleAnimationComplete} />
      {isHeroAnimationComplete && <Footer />}
    </main>
  );
}

