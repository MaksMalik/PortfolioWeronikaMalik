"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

type IntroLoaderProps = {
  monogram: string;
  onComplete: () => void;
};

export function IntroLoader({ monogram, onComplete }: IntroLoaderProps) {
  useEffect(() => {
    // End loading animation after 2.5 seconds total
    const timer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-white"
      initial={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 1.1, ease: [0.85, 0, 0.15, 1] }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Animated SVG Circle */}
        <motion.svg
          width="130"
          height="130"
          viewBox="0 0 100 100"
          fill="none"
          className="mb-6"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="0.8"
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.svg>

        {/* Monogram Text in Center */}
        <motion.div
          className="absolute font-serif text-3xl font-semibold uppercase tracking-[0.12em] text-white"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        >
          {monogram}
        </motion.div>

        {/* Name and Tagline */}
        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <motion.h2
            className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.34em] text-white/70"
            initial={{ letterSpacing: "0.2em" }}
            animate={{ letterSpacing: "0.34em" }}
            transition={{ delay: 0.9, duration: 1.1, ease: "easeOut" }}
          >
            Weronika Malik
          </motion.h2>
          <span className="h-[1px] w-8 bg-white/20 my-1" />
          <p className="text-[0.52rem] font-medium uppercase tracking-[0.22em] text-white/40">
            Portfolio Aktorskie
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
