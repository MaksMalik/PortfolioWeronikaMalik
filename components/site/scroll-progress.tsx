"use client";

import { motion, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 top-0 z-[70] h-px origin-left bg-ink"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
}
