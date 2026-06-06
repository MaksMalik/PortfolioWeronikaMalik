"use client";

import { useEffect } from "react";

export function ImagePreloader({ src }: { src: string }) {
  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    img.fetchPriority = "high";
  }, [src]);

  return null;
}
