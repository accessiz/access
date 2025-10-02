"use client";
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import styles from './Hero.module.css';
import Header from '@/components/organisms/Header/Header';
import InfoFooter from '@/components/organisms/InfoFooter/InfoFooter';

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
        // #8. Añadido chequeo para 'prefers-reduced-motion' por accesibilidad
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion) {
            gsap.set(['.imageMask', '.centerText', '.header-anim', '.footer-anim', '.line'], { autoAlpha: 1, y: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)' });
            onAnimationComplete();
            return;
        }

        gsap.set('.imageMask', { clipPath: 'inset(0% 0% 100% 0%)' });
        gsap.set('.centerText', { autoAlpha: 0, y: 30 });
        gsap.set('.header-anim', { autoAlpha: 0, y: -20 });
        gsap.set('.footer-anim', { autoAlpha: 0, y: -20 });
        gsap.set('.line', { scaleX: 0 });

        const tl = gsap.timeline({ 
          delay: 0.5,
          onComplete: onAnimationComplete
        });
        
        tl.to(".imageMask", { 
            clipPath: 'inset(0% 0% 0% 0%)', 
            duration: 1.5, 
            ease: 'power3.inOut' 
        })
        .to(".centerText", { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, "-=0.2")
        .to(".header-anim", { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, ">-0.4")
        .to(".line", { scaleX: 1, duration: 1, ease: 'power2.out' }, "<")
        .to(".footer-anim", { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, ">-0.6");

    }, heroRef);
    
    return () => ctx.revert();
  }, [onAnimationComplete]);

  return (
    <section 
      className={styles.heroSection} 
      ref={heroRef}
      style={{ visibility: isReady ? 'visible' : 'hidden' }}
    >
        {/* #3. Optimización de imagen con Next/Image */}
        <div className={styles.backgroundImageWrapper}>
            <Image
              src="/images/hero-photo-cover.jpg"
              alt="Modelo albina con fondo oscuro"
              fill
              priority // Cargar esta imagen primero ya que es LCP
              className={`${styles.backgroundImage} imageMask`}
            />
        </div>
        
        <div className={styles.gridOverlay}>
            <div className="header-anim"><Header /></div>
            
            <div className={styles.centerContent}>
                <h1 className={`${styles.centerText} centerText`}>
                    IZ ACCESS
                </h1>
            </div>
            
            <div className="footer-anim"><InfoFooter time={time} /></div>
        </div>
    </section>
  );
};

export default Hero;