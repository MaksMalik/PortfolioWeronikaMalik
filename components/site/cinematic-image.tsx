"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type CinematicImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  children?: React.ReactNode;
  onError?: () => void;
};

export function CinematicImage({
  src,
  alt,
  className,
  imageClassName,
  loading = "lazy",
  children,
  onError
}: CinematicImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLImageElement>(null);
  const revealAnim = useRef<Animation | null>(null);
  const tiltFrame = useRef<number | null>(null);

  const isInView = useInView(containerRef, {
    margin: "-10% 0px -10% 0px",
    once: true
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacityTransform = useTransform(
    scrollYProgress,
    [0.18, 0.42, 0.58, 0.82],
    [0, 1, 1, 0]
  );
  
  const springOpacity = useSpring(opacityTransform, { stiffness: 70, damping: 24, mass: 0.8 });

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
    <div
      ref={containerRef}
      className={cn(
        "cinematicImage imageReveal",
        isInView && "in-view-mobile",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={src}
        alt={alt}
        className={cn("cinematicImageBase", imageClassName)}
        loading={loading}
        decoding="async"
        draggable={false}
        onError={onError}
      />
      <motion.img
        ref={colorRef}
        src={src}
        alt=""
        aria-hidden="true"
        className={cn("cinematicImageColor", imageClassName)}
        loading={loading}
        decoding="async"
        draggable={false}
        onError={onError}
        style={{ opacity: isMobile ? springOpacity : undefined } as any}
      />
      <span className="cinematicImageVeil" aria-hidden="true" />
      {children}
    </div>
  );
}
