'use client';

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { gsap } from 'gsap';
import { ClientAnimationContext } from './ClientAnimationContext';

export default function ClientAnimationWrapper({ children }: { children: ReactNode }) {
    const [animationState, setAnimationState] = useState<'intro' | 'logo-to-nav' | 'login' | 'transition' | 'finished'>('intro');

    const comp = useRef<HTMLDivElement>(null);
    const logoRef = useRef<SVGSVGElement>(null);
    const letterARef = useRef<SVGPathElement>(null);
    const lettersRestRef = useRef<SVGGElement>(null);
    const byIzRef = useRef<HTMLParagraphElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null);


    // Memoized exit animation
    const startExitAnimation = useCallback(async () => {
        return new Promise<void>((resolve) => {
            if (!containerRef.current) {
                setAnimationState('finished');
                sessionStorage.setItem('introPlayed', 'true');
                resolve();
                return;
            }

            setAnimationState('transition');

            gsap.context(() => {
                const tl = gsap.timeline({
                    onComplete: () => {
                        setAnimationState('finished');
                        sessionStorage.setItem('introPlayed', 'true');
                        resolve();
                    }
                });

                // Phase 6: Everything fades except logo (already in position)
                tl.to(containerRef.current, {
                    autoAlpha: 0,
                    duration: 0.8,
                    ease: 'power2.inOut'
                });

            }, comp);
        });
    }, []);

    // Phase 1-3: Initial Intro Animation
    useEffect(() => {
        const played = sessionStorage.getItem('introPlayed');
        if (played) {
            setAnimationState('finished');
            return;
        }

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            // Initial Setup - Everything hidden
            // The "A" starts offset to appear centered (since the full logo is wider)
            // The SVG viewBox is 100 wide, "A" is roughly 0-23, "CCESS" is 23-100
            // So we offset the logo ~38 units right to center the "A"
            gsap.set(containerRef.current, { autoAlpha: 1 });
            gsap.set(logoRef.current, {
                position: 'fixed',
                left: '50%',
                top: '50%',
                xPercent: -50,
                yPercent: -50,
                x: 38, // Offset to center the "A"
                scale: 0.8, // Smaller initial size
                opacity: 1
            });
            gsap.set(letterARef.current, { opacity: 0, scale: 0.9 });
            gsap.set(lettersRestRef.current, { opacity: 0, x: -10 });
            gsap.set(byIzRef.current, { opacity: 0, y: -30 });

            // ========== PHASE 1: "A" Intro ==========
            // 1a. "A" appears in center
            tl.to(letterARef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                ease: 'power2.out'
            });
            // 1b. Small pause to let A sink in
            tl.to({}, { duration: 0.3 });

            // 1e. Logo slides left to its natural position as "CCESS" appears
            tl.to(logoRef.current, {
                x: 0, // Remove offset, center the full logo
                duration: 0.7,
                ease: 'power3.out'
            });

            // Reveal "CCESS" simultaneously
            tl.to(lettersRestRef.current, {
                opacity: 1,
                x: 0,
                duration: 0.7,
                ease: 'power3.out'
            }, '<');

            // ========== PHASE 2: "by IZ Management" ==========
            // Fades in from above (opacity 0 → 100, y: -30 → 0)
            tl.to(byIzRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out'
            }, '+=0.3');

            // Hold for 1 second to let it sink in
            tl.to({}, { duration: 1 });

            // Fade out "by IZ Management"
            tl.to(byIzRef.current, {
                opacity: 0,
                y: 10,
                duration: 0.5,
                ease: 'power2.in'
            });

            // Wait 0.2 seconds before logo moves to navbar
            tl.to({}, { duration: 0.2 });

            // ========== PHASE 3: Logo to Navbar ==========

            // Logo moves to navbar position
            // Keep xPercent/yPercent to avoid jump, just animate position
            tl.to(logoRef.current, {
                left: '50%', // Stay centered horizontally
                top: '40px', // Move to top
                scale: 0.4, // Slightly bigger
                duration: 1.0,
                ease: 'power3.inOut',
                onComplete: () => {
                    setAnimationState('logo-to-nav');
                }
            });

        }, comp);

        return () => ctx.revert();
    }, []);

    // Phase 4: Watch for "login" state to animate login card
    useEffect(() => {
        if (animationState === 'login') {
            // The login card will handle its own fade-in via CSS/Framer
            // We just ensure the overlay stays visible but dims slightly
            const ctx = gsap.context(() => {
                gsap.to(containerRef.current, {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }, comp);
            return () => ctx.revert();
        }
    }, [animationState]);


    return (
        <ClientAnimationContext.Provider value={{
            animationState,
            setAnimationState,
            startExitAnimation,
            introPlayed: animationState === 'finished'
        }}>
            <div ref={comp} className="relative">
                {/* Intro Overlay */}
                {animationState !== 'finished' && (
                    <div
                        ref={containerRef}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
                        style={{ visibility: 'hidden' }}
                    >
                        {/* Logo SVG */}
                        <svg
                            ref={logoRef}
                            id="intro-logo"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 100 18"
                            className="w-[13.5rem] md:w-[18.5rem] text-foreground overflow-visible"
                        >
                            <defs>
                                <style>{`
                  .st0 { fill: currentColor; }
                  .st1 { fill: rgb(var(--primary) / 1); }
                `}</style>
                            </defs>
                            {/* Letter A - Isotipo */}
                            <g style={{ position: 'relative' }}>
                                <path
                                    ref={letterARef}
                                    className="st1"
                                    d="M7.15,17.35H0V.65h8.21l14.73,14.67-1.67,1.68-6.89-6.86-7.23,7.2ZM2.37,14.98h3.8l6.53-6.51L7.23,3.02H2.37v11.96Z"
                                />
                            </g>
                            {/* CCESS */}
                            <g ref={lettersRestRef}>
                                <path className="st0" d="M37.5,14.23c-.61.97-1.45,1.73-2.54,2.28-1.09.56-2.39.83-3.89.83-1.6,0-3.02-.35-4.25-1.04-1.23-.7-2.18-1.67-2.86-2.93-.68-1.26-1.02-2.71-1.02-4.35s.34-3.11,1.02-4.38c.68-1.27,1.63-2.25,2.86-2.95,1.23-.7,2.64-1.04,4.25-1.04,1.51,0,2.81.27,3.9.82,1.1.55,1.94,1.29,2.54,2.22.6.93.94,1.97,1.02,3.12h-2.28c-.13-1.16-.67-2.11-1.62-2.85-.95-.74-2.14-1.1-3.56-1.1-1.1,0-2.09.26-2.97.77-.88.52-1.58,1.24-2.09,2.17-.51.93-.76,2.01-.76,3.22s.25,2.26.76,3.18c.51.93,1.2,1.65,2.09,2.16.88.52,1.87.77,2.97.77,1.49,0,2.69-.39,3.61-1.17.92-.78,1.44-1.77,1.57-2.98h2.31c-.1,1.2-.45,2.28-1.06,3.24Z" />
                                <path className="st0" d="M55.34,14.23c-.61.97-1.45,1.73-2.54,2.28-1.09.56-2.39.83-3.89.83-1.6,0-3.02-.35-4.25-1.04-1.23-.7-2.18-1.67-2.86-2.93-.68-1.26-1.02-2.71-1.02-4.35s.34-3.11,1.02-4.38c.68-1.27,1.63-2.25,2.86-2.95,1.23-.7,2.64-1.04,4.25-1.04,1.51,0,2.81.27,3.9.82,1.1.55,1.94,1.29,2.54,2.22.6.93.94,1.97,1.02,3.12h-2.28c-.13-1.16-.67-2.11-1.62-2.85-.95-.74-2.14-1.1-3.56-1.1-1.1,0-2.09.26-2.97.77-.88.52-1.58,1.24-2.09,2.17-.51.93-.76,2.01-.76,3.22s.25,2.26.76,3.18c.51.93,1.2,1.65,2.09,2.16.88.52,1.87.77,2.97.77,1.49,0,2.69-.39,3.61-1.17.92-.78,1.44-1.77,1.57-2.98h2.31c-.1,1.2-.45,2.28-1.06,3.24Z" />
                                <path className="st0" d="M58.62.65h10.9v2.28h-8.5v4.76h7.97v2.28h-7.97v5.11h8.6v2.28h-11V.65Z" />
                                <path className="st0" d="M81.06,3.58c-.68-.48-1.58-.71-2.69-.71s-2.04.21-2.72.64c-.68.43-1.02,1.07-1.02,1.92,0,.67.24,1.18.71,1.54.48.35,1.34.64,2.58.85l1.89.34c1.52.28,2.74.77,3.64,1.46.9.7,1.35,1.73,1.35,3.11,0,1.54-.57,2.7-1.71,3.47-1.14.77-2.64,1.16-4.51,1.16-1.21,0-2.32-.21-3.32-.63-1-.42-1.81-1.05-2.42-1.89-.61-.84-.95-1.9-1-3.16h2.34c.08,1.28.51,2.18,1.29,2.69.78.52,1.82.77,3.11.77,2.59,0,3.89-.8,3.89-2.41,0-.67-.33-1.21-1-1.61-.66-.4-1.5-.68-2.52-.85l-1.92-.34c-1.41-.26-2.55-.72-3.43-1.36-.88-.65-1.32-1.68-1.32-3.11,0-1.52.57-2.7,1.71-3.54,1.14-.84,2.59-1.25,4.36-1.25s3.23.43,4.39,1.3c1.16.87,1.77,2.14,1.83,3.81h-2.39c-.08-.98-.46-1.71-1.14-2.19Z" />
                                <path className="st0" d="M96.25,3.58c-.68-.48-1.58-.71-2.69-.71s-2.04.21-2.72.64c-.68.43-1.02,1.07-1.02,1.92,0,.67.24,1.18.71,1.54.48.35,1.34.64,2.58.85l1.89.34c1.52.28,2.74.77,3.64,1.46.9.7,1.35,1.73,1.35,3.11,0,1.54-.57,2.7-1.71,3.47-1.14.77-2.64,1.16-4.51,1.16-1.21,0-2.32-.21-3.32-.63-1-.42-1.81-1.05-2.42-1.89-.61-.84-.95-1.9-1-3.16h2.34c.08,1.28.51,2.18,1.29,2.69.78.52,1.82.77,3.11.77,2.59,0,3.89-.8,3.89-2.41,0-.67-.33-1.21-1-1.61-.66-.4-1.5-.68-2.52-.85l-1.92-.34c-1.41-.26-2.55-.72-3.43-1.36-.88-.65-1.32-1.68-1.32-3.11,0-1.52.57-2.7,1.71-3.54,1.14-.84,2.59-1.25,4.36-1.25s3.23.43,4.39,1.3c1.16.87,1.77,2.14,1.83,3.81h-2.39c-.08-.98-.46-1.71-1.14-2.19Z" />
                            </g>
                        </svg>


                        {/* by IZ Management */}
                        <p
                            ref={byIzRef}
                            className="absolute text-label font-medium tracking-[0.3em] text-muted-foreground uppercase"
                            style={{ top: 'calc(50% + 40px)' }}
                        >
                            by IZ Management
                        </p>
                    </div>
                )}

                {/* Real Content */}
                <div ref={contentWrapperRef}>
                    {children}
                </div>

            </div>
        </ClientAnimationContext.Provider>
    );
}
