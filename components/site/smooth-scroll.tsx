"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";

const ANCHOR_SCROLL_DURATION = 1.15;
const ANCHOR_SKIP_FINISH_DELAY = 120;
const SECTION_TRANSITION_ENTER_MS = 280;
const SECTION_TRANSITION_HOLD_MS = 130;
const SECTION_TRANSITION_END_MS = 620;

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
  const [sectionTransition, setSectionTransition] = useState<SectionTransitionState | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const createLenis = () => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.8,
        touchMultiplier: 1.5,
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
        window.scrollTo({ top, behavior: skipHorizontalSection ? "auto" : "smooth" });
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

    // Handle anchor links with smooth scroll. Header navigation dispatches
    // a custom event after preventDefault, so skip already-handled clicks.
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
      clearSectionTransitionTimers();
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

  return (
    <AnimatePresence>
      {sectionTransition && (
        <motion.div
          key={sectionTransition.href}
          className="pointer-events-none fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-ink text-porcelain"
          initial={{ clipPath: sectionTransition.direction === "down" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0 0)" }}
          exit={{ clipPath: sectionTransition.direction === "down" ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)" }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <motion.div
            className="flex flex-col items-center gap-5 px-8 text-center"
            initial={{ opacity: 0, y: sectionTransition.direction === "down" ? 18 : -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: sectionTransition.direction === "down" ? -16 : 16 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="h-px w-24 bg-porcelain/28" />
            <span className="font-serif text-4xl font-medium tracking-wide text-porcelain sm:text-6xl">
              {sectionTransition.label}
            </span>
            <span className="h-px w-12 bg-porcelain/18" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



