"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type CinematicImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  children?: React.ReactNode;
};

export function CinematicImage({
  src,
  alt,
  className,
  imageClassName,
  children
}: CinematicImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    element.style.setProperty("--reveal-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--reveal-y", `${event.clientY - rect.top}px`);
    element.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`);
    element.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 5}deg`);
  };

  return (
    <div
      ref={ref}
      className={cn("cinematicImage imageReveal", className)}
      onMouseMove={handleMove}
    >
      <img
        src={src}
        alt={alt}
        className={cn("cinematicImageBase", imageClassName)}
        draggable={false}
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn("cinematicImageColor", imageClassName)}
        draggable={false}
      />
      <span className="cinematicImageVeil" aria-hidden="true" />
      {children}
    </div>
  );
}
