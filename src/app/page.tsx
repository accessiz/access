"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "@/components/organisms/Hero/Hero";
import Footer from "@/components/organisms/Footer/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animación de entrada del footer cuando se hace scroll hacia él
      gsap.from(".site-footer", {
        scrollTrigger: {
          trigger: ".site-footer",
          start: "top bottom-=100px", // Inicia la animación cuando la parte superior del footer está a 100px del final de la pantalla
          toggleActions: "play none none none"
        },
        autoAlpha: 0,
        y: 50,
        duration: 1,
        ease: 'power2.out'
      });
    }, mainRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef}>
      <Hero />
      <Footer />
    </main>
  );
}