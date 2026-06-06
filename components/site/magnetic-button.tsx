"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminEdit } from "@/components/admin/admin-edit-context";

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
  const { content } = useAdminEdit();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const magnetismEnabled = content.mouseMagnetismEnabled !== false;
  const magnetismStrength = Math.max(0, Math.min(1.5, (content.mouseMagnetismStrength ?? 100) / 100));

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!magnetismEnabled || magnetismStrength === 0) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.16 * magnetismStrength;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18 * magnetismStrength;
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
      transition={{ type: "spring", stiffness: 100, damping: 15, mass: 0.8 }}
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

