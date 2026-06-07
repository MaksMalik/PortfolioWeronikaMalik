"use client";

import { type ReactNode, useRef, useSyncExternalStore } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  reveal?: boolean;
};

const revealEase = [0.22, 1, 0.36, 1] as const;
const desktopQuery = "(min-width: 1024px)";

function subscribeDesktop(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(desktopQuery).matches;
}

function getDesktopServerSnapshot() {
  return false;
}

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

function MobileSectionHeading({
  eyebrow,
  title,
  align = "left",
  className
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  return (
    <div className={cn("overflow-visible w-full", className)}>
      <motion.div
        className={cn(
          "space-y-4 w-full",
          align === "center" && "mx-auto max-w-3xl text-center",
          align === "right" && "ml-auto max-w-3xl text-right flex flex-col items-end"
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
          className={cn("eyebrow", align === "center" && "justify-center", align === "right" && "justify-end")}
          variants={{
            hidden: { opacity: 0, x: align === "center" ? 0 : align === "right" ? 22 : -22, y: 10 },
            visible: { opacity: 1, x: 0, y: 0 }
          }}
          transition={{ duration: 0.72, ease: revealEase }}
        >
          {eyebrow}
        </motion.span>
        <motion.h2
          className="font-serif text-4xl font-normal leading-none text-ink sm:text-6xl lg:text-7xl"
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.92, ease: revealEase }}
        >
          {title}
        </motion.h2>
      </motion.div>
    </div>
  );
}

function DesktopSectionHeading({
  eyebrow,
  title,
  align = "left",
  className,
  reverseDirection = false
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center" | "right";
  className?: string;
  reverseDirection?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rawXTitle = useTransform(
    scrollYProgress,
    [0, 1],
    reverseDirection ? [24, -24] : [-24, 24]
  );
  const xTitle = useSpring(rawXTitle, { stiffness: 80, damping: 25, restDelta: 0.001 });

  const rawXEyebrow = useTransform(
    scrollYProgress,
    [0, 1],
    reverseDirection ? [-24, 24] : [24, -24]
  );
  const xEyebrow = useSpring(rawXEyebrow, { stiffness: 80, damping: 25, restDelta: 0.001 });

  return (
    <div ref={containerRef} className={cn("overflow-visible w-full", className)}>
      <motion.div
        className={cn(
          "space-y-4 w-full",
          align === "center" && "mx-auto max-w-3xl text-center",
          align === "right" && "ml-auto max-w-3xl text-right flex flex-col items-end"
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
          className={cn("eyebrow", align === "center" && "justify-center", align === "right" && "justify-end")}
          style={{ x: xEyebrow }}
          variants={{
            hidden: { opacity: 0, x: align === "center" ? 0 : align === "right" ? 22 : -22, y: 10 },
            visible: { opacity: 1, x: 0, y: 0 }
          }}
          transition={{ duration: 0.72, ease: revealEase }}
        >
          {eyebrow}
        </motion.span>
        <motion.h2
          className="font-serif text-4xl font-normal leading-none text-ink sm:text-6xl lg:text-7xl"
          style={{ x: xTitle }}
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.92, ease: revealEase }}
        >
          {title}
        </motion.h2>
      </motion.div>
    </div>
  );
}

export function SectionHeading(props: {
  eyebrow: string;
  title: string;
  align?: "left" | "center" | "right";
  className?: string;
  reverseDirection?: boolean;
}) {
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  if (isDesktop) {
    return <DesktopSectionHeading {...props} />;
  }
  return <MobileSectionHeading {...props} />;
}
