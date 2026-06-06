"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FrameMetrics = {
  width: number;
  height: number;
  radius: number;
};

function readRadius(element: Element | null) {
  if (!element) return 16;
  const style = window.getComputedStyle(element);
  return Number.parseFloat(style.borderTopLeftRadius) || 16;
}

export function CinematicCardFrame({
  className,
  inset = 14
}: {
  className?: string;
  inset?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [metrics, setMetrics] = useState<FrameMetrics>({ width: 100, height: 100, radius: 16 });

  useLayoutEffect(() => {
    const svg = ref.current;
    const parent = svg?.parentElement;
    if (!parent) return;

    const image = parent.querySelector(".cinematicImage") ?? parent;

    const updateMetrics = () => {
      const rect = parent.getBoundingClientRect();
      setMetrics({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        radius: Math.max(10, readRadius(image))
      });
    };

    updateMetrics();

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(parent);

    return () => observer.disconnect();
  }, []);

  const x1 = inset;
  const y1 = inset;
  const x2 = Math.max(inset, metrics.width - inset);
  const y2 = Math.max(inset, metrics.height - inset);
  const radius = Math.min(metrics.radius, (x2 - x1) / 2, (y2 - y1) / 2);
  const path = `M ${x1} ${y2} V ${y1 + radius} Q ${x1} ${y1} ${x1 + radius} ${y1} H ${x2 - radius} Q ${x2} ${y1} ${x2} ${y1 + radius} V ${y2}`;

  return (
    <svg
      ref={ref}
      className={cn("cinematic-card-frame", className)}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} pathLength="1" />
    </svg>
  );
}
