"use client";

import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { cn } from "@/lib/utils";

const settingPercentToScale = (value: number) => {
  const normalized = Math.max(0, Math.min(1, (value - 1) / 149));
  return Math.pow(normalized, 1.35);
};

export function BackToTop() {
  const { content } = useAdminEdit();
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const backToTopEnabled = content.backToTopEnabled !== false;
  const customCursorEnabled = content.customCursorEnabled !== false;
  const magnetismEnabled = customCursorEnabled && content.mouseMagnetismEnabled !== false;
  const magnetismScale = settingPercentToScale(
    Math.max(1, Math.min(150, content.mouseMagnetismStrength ?? 100))
  );

  // Monitor scroll height to show/hide button
  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 600);
  });

  // Monitor mobile status
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

  // Map scroll progress (0 to 1) directly to SVG strokeDashoffset (113 to 0)
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [113, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !magnetismEnabled || magnetismScale === 0) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.36 * magnetismScale;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.36 * magnetismScale;
    setOffset({ x, y });
  };

  const handleScrollToTop = () => {
    window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: { href: "#home", source: "anchor" } }));
  };

  if (!backToTopEnabled) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 right-6 z-[60] h-12 w-12 cursor-pointer"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.82 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setOffset({ x: 0, y: 0 })}
          onClick={handleScrollToTop}
          aria-label="Wróć na górę strony"
          role="button"
        >
          <motion.div
            animate={offset}
            transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.6 }}
            className="relative flex h-full w-full items-center justify-center rounded-full border border-ink/10 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.05)] backdrop-blur-md transition-colors hover:border-ink/20"
          >
            {/* Circular Progress Path */}
            <svg className="absolute inset-0 -rotate-90 h-full w-full" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="18"
                className="fill-none stroke-ink/5 stroke-[1.5]"
              />
              <motion.circle
                cx="20"
                cy="20"
                r="18"
                className="fill-none stroke-[var(--accent,theme(colors.ink))] stroke-[1.8]"
                style={{
                  strokeDasharray: 113,
                  strokeDashoffset
                }}
              />
            </svg>
            <ArrowUp className="h-4.5 w-4.5 text-ink/70 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
