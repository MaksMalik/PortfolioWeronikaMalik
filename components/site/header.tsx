"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { useBodyScrollLock } from "@/components/site/use-body-scroll-lock";

const settingPercentToScale = (value: number) => {
  const normalized = Math.max(0, Math.min(1, (value - 1) / 149));
  return Math.pow(normalized, 1.35);
};

function MagneticNavLink({
  children,
  href,
  isActive,
  accentColorsEnabled,
  handleNavClick,
  className,
  style,
  ariaCurrent
}: {
  children: React.ReactNode;
  href: string;
  isActive: boolean;
  accentColorsEnabled?: boolean;
  handleNavClick: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  className?: string;
  style?: React.CSSProperties;
  ariaCurrent?: "page";
}) {
  const { content } = useAdminEdit();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const customCursorEnabled = content.customCursorEnabled !== false;
  const magnetismEnabled = customCursorEnabled && content.mouseMagnetismEnabled !== false;
  const magnetismScale = settingPercentToScale(
    Math.max(1, Math.min(150, content.mouseMagnetismStrength ?? 100))
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!magnetismEnabled || magnetismScale === 0) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.32 * magnetismScale;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.32 * magnetismScale;
    setOffset({ x, y });
  };

  return (
    <motion.div
      animate={offset}
      transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className="inline-flex items-center justify-center py-2 px-2 -my-2 -mx-2"
    >
      <a
        href={href}
        className={className}
        style={style}
        aria-current={ariaCurrent}
        onClick={(event) => handleNavClick(event, href)}
      >
        {children}
      </a>
    </motion.div>
  );
}

