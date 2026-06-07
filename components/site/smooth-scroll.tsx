"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, animate } from "framer-motion";
import Lenis from "lenis";
import { useBodyScrollLock } from "@/components/site/use-body-scroll-lock";

const ANCHOR_SCROLL_DURATION = 1.15;
const ANCHOR_SKIP_FINISH_DELAY = 120;
const SECTION_TRANSITION_ENTER_MS = 360;
const SECTION_TRANSITION_HOLD_MS = 120;
const SECTION_TRANSITION_END_MS = 900;
const CURTAIN_EASE = [0.22, 1, 0.36, 1] as const;

type AnchorNavigationSource = "anchor" | "header";

type SectionTransitionState = {
  direction: "down" | "up";
  href: string;
  label: string;
};

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

const getAnchorLabel = (href: string, targetElement: HTMLElement) => {
  const navLabel = document.querySelector<HTMLAnchorElement>(`header a[href="${href}"]`)?.textContent?.trim();
  if (navLabel) return navLabel;

  const heading = targetElement.querySelector<HTMLElement>("h1, h2, h3")?.textContent?.trim();
  if (heading) return heading;

  return href.replace("#", "");
};

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);
  const anchorScrollEndTimerRef = useRef<number | null>(null);
  const sectionTransitionTimersRef = useRef<number[]>([]);
  const isTransitionActiveRef = useRef<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sectionTransition, setSectionTransition] = useState<SectionTransitionState | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useBodyScrollLock(isTransitioning);

  const backdropVariants = {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.34, ease: "easeInOut" as const }
    },
    exit: {
      opacity: 0,
      transition: { delay: prefersReducedMotion ? 0 : 0.12, duration: prefersReducedMotion ? 0.01 : 0.3, ease: "easeInOut" as const }
    }
  };

  const intermediateVariants = {
    initial: (direction: "down" | "up") => ({
      y: direction === "down" ? "100%" : "-100%"
    }),
    animate: {
      y: "0%",
      transition: { delay: prefersReducedMotion ? 0 : 0.06, duration: prefersReducedMotion ? 0.01 : 0.32, ease: CURTAIN_EASE }
    },
    exit: (direction: "down" | "up") => ({
      y: direction === "down" ? "-100%" : "100%",
      transition: { delay: prefersReducedMotion ? 0 : 0.06, duration: prefersReducedMotion ? 0.01 : 0.32, ease: CURTAIN_EASE }
    })
  };

  const solidVariants = {
    initial: (direction: "down" | "up") => ({
      y: direction === "down" ? "100%" : "-100%"
    }),
    animate: {
      y: "0%",
      transition: { delay: prefersReducedMotion ? 0 : 0.12, duration: prefersReducedMotion ? 0.01 : 0.3, ease: CURTAIN_EASE }
    },
    exit: (direction: "down" | "up") => ({
      y: direction === "down" ? "-100%" : "100%",
      transition: { delay: prefersReducedMotion ? 0 : 0, duration: prefersReducedMotion ? 0.01 : 0.34, ease: CURTAIN_EASE }
    })
  };

  useEffect(() => {
    const isMobileOrTouch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;

    const clearSectionTransitionTimers = () => {
      sectionTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      sectionTransitionTimersRef.current = [];
    };

    const scheduleSectionTransitionTimer = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        sectionTransitionTimersRef.current = sectionTransitionTimersRef.current.filter((item) => item !== timer);
        callback();
      }, delay);
      sectionTransitionTimersRef.current.push(timer);
    };

    const scrollToHash = (
      href: string,
      shouldPushState = true,
      source: AnchorNavigationSource = "anchor"
    ) => {
      if (!href || href === "#") return false;
      if (isTransitionActiveRef.current) {
        // Block concurrent navigations to prevent interrupting curtain animations
        return true;
      }
      const targetElement = document.querySelector(href) as HTMLElement | null;
      if (!targetElement) return false;

      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 80;
      const offset = -headerHeight - 14;
      const currentTop = window.scrollY;
      const top = Math.max(0, targetElement.getBoundingClientRect().top + window.scrollY + offset);
      const activeLenis = lenisRef.current;
      const skipHorizontalSection = shouldSkipHorizontalSection(top, href);
      const distance = Math.abs(top - currentTop);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const useSectionTransition = distance > 32 && (source === "header" || skipHorizontalSection);
      const finishDelay = useSectionTransition
        ? prefersReducedMotion
          ? ANCHOR_SKIP_FINISH_DELAY
          : SECTION_TRANSITION_END_MS
        : skipHorizontalSection
        ? ANCHOR_SKIP_FINISH_DELAY
        : ANCHOR_SCROLL_DURATION * 1000 + 260;

      window.dispatchEvent(new CustomEvent("portfolio:anchor-scroll-start", {
        detail: { href, skipHorizontalSection, source, top, useSectionTransition }
      }));
      if (anchorScrollEndTimerRef.current !== null) {
        window.clearTimeout(anchorScrollEndTimerRef.current);
      }
      anchorScrollEndTimerRef.current = window.setTimeout(() => {
        anchorScrollEndTimerRef.current = null;
        if (useSectionTransition) {
          isTransitionActiveRef.current = false;
          setIsTransitioning(false);
        }
        window.dispatchEvent(new CustomEvent("portfolio:anchor-scroll-end", {
          detail: { href, skipHorizontalSection, source, top, useSectionTransition }
        }));
      }, finishDelay);

      const scrollImmediately = () => {
        if (activeLenis) {
          activeLenis.scrollTo(top, {
            immediate: true,
            duration: 0
          });
        } else {
          window.scrollTo({ top, behavior: "auto" });
        }

        if (shouldPushState && window.location.hash !== href) {
          window.history.pushState(null, "", href);
        }
      };

      if (useSectionTransition) {
        isTransitionActiveRef.current = true;
        setIsTransitioning(true);

        clearSectionTransitionTimers();
        setSectionTransition({
          direction: top >= currentTop ? "down" : "up",
          href,
          label: getAnchorLabel(href, targetElement)
        });

        if (prefersReducedMotion) {
          scrollImmediately();
          scheduleSectionTransitionTimer(() => setSectionTransition(null), 80);
          return true;
        }

        scheduleSectionTransitionTimer(scrollImmediately, SECTION_TRANSITION_ENTER_MS);
        scheduleSectionTransitionTimer(() => setSectionTransition(null), SECTION_TRANSITION_ENTER_MS + SECTION_TRANSITION_HOLD_MS);
        return true;
      }

      if (activeLenis) {
        activeLenis.scrollTo(top, {
          immediate: skipHorizontalSection,
          duration: ANCHOR_SCROLL_DURATION
        });
      } else {
        if (skipHorizontalSection || prefersReducedMotion) {
          window.scrollTo({ top, behavior: "auto" });
        } else {
          // Native "smooth" scrolling on iOS is sluggish. Use Framer Motion's GPU-synced animate loop
          const currentY = window.scrollY;
          animate(currentY, top, {
            duration: 0.8,
            ease: [0.32, 0.72, 0, 1],
            onUpdate: (latest) => window.scrollTo({ top: latest, left: 0, behavior: "auto" })
          });
        }
      }

      if (shouldPushState && window.location.hash !== href) {
        window.history.pushState(null, "", href);
      }
      return true;
    };

    const handleProgrammaticNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ href?: string; source?: AnchorNavigationSource }>).detail;
      const href = detail?.href;
      if (!href) return;
      scrollToHash(href, false, detail?.source ?? "anchor");
    };

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        const source: AnchorNavigationSource = anchor.closest("header") ? "header" : "anchor";
        if (href && scrollToHash(href, true, source)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('click', handleClick);
    window.addEventListener("portfolio:navigate", handleProgrammaticNavigation);

    if (isMobileOrTouch) {
      // Mobile & touch early exit: completely bypass Lenis initialization
      // to rely on native GPU-accelerated momentum scrolling and fix horizontal swipe carousels.
      return () => {
        clearSectionTransitionTimers();
        if (anchorScrollEndTimerRef.current !== null) {
          window.clearTimeout(anchorScrollEndTimerRef.current);
        }
        document.removeEventListener('click', handleClick);
        window.removeEventListener("portfolio:navigate", handleProgrammaticNavigation);
      };
    }

    // Desktop only scroll container animation loop
    const stopRaf = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const startRaf = (lenis: Lenis) => {
      if (rafRef.current !== null || document.hidden) return;

      function raf(time: number) {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      }

      rafRef.current = requestAnimationFrame(raf);
    };

    const createLenis = () => {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.0,
        infinite: false,
      });

      lenisRef.current = lenis;
      startRaf(lenis);

      return lenis;
    };

    createLenis();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRaf();
        return;
      }

      if (lenisRef.current) {
        startRaf(lenisRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Watch for scroll lock changes and destroy/recreate Lenis
    const checkScrollLock = () => {
      const isLocked = document.body.dataset.scrollLocked === "true";
      if (isLocked && lenisRef.current) {
        stopRaf();
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
      clearSectionTransitionTimers();
      if (anchorScrollEndTimerRef.current !== null) {
        window.clearTimeout(anchorScrollEndTimerRef.current);
      }
      stopRaf();
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      document.removeEventListener('click', handleClick);
      window.removeEventListener("portfolio:navigate", handleProgrammaticNavigation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {sectionTransition && (
        <motion.div
          key={`${sectionTransition.href}-layer1`}
          className="pointer-events-none fixed inset-0 z-[999997] bg-ink/15 backdrop-blur-md"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ willChange: "opacity" }}
          aria-hidden="true"
        />
      )}

      {sectionTransition && (
        <motion.div
          key={`${sectionTransition.href}-layer2`}
          className="pointer-events-none fixed inset-0 z-[999998] bg-muted/95 dark:bg-muted/80"
          custom={sectionTransition.direction}
          variants={intermediateVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ willChange: "transform" }}
          aria-hidden="true"
        />
      )}

      {sectionTransition && (
        <motion.div
          key={sectionTransition.href}
          className="pointer-events-none fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-ink text-porcelain"
          custom={sectionTransition.direction}
          variants={solidVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ willChange: "transform" }}
          aria-hidden="true"
        >
          <motion.div
            className="flex flex-col items-center gap-5 px-8 text-center"
            initial={{ opacity: 0, y: sectionTransition.direction === "down" ? 18 : -18 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.16, duration: prefersReducedMotion ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1] }
            }}
            exit={{
              opacity: 0,
              y: sectionTransition.direction === "down" ? -16 : 16,
              transition: { delay: 0, duration: prefersReducedMotion ? 0.01 : 0.15, ease: [0.22, 1, 0.36, 1] }
            }}
          >
            <span className="h-px w-24 bg-porcelain/28" />
            <span className="font-serif text-4xl font-normal tracking-wide text-porcelain sm:text-6xl">
              {sectionTransition.label}
            </span>
            <span className="h-px w-12 bg-porcelain/18" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



