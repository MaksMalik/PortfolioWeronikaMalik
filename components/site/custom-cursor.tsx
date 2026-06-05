"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

import { useAdminEdit } from "@/components/admin/admin-edit-context";

export function CustomCursor() {
  const { editMode } = useAdminEdit();
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const springX = useSpring(x, { stiffness: 980, damping: 42, mass: 0.18 });
  const springY = useSpring(y, { stiffness: 980, damping: 42, mass: 0.18 });
  const [mode, setMode] = useState<"default" | "action" | "image" | "play">("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (editMode) {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.add("is-edit-mode");
      return;
    }

    document.body.classList.add("has-custom-cursor");
    document.body.classList.remove("is-edit-mode");

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      const target = event.target as HTMLElement | null;
      const isShowreel = Boolean(target?.closest("#showreel .cinematicImage, #showreel button"));
      const isAction = Boolean(
        target?.closest("a, button, input, textarea, label, [role='button']")
      );
      const isImage = Boolean(target?.closest(".cinematicImage, .imageReveal"));

      if (isShowreel) {
        setMode("play");
      } else if (isAction) {
        setMode("action");
      } else if (isImage) {
        setMode("image");
      } else {
        setMode("default");
      }
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.remove("is-edit-mode");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [editMode, x, y]);

  if (editMode) {
    return null;
  }

  return (
    <motion.div
      className={cn("customCursor", visible && "isVisible", `is-${mode}`)}
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    >
      <span className="relative flex h-full w-full items-center justify-center">
        {mode === "image" && (
          <span className="text-[0.44rem] font-bold uppercase tracking-[0.2em] text-white">
            Zobacz
          </span>
        )}
        {mode === "play" && (
          <span className="text-[0.44rem] font-bold uppercase tracking-[0.22em] text-white pl-[2px]">
            Play
          </span>
        )}
      </span>
    </motion.div>
  );
}
