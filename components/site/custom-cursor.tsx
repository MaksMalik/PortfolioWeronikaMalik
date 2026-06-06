"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

import { useAdminEdit } from "@/components/admin/admin-edit-context";

export function CustomCursor() {
  const { editMode } = useAdminEdit();
  const [isMobile, setIsMobile] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const previewSrcRef = useRef<string | null>(null);

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

  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const springX = useSpring(x, { stiffness: 600, damping: 42, mass: 0.18 });
  const springY = useSpring(y, { stiffness: 600, damping: 42, mass: 0.18 });
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
    if (editMode || isMobile) {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.add("is-edit-mode");
      return;
    }

    document.body.classList.add("has-custom-cursor");
    document.body.classList.remove("is-edit-mode");

    const cursorSize = (nextMode: typeof mode, hasPreview: boolean) => {
      if (hasPreview) return 90;
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

      const imgEl = target?.closest("[data-cursor-img]") as HTMLElement | null;
      const cursorImg = imgEl ? imgEl.getAttribute("data-cursor-img") : null;
      const hasPreview = Boolean(cursorImg);

      const size = cursorSize(nextMode, hasPreview);
      
      const magneticTarget = target?.closest("a, button, [role='button']");
      let targetX = event.clientX - size / 2;
      let targetY = event.clientY - size / 2;

      if (magneticTarget) {
        const rect = magneticTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Blend mouse position and target center (15% pull strength)
        targetX = event.clientX + (centerX - event.clientX) * 0.15 - size / 2;
        targetY = event.clientY + (centerY - event.clientY) * 0.15 - size / 2;
      }

      x.set(targetX);
      y.set(targetY);
      if (modeRef.current !== nextMode) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }

      if (cursorImg) {
        if (previewSrcRef.current !== cursorImg) {
          previewSrcRef.current = cursorImg;
          setPreviewSrc(cursorImg);
        }
      } else {
        if (previewSrcRef.current !== null) {
          previewSrcRef.current = null;
          setPreviewSrc(null);
        }
      }

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    const handleLeave = () => {
      visibleRef.current = false;
      setVisible(false);
      previewSrcRef.current = null;
      setPreviewSrc(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.remove("is-edit-mode");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [editMode, isMobile, x, y]);

  if (editMode || isMobile) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "customCursor",
        visible && "isVisible",
        `is-${mode}`,
        previewSrc && "hasPreview"
      )}
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    >
      <span className="customCursorRing">
        {previewSrc && (
          <img
            src={previewSrc}
            alt=""
            className="customCursorImage"
          />
        )}
        {mode === "view" && !previewSrc && (
          <span className="customCursorLabel">
            Zobacz
          </span>
        )}
        {mode === "play" && !previewSrc && (
          <span className="customCursorLabel">
            Play
          </span>
        )}
      </span>
    </motion.div>
  );
}
