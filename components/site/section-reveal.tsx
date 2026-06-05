"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function SectionReveal({ children, className, id }: SectionRevealProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
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
    <div
      className={cn(
        "space-y-4",
        align === "center" && "mx-auto max-w-3xl text-center",
        className
      )}
    >
      <span className={cn("eyebrow", align === "center" && "justify-center")}>
        {eyebrow}
      </span>
      <h2 className="font-serif text-5xl font-medium leading-none text-ink sm:text-6xl lg:text-7xl">
        {title}
      </h2>
    </div>
  );
}
