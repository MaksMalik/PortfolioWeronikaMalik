"use client";

import { useRef, useEffect, memo } from "react";
import { useInView, motion, type Transition } from "framer-motion";
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
  transition?: Transition;
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
  return (
    <motion.div
      className={cn(
        "cinematicImage isStatic",
        className
      )}
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

  const isInView = useInView(containerRef, {
    margin: "-10% 0px -10% 0px",
    once: true
  });



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
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "cinematicImage imageReveal",
        isInView && "in-view-mobile",
        className
      )}
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


