"use client";

import { type ReactNode, useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  reveal?: boolean;
};

const revealEase = [0.22, 1, 0.36, 1] as const;

export function SectionReveal({ children, className, id, reveal = true }: SectionRevealProps) {
  const revealProps = reveal
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, amount: 0.1, margin: "0px 0px -5% 0px" },
        transition: { duration: 0.7, ease: revealEase }
      }
    : {};

  return (
    <motion.section
      id={id}
      className={className}
      {...revealProps}
    >
      {children}
    </motion.section>
  );
}

export function RevealBlock({
  children,
  className,
  delay = 0,
  x = 0,
  y = 12,
  amount = 0.18
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -10% 0px" }}
      transition={{ delay, duration: 0.65, ease: revealEase }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  className
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rawX = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const springX = useSpring(rawX, { stiffness: 80, damping: 25, restDelta: 0.001 });
  const x = isDesktop ? springX : 0;

  return (
    <div ref={containerRef} className={cn("overflow-visible", className)}>
      <motion.div style={{ x }}>
        <motion.div
          className={cn(
            "space-y-4",
            align === "center" && "mx-auto max-w-3xl text-center"
          )}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.45, margin: "0px 0px -10% 0px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.12
              }
            }
          }}
        >
          <motion.span
            className={cn("eyebrow", align === "center" && "justify-center")}
            variants={{
              hidden: { opacity: 0, x: align === "center" ? 0 : -22, y: 10 },
              visible: { opacity: 1, x: 0, y: 0 }
            }}
            transition={{ duration: 0.72, ease: revealEase }}
          >
            {eyebrow}
          </motion.span>
          <motion.h2
            className="font-serif text-4xl font-medium leading-none text-ink sm:text-6xl lg:text-7xl"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.92, ease: revealEase }}
          >
            {title}
          </motion.h2>
        </motion.div>
      </motion.div>
    </div>
  );
}
