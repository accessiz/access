"use client";
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './Hero.module.css';
import Header from '@/components/organisms/Header/Header';
import InfoFooter from '@/components/organisms/InfoFooter/InfoFooter';

const Hero = () => {
  const [time, setTime] = useState('');
  const heroRef = useRef<HTMLElement>(null);

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
    const ctx = gsap.context(() => {
        gsap.set('.imageMask', { clipPath: 'inset(50% 50% 50% 50% round 0px)' });
        gsap.set('.centerText', { autoAlpha: 0 });
        gsap.set('.line', { scaleX: 0 });
        gsap.set(['.header-anim', '.footer-anim'], { autoAlpha: 0 });

        const tl = gsap.timeline({ delay: 0.5 });
        
        tl.to(".imageMask", { 
            clipPath: 'inset(0% 0% 0% 0% round 0px)', 
            duration: 1.5, 
            ease: 'power3.inOut' 
        })
        .to(".centerText", { autoAlpha: 1, duration: 1, ease: 'power2.out' }, "-=0.5")
        .to(".line", { scaleX: 1, duration: 1, ease: 'power2.out' }, "-=0.5")
        .to([".header-anim", ".footer-anim"], { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, "<0.2");

    }, heroRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.heroSection} ref={heroRef}>
        <div className={styles.backgroundImageWrapper}>
            <div className={`${styles.backgroundImage} imageMask`}></div>
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
