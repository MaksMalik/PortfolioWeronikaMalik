"use client";

import { useRef, useEffect, useCallback, memo } from "react";
import { useInView, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CinematicImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  children?: React.ReactNode;
  onError?: () => void;
  disableScrollReveal?: boolean;
  layoutId?: string;
  transition?: any;
};

function StaticCinematicImage({
  src,
  alt,
  className,
  imageClassName,
  loading = "lazy",
  fetchPriority,
  children,
  onError,
  layoutId,
  transition
}: Omit<CinematicImageProps, "disableScrollReveal">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltFrame = useRef<number | null>(null);
  const isTouchRef = useRef(false);

  useEffect(() => {
    isTouchRef.current =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (tiltFrame.current !== null) return;

      tiltFrame.current = window.requestAnimationFrame(() => {
        tiltFrame.current = null;
        const rect = el.getBoundingClientRect();
        const nx = (clientX - rect.left) / rect.width - 0.5;
        const ny = (clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tilt-x", `${ny * -5}deg`);
        el.style.setProperty("--tilt-y", `${nx * 5}deg`);
        el.style.setProperty("--spot-x", `${clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${clientY - rect.top}px`);
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    if (isTouchRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    if (tiltFrame.current !== null) {
      window.cancelAnimationFrame(tiltFrame.current);
      tiltFrame.current = null;
    }
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "cinematicImage isStatic",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      layoutId={layoutId}
      transition={transition}
    >
      <img
        src={src}
        alt={alt}
        className={cn("cinematicImageColor", imageClassName)}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        onError={onError}
      />
      <span className="cinematicImageVeil" aria-hidden="true" />
      {children}
    </motion.div>
  );
}

function ScrollRevealCinematicImage({
  src,
  alt,
  className,
  imageClassName,
  loading = "lazy",
  fetchPriority,
  children,
  onError,
  layoutId,
  transition
}: Omit<CinematicImageProps, "disableScrollReveal">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLImageElement>(null);
  const revealAnim = useRef<Animation | null>(null);
  const tiltFrame = useRef<number | null>(null);

  const isInView = useInView(containerRef, {
    margin: "-10% 0px -10% 0px",
    once: true
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mobileQuery = window.matchMedia("(pointer: coarse), (max-width: 1024px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const updateMobileColorProgress = () => {
      frame = 0;

      if (!mobileQuery.matches) {
        container.style.removeProperty("--mobile-color-progress");
        return;
      }

      if (reducedMotionQuery.matches) {
        container.style.setProperty("--mobile-color-progress", "1");
        return;
      }

      const rect = container.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      const activeDistance = Math.max(window.innerHeight * 0.56, rect.height * 1.15);
      const rawProgress = Math.max(0, Math.min(1, 1 - distance / activeDistance));
      const easedProgress = Math.pow(rawProgress, 0.72);

      container.style.setProperty("--mobile-color-progress", easedProgress.toFixed(3));
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateMobileColorProgress);
    };

    updateMobileColorProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    mobileQuery.addEventListener("change", scheduleUpdate);
    reducedMotionQuery.addEventListener("change", scheduleUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mobileQuery.removeEventListener("change", scheduleUpdate);
      reducedMotionQuery.removeEventListener("change", scheduleUpdate);
    };
  }, []);

  /* ── Circle-reveal animation (desktop / fine-pointer only) ──── */
  useEffect(() => {
    const container = containerRef.current;
    const color = colorRef.current;
    if (!container || !color) return;

    // Skip JS animations on touch devices — mobile uses CSS opacity via in-view-mobile
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    // If this image is inside a .group card, listen on that so hovering
    // the card text area also triggers the reveal.
    const hoverTarget =
      (container.closest(".group") as HTMLElement | null) ?? container;

    const calcMaxRadius = (x: number, y: number, w: number, h: number) =>
      Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));

    const onEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      const r = calcMaxRadius(x, y, rect.width, rect.height);

      revealAnim.current?.cancel();
      revealAnim.current = color.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${r}px at ${x}px ${y}px)` }
        ],
        {
          duration: 1200,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }
      );
    };

    const onLeave = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      const r = calcMaxRadius(x, y, rect.width, rect.height);

      revealAnim.current?.cancel();
      revealAnim.current = color.animate(
        [
          { clipPath: `circle(${r}px at ${x}px ${y}px)` },
          { clipPath: `circle(0px at ${x}px ${y}px)` }
        ],
        {
          duration: 650,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          fill: "forwards"
        }
      );
    };

    hoverTarget.addEventListener("mouseenter", onEnter);
    hoverTarget.addEventListener("mouseleave", onLeave);

    return () => {
      hoverTarget.removeEventListener("mouseenter", onEnter);
      hoverTarget.removeEventListener("mouseleave", onLeave);
      revealAnim.current?.cancel();
      if (tiltFrame.current !== null) {
        window.cancelAnimationFrame(tiltFrame.current);
      }
    };
  }, []);

  /* ── 3D tilt + spotlight follow (direct image hover only) ───── */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (tiltFrame.current !== null) return;

      tiltFrame.current = window.requestAnimationFrame(() => {
        tiltFrame.current = null;
        const rect = el.getBoundingClientRect();
        const nx = (clientX - rect.left) / rect.width - 0.5;
        const ny = (clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tilt-x", `${ny * -5}deg`);
        el.style.setProperty("--tilt-y", `${nx * 5}deg`);
        el.style.setProperty("--spot-x", `${clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${clientY - rect.top}px`);
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (tiltFrame.current !== null) {
      window.cancelAnimationFrame(tiltFrame.current);
      tiltFrame.current = null;
    }
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "cinematicImage imageReveal",
        isInView && "in-view-mobile",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      layoutId={layoutId}
      transition={transition}
    >
      <img
        src={src}
        alt={alt}
        className={cn("cinematicImageBase", imageClassName)}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        onError={onError}
      />
      <img
        ref={colorRef}
        src={src}
        alt=""
        aria-hidden="true"
        className={cn("cinematicImageColor", imageClassName)}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        onError={onError}
      />
      <span className="cinematicImageVeil" aria-hidden="true" />
      {children}
    </motion.div>
  );
}

export const CinematicImage = memo(function CinematicImage(props: CinematicImageProps) {
  if (props.disableScrollReveal) {
    return <StaticCinematicImage {...props} />;
  }
  return <ScrollRevealCinematicImage {...props} />;
});
