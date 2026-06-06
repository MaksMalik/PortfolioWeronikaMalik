"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

const ANCHOR_SCROLL_DURATION = 1.15;
const ANCHOR_SKIP_FINISH_DELAY = 120;

const shouldSkipHorizontalSection = (targetTop: number, href: string) => {
  if (href === "#about") return false;

  const about = document.querySelector<HTMLElement>("#about");
  if (!about) return false;

  const currentTop = window.scrollY;
  const aboutTop = about.getBoundingClientRect().top + currentTop;
  const aboutBottom = aboutTop + about.offsetHeight;
  const pathStart = Math.min(currentTop, targetTop);
  const pathEnd = Math.max(currentTop, targetTop);

  return pathStart < aboutBottom && pathEnd > aboutTop;
};

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);
  const anchorScrollEndTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const createLenis = () => {
      const lenis = new Lenis({
        duration: 1.45,
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

    createLenis();

    const scrollToHash = (href: string, shouldPushState = true) => {
      if (!href || href === "#") return false;
      const targetElement = document.querySelector(href) as HTMLElement | null;
      if (!targetElement) return false;

      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 80;
      const offset = -headerHeight - 14;
      const top = Math.max(0, targetElement.getBoundingClientRect().top + window.scrollY + offset);
      const activeLenis = lenisRef.current;
      const skipHorizontalSection = shouldSkipHorizontalSection(top, href);
      const finishDelay = skipHorizontalSection
        ? ANCHOR_SKIP_FINISH_DELAY
        : ANCHOR_SCROLL_DURATION * 1000 + 260;

      window.dispatchEvent(new CustomEvent("portfolio:anchor-scroll-start", {
        detail: { href, skipHorizontalSection, top }
      }));
      if (anchorScrollEndTimerRef.current !== null) {
        window.clearTimeout(anchorScrollEndTimerRef.current);
      }
      anchorScrollEndTimerRef.current = window.setTimeout(() => {
        anchorScrollEndTimerRef.current = null;
        window.dispatchEvent(new CustomEvent("portfolio:anchor-scroll-end", {
          detail: { href, skipHorizontalSection, top }
        }));
      }, finishDelay);

      if (activeLenis) {
        activeLenis.scrollTo(top, {
          immediate: skipHorizontalSection,
          duration: ANCHOR_SCROLL_DURATION
        });
      } else {
        window.scrollTo({ top, behavior: skipHorizontalSection ? "auto" : "smooth" });
      }

      if (shouldPushState && window.location.hash !== href) {
        window.history.pushState(null, "", href);
      }

      return true;
    };

    const handleProgrammaticNavigation = (event: Event) => {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href;
      if (!href) return;
      scrollToHash(href, false);
    };

    // Handle anchor links with smooth scroll. Header navigation dispatches
    // a custom event after preventDefault, so skip already-handled clicks.
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && scrollToHash(href)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('click', handleClick);
    window.addEventListener("portfolio:navigate", handleProgrammaticNavigation);

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
        createLenis();
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
      if (anchorScrollEndTimerRef.current !== null) {
        window.clearTimeout(anchorScrollEndTimerRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      document.removeEventListener('click', handleClick);
      window.removeEventListener("portfolio:navigate", handleProgrammaticNavigation);
      observer.disconnect();
    };
  }, []);

  return null;
}
