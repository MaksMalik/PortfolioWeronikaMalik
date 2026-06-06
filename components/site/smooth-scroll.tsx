"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const createLenis = () => {
      const lenis = new Lenis({
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      lenisRef.current = lenis;

      function raf(time: number) {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      }

      rafRef.current = requestAnimationFrame(raf);

      return lenis;
    };

    let lenis = createLenis();

    // Handle anchor links with smooth scroll
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
          const targetElement = document.querySelector(href) as HTMLElement;
          if (targetElement) {
            e.preventDefault();
            lenis.scrollTo(targetElement);
          }
        }
      }
    };

    document.addEventListener('click', handleClick);

    // Watch for scroll lock changes and destroy/recreate Lenis
    const checkScrollLock = () => {
      const isLocked = document.body.dataset.scrollLocked === "true";
      if (isLocked && lenisRef.current) {
        // Cancel RAF
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        // Destroy Lenis
        lenisRef.current.destroy();
        lenisRef.current = null;
      } else if (!isLocked && !lenisRef.current) {
        // Recreate Lenis
        lenis = createLenis();
      }
    };

    const observer = new MutationObserver(checkScrollLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked']
    });

    // Initial check
    checkScrollLock();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      document.removeEventListener('click', handleClick);
      observer.disconnect();
    };
  }, []);

  return null;
}
