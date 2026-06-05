"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
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
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18, margin: "0px 0px -8% 0px" },
        transition: { duration: 0.9, ease: revealEase }
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
  y = 28,
  amount = 0.22
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
      transition={{ delay, duration: 0.82, ease: revealEase }}
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
  return (
    <motion.div
      className={cn(
        "space-y-4",
        align === "center" && "mx-auto max-w-3xl text-center",
        className
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
          hidden: { opacity: 0, x: align === "center" ? 0 : -22, y: 10, filter: "blur(2px)" },
          visible: { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
        }}
        transition={{ duration: 0.72, ease: revealEase }}
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        className="font-serif text-4xl font-medium leading-none text-ink sm:text-6xl lg:text-7xl"
        variants={{
          hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" }
        }}
        transition={{ duration: 0.92, ease: revealEase }}
      >
        {title}
      </motion.h2>
    </motion.div>
  );
}
