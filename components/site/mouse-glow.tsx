"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useAdminEdit } from "@/components/admin/admin-edit-context";

export function MouseGlow() {
  const { content } = useAdminEdit();
  const [isMobile, setIsMobile] = useState(true);
  const [visible, setVisible] = useState(false);
  const mouseGlowEnabled = content.mouseGlowEnabled !== false;

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

  const x = useMotionValue(-500);
  const y = useMotionValue(-500);

  // Smooth trail spring
  const springX = useSpring(x, { stiffness: 45, damping: 24, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 45, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (isMobile || !mouseGlowEnabled) {
      setVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX - 280); // Offset by half of glow size (560px)
      y.set(e.clientY - 280);
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isMobile, mouseGlowEnabled, visible, x, y]);

  if (isMobile || !mouseGlowEnabled || !visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[40] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute h-[560px] w-[560px] rounded-full blur-[120px]"
        style={{
          x: springX,
          y: springY,
          willChange: "transform",
          background: "radial-gradient(circle, var(--accent, #c5a880) 0%, transparent 75%)",
          opacity: 0.045
        }}
      />
    </motion.div>
  );
}