export function Header({
  monogram
}: {
  monogram: string;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollY } = useScroll();
  const { content } = useAdminEdit();
  useBodyScrollLock(isOpen);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 18);

    if (latest < 120) {
      setShowHeader(true);
    } else {
      const diff = latest - lastScrollY;
      if (diff > 12) {
        setShowHeader(false);
      } else if (diff < -12) {
        setShowHeader(true);
      }
    }
    setLastScrollY(latest);
  });

  const activeNavItems = useMemo(
    () =>
      [
        { label: content.sections.hero.label ?? "Start", href: "#home", enabled: content.sections.hero.enabled },
        { label: content.sections.about.label ?? "O mnie", href: "#about", enabled: content.sections.about.enabled },
        { label: content.sections.portfolio.label ?? "Role", href: "#work", enabled: content.sections.portfolio.enabled },
        { label: content.sections.showreel.label ?? "Showreel", href: "#showreel", enabled: content.sections.showreel.enabled },
        { label: content.sections.gallery.label ?? "Galeria", href: "#gallery", enabled: content.sections.gallery.enabled },
        { label: content.sections.press.label ?? "Prasa", href: "#press", enabled: content.sections.press.enabled },
        { label: content.sections.contact.label ?? "Kontakt", href: "#contact", enabled: content.sections.contact.enabled }
      ].filter((item) => item.enabled),
    [content.sections]
  );

  useEffect(() => {
    if (activeNavItems.length === 0) return;

    let frame = 0;

    const updateActiveSection = () => {
      const anchorY = window.innerHeight * 0.42;
      let nextHref = activeNavItems[0].href;
      let bestDistance = Number.POSITIVE_INFINITY;

      activeNavItems.forEach((item) => {
        const element = document.querySelector<HTMLElement>(item.href);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const sectionContainsAnchor = rect.top <= anchorY && rect.bottom >= anchorY;
        const distance = sectionContainsAnchor ? 0 : Math.min(Math.abs(rect.top - anchorY), Math.abs(rect.bottom - anchorY));

        if (distance < bestDistance) {
          bestDistance = distance;
          nextHref = item.href;
        }
      });

      setActiveHref(nextHref);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [activeNavItems]);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const wasMobileMenuOpen = isOpen;
    setIsOpen(false);
    setActiveHref(href);
    window.history.pushState(null, "", href);

    const dispatchNavigation = () => {
      window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: { href, source: "header" } }));
    };

    window.setTimeout(dispatchNavigation, wasMobileMenuOpen ? 380 : 0);
  };

  const isHeaderVisible = showHeader || isOpen;

  return (
    <header
      className={cn(
        "siteHeaderIntro fixed left-0 right-0 top-0 z-50 border-b transition-[transform,background-color,border-color,box-shadow,backdrop-filter] duration-500",
        isScrolled
          ? "border-ink/10 bg-porcelain/88 shadow-[0_12px_40px_rgba(16,16,16,0.05)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
      style={{
        transform: isHeaderVisible ? "translate3d(0, 0, 0)" : "translate3d(0, -100%, 0)",
        willChange: "transform"
      }}
    >
      <div className="section-shell relative z-50 flex h-20 items-center justify-between">
        <a
          href="#home"
          className={cn(
            "group flex h-11 w-11 items-center justify-center rounded-full border font-serif text-xl font-semibold transition-colors",
            isScrolled
              ? "border-ink/15 text-ink hover:border-ink"
              : "border-white/40 text-white mix-blend-difference hover:border-white"
          )}
          aria-label="Strona główna Weroniki Malik"
          onClick={(e) => handleNavClick(e, "#home")}
        >
          <span className="transition-transform duration-500 group-hover:scale-90">
            {monogram}
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Główna nawigacja">
          {activeNavItems.map((item) => (
            <MagneticNavLink
              key={item.href}
              href={item.href}
              isActive={activeHref === item.href}
              accentColorsEnabled={content.accentColorsEnabled}
              handleNavClick={handleNavClick}
              className={cn(
                "group relative text-[0.68rem] font-bold uppercase tracking-[0.22em] transition-colors",
                isScrolled
                  ? content.accentColorsEnabled
                    ? activeHref === item.href
                      ? ""
                      : "text-ink/62 hover:text-[var(--accent)]"
                    : activeHref === item.href
                      ? "text-ink"
                      : "text-ink/62 hover:text-ink"
                  : "text-white mix-blend-difference hover:text-white/80"
              )}
              style={
                isScrolled && content.accentColorsEnabled && activeHref === item.href
                  ? { color: "var(--accent)" }
                  : undefined
              }
              ariaCurrent={activeHref === item.href ? "page" : undefined}
            >
              {item.label}
              <span
                className={cn(
                  "absolute -bottom-2 left-0 h-px transition-all duration-500 group-hover:w-full",
                  activeHref === item.href ? "w-full" : "w-0",
                  isScrolled
                    ? content.accentColorsEnabled
                      ? "bg-[var(--accent)]"
                      : "bg-ink"
                    : "bg-white"
                )}
              />
            </MagneticNavLink>
          ))}
        </nav>

        <div className="hidden h-9 w-9 lg:block" aria-hidden="true" />

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full border border-ink/10 lg:hidden"
          aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          <motion.span
            className="absolute left-1/2 top-1/2 -ml-2.5 h-px w-5 bg-ink"
            animate={isOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 -ml-2.5 h-px w-5 bg-ink"
            animate={isOpen ? { opacity: 0, scaleX: 0.25 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 -ml-2.5 h-px w-5 bg-ink"
            animate={isOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-between bg-porcelain/95 px-8 pt-28 pb-10 backdrop-blur-2xl lg:hidden h-svh w-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="flex flex-col gap-6 pt-8 overflow-y-auto no-scrollbar"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  transition: { staggerChildren: 0.05, delayChildren: 0.06 }
                },
                closed: {
                  transition: { staggerChildren: 0.04, staggerDirection: -1 }
                }
              }}
            >
              {activeNavItems.map((item) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  variants={{
                    open: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                    closed: { opacity: 0, y: 18, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }
                  }}
                  className={cn(
                    "font-serif text-4xl font-normal tracking-wide transition-colors",
                    content.accentColorsEnabled
                      ? activeHref === item.href
                        ? ""
                        : "text-ink/45 hover:text-[var(--accent)]"
                      : activeHref === item.href
                        ? "text-ink"
                        : "text-ink/45 hover:text-ink"
                  )}
                  style={
                    content.accentColorsEnabled && activeHref === item.href
                      ? { color: "var(--accent)" }
                      : undefined
                  }
                  aria-current={activeHref === item.href ? "page" : undefined}
                  onClick={(event) => handleNavClick(event, item.href)}
                >
                  {item.label}
                </motion.a>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-ink/10 pt-6 flex flex-col gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink/40"
            >
              <span>{monogram} — Weronika Malik</span>
              <div className="flex justify-between items-center">
                <span>Warszawa / Londyn</span>
                <span>© {new Date().getFullYear()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

