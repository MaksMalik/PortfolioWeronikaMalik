"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export function CustomCursor() {
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const springX = useSpring(x, { stiffness: 980, damping: 42, mass: 0.18 });
  const springY = useSpring(y, { stiffness: 980, damping: 42, mass: 0.18 });
  const [mode, setMode] = useState<"default" | "action" | "image">("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.body.classList.add("has-custom-cursor");

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      const target = event.target as HTMLElement | null;
      const isAction = Boolean(
        target?.closest("a, button, input, textarea, label, [role='button']")
      );
      const isImage = Boolean(target?.closest(".cinematicImage, .imageReveal"));
      setMode(isAction ? "action" : isImage ? "image" : "default");
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [x, y]);

  return (
    <motion.div
      className={cn("customCursor", visible && "isVisible", `is-${mode}`)}
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    >
      <span />
    </motion.div>
  );
}
