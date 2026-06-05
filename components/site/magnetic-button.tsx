"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MagneticButtonProps = ButtonProps & {
  href?: string;
};

export function MagneticButton({
  children,
  href,
  className,
  variant = "default",
  ...props
}: MagneticButtonProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
    setOffset({ x, y });
  };

  const button = (
    <Button
      variant={variant}
      className={cn("min-w-44 pr-5", className)}
      {...props}
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  return (
    <motion.div
      animate={offset}
      transition={{ type: "spring", stiffness: 170, damping: 18, mass: 0.55 }}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className="inline-flex"
    >
      {href ? (
        <a href={href} aria-label={String(children)}>
          {button}
        </a>
      ) : (
        button
      )}
    </motion.div>
  );
}
