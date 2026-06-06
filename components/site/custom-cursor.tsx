"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

import { useAdminEdit } from "@/components/admin/admin-edit-context";

export function CustomCursor() {
  const { editMode } = useAdminEdit();
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const springX = useSpring(x, { stiffness: 980, damping: 42, mass: 0.18 });
  const springY = useSpring(y, { stiffness: 980, damping: 42, mass: 0.18 });
  const [mode, setMode] = useState<"default" | "action" | "view" | "play">("default");
  const [visible, setVisible] = useState(false);
  const modeRef = useRef(mode);
  const visibleRef = useRef(visible);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (editMode) {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.add("is-edit-mode");
      return;
    }

    document.body.classList.add("has-custom-cursor");
    document.body.classList.remove("is-edit-mode");

    const cursorSize = (nextMode: typeof mode) => {
      if (nextMode === "view" || nextMode === "play") return 72;
      if (nextMode === "action") return 54;
      return 38;
    };

    const handleMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isShowreel = Boolean(target?.closest("[data-cursor='play']"));
      const isViewable = Boolean(target?.closest("[data-cursor='view']"));
      const isAction = Boolean(
        target?.closest("a, button, input, textarea, label, [role='button']")
      );

      let nextMode: typeof mode = "default";
      if (isShowreel) {
        nextMode = "play";
      } else if (isViewable) {
        nextMode = "view";
      } else if (isAction) {
        nextMode = "action";
      }

      const size = cursorSize(nextMode);
      
      const magneticTarget = target?.closest("a, button, [role='button']");
      let targetX = event.clientX - size / 2;
      let targetY = event.clientY - size / 2;

      if (magneticTarget) {
        const rect = magneticTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Blend mouse position and target center (18% pull strength)
        targetX = event.clientX + (centerX - event.clientX) * 0.18 - size / 2;
        targetY = event.clientY + (centerY - event.clientY) * 0.18 - size / 2;
      }

      x.set(targetX);
      y.set(targetY);
      if (modeRef.current !== nextMode) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    const handleLeave = () => {
      visibleRef.current = false;
      setVisible(false);
    };

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
      <span className="customCursorRing">
        {mode === "view" && (
          <span className="customCursorLabel">
            Zobacz
          </span>
        )}
        {mode === "play" && (
          <span className="customCursorLabel">
            Play
          </span>
        )}
      </span>
    </motion.div>
  );
}
