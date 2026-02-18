"use client";
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Header from '@/components/organisms/Header';
import InfoFooter from '@/components/molecules/InfoFooter';

interface HeroProps {
  onAnimationComplete: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAnimationComplete }) => {
  const [time, setTime] = useState('');
  const heroRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-GT', { 
          hour: '2-digit', minute: '2-digit', second: '2-digit', 
          hour12: true, timeZone: 'America/Guatemala'
      }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    setIsReady(true);
    const ctx = gsap.context(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion) {
            gsap.set(['.imageMask', '.centerText', '.header-anim', '.footer-anim', '.line'], { autoAlpha: 1 });
            onAnimationComplete();
            return;
        }

        gsap.set('.imageMask', { clipPath: 'inset(0% 0% 100% 0%)' });
        gsap.set('.centerText', { autoAlpha: 0, y: 30 });
        gsap.set(['.header-anim', '.footer-anim'], { autoAlpha: 0, y: -20 });
        gsap.set('.line', { scaleX: 0 });

        const tl = gsap.timeline({ delay: 0.5, onComplete: onAnimationComplete });
        
        tl.to(".imageMask", { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' })
          .to(".centerText", { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, "-=0.2")
          .to(".header-anim", { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, ">-0.4")
          .to(".line", { scaleX: 1, duration: 1, ease: 'power2.out' }, "<")
          .to(".footer-anim", { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, ">-0.6");
    }, heroRef);
    
    return () => ctx.revert();
  }, [onAnimationComplete]);

  return (
    <section 
      className="h-screen w-full relative overflow-hidden bg-background" 
      ref={heroRef}
      style={{ visibility: isReady ? 'visible' : 'hidden' }}
    >
        <div className="absolute inset-0 z-[1]">
			<img
				src="/images/hero-photo-cover.jpg"
				alt="Modelo albina con fondo oscuro"
				className="w-full h-full object-cover object-center will-change-transform opacity-50 imageMask"
			/>
        </div>
        
        <div className="absolute inset-0 z-10 grid grid-rows-[auto_1fr_auto] p-8 lg:p-12 uppercase">
            <div className="header-anim"><Header /></div>
            
            <div className="grid place-items-center">
              <h1 className="text-display font-normal tracking-tighter whitespace-nowrap leading-none text-on-background z-[12] mix-blend-difference centerText">
                    IZ ACCESS
                </h1>
            </div>
            
            <div className="footer-anim"><InfoFooter time={time} /></div>
        </div>
    </section>
  );
};

export default Hero;