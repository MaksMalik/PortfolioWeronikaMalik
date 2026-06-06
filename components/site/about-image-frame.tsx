"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FrameMetrics = {
  width: number;
  height: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
};

type RadiusProperty = "borderTopRightRadius" | "borderBottomRightRadius" | "borderBottomLeftRadius";

function readRadius(element: Element | null, property: RadiusProperty) {
  if (!element) return 24;
  const style = window.getComputedStyle(element);
  return Number.parseFloat(style[property]) || 0;
}

export function AboutImageFrame({
  className,
  inset = 18
}: {
  className?: string;
  inset?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [metrics, setMetrics] = useState<FrameMetrics>({
    width: 100,
    height: 100,
    topRight: 24,
    bottomRight: 24,
    bottomLeft: 24
  });

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
        topRight: Math.max(0, readRadius(image, "borderTopRightRadius")),
        bottomRight: Math.max(0, readRadius(image, "borderBottomRightRadius")),
        bottomLeft: Math.max(0, readRadius(image, "borderBottomLeftRadius"))
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
  const maxRadius = Math.min((x2 - x1) / 2, (y2 - y1) / 2);
  const topRight = Math.min(metrics.topRight, maxRadius);
  const bottomRight = Math.min(metrics.bottomRight, maxRadius);
  const bottomLeft = Math.min(metrics.bottomLeft, maxRadius);

  const path = [
    `M ${x1} ${y1}`,
    `V ${y2 - bottomLeft}`,
    `Q ${x1} ${y2} ${x1 + bottomLeft} ${y2}`,
    `H ${x2 - bottomRight}`,
    `Q ${x2} ${y2} ${x2} ${y2 - bottomRight}`,
    `V ${y1 + topRight}`,
    `Q ${x2} ${y1} ${x2 - topRight} ${y1}`,
    `H ${x1}`
  ].join(" ");

  return (
    <svg
      ref={ref}
      className={cn("about-image-frame", className)}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} pathLength="1" />
    </svg>
  );
}
