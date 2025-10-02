"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "@/components/organisms/Hero";
import Footer from "@/components/organisms/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isHeroAnimationComplete, setIsHeroAnimationComplete] = useState(false);

  useEffect(() => {
    if (!isHeroAnimationComplete) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [isHeroAnimationComplete]);

  const handleAnimationComplete = useCallback(() => {
    setIsHeroAnimationComplete(true);
  }, []);

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