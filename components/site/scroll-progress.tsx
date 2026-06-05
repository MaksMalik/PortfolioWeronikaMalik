"use client";

import { motion, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-ink/30 via-ink/80 to-ink shadow-[0_1px_4px_rgba(16,16,16,0.15)]"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
}
