"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBodyScrollLock } from "@/components/site/use-body-scroll-lock";
import { cn } from "@/lib/utils";

type IntroLoaderProps = {
  monogram: string;
  title?: string;
  subtitle?: string;
  onStartExit: () => void;
  onComplete: () => void;
  animateExit?: boolean;
};

export function IntroLoader({
  monogram,
  title = "Weronika Malik",
  subtitle = "Portfolio Aktorskie",
  onStartExit,
  onComplete,
  animateExit = true
}: IntroLoaderProps) {
  // Lock body scroll while loader is active
  useBodyScrollLock(true);
  
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit transition after 3.2 seconds total, allowing SVG and text animations to settle
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      onStartExit();
    }, 3200);

    // Completely unmount after transition completes (3.2s + 1.1s = 4.3s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4300);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onStartExit, onComplete]);

  return (
    <div
      className={cn(
        "intro-loader-container fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-white",
        isExiting ? "translate-y-[-100%]" : "translate-y-0"
      )}
      style={{
        transition: animateExit ? "transform 1100ms cubic-bezier(0.85, 0, 0.15, 1)" : "none"
      }}
    >
      <div className="flex flex-col items-center">
        {/* Dedicated relative wrapper for the circle and monogram to guarantee perfect centering */}
        <div className="relative flex h-[130px] w-[130px] items-center justify-center mb-6">
          {/* Animated SVG Circle */}
          <motion.svg
            width="130"
            height="130"
            viewBox="0 0 100 100"
            fill="none"
            className="absolute inset-0"
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

          {/* Monogram Text in Center (pl-[0.12em] offsets the right tracking space for perfect optical centering) */}
          <motion.div
            className="font-serif text-3xl font-semibold uppercase tracking-[0.12em] pl-[0.12em] text-white flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          >
            {monogram}
          </motion.div>
        </div>

        {/* Name and Tagline */}
        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <motion.h2
            className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.34em] text-white/70 text-center"
            initial={{ letterSpacing: "0.2em" }}
            animate={{ letterSpacing: "0.34em" }}
            transition={{ delay: 0.9, duration: 1.1, ease: "easeOut" }}
          >
            {title}
          </motion.h2>
          <span className="h-[1px] w-8 bg-white/20 my-1" />
          <p className="text-[0.52rem] font-medium uppercase tracking-[0.22em] text-white/40 text-center">
            {subtitle}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
