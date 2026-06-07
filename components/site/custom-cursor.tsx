"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

import { useAdminEdit } from "@/components/admin/admin-edit-context";

const settingPercentToScale = (value: number, exponent = 1.35) => {
  const normalized = Math.max(0, Math.min(1, (value - 1) / 149));
  return Math.pow(normalized, exponent);
};

export function CustomCursor() {
  const { editMode, content: globalContent } = useAdminEdit();
  const [isMobile, setIsMobile] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const previewSrcRef = useRef<string | null>(null);
  const customCursorEnabled = globalContent.customCursorEnabled !== false;
  const portalCursorEnabled = globalContent.portalCursorEnabled === true;
  const adminCursorPreviewEnabled = globalContent.adminCursorPreviewEnabled === true;
  const mouseFollowLagEnabled = globalContent.mouseFollowLagEnabled !== false;
  const mouseFollowLagStrength = Math.max(1, Math.min(150, globalContent.mouseFollowLagStrength ?? 100));
  const followLagScale = useMemo(
    () => settingPercentToScale(mouseFollowLagStrength, 1.45),
    [mouseFollowLagStrength]
  );
  const springConfig = useMemo(() => {
    return {
      stiffness: Math.round(1200 - followLagScale * 900),
      damping: Math.round(70 - followLagScale * 44),
      mass: 0.28 + followLagScale * 0.38
    };
  }, [followLagScale]);

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
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const cursorX = mouseFollowLagEnabled && followLagScale > 0 ? springX : x;
  const cursorY = mouseFollowLagEnabled && followLagScale > 0 ? springY : y;
  const [mode, setMode] = useState<"default" | "action" | "view" | "play">("default");
  const [visible, setVisible] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");
  const modeRef = useRef(mode);
  const visibleRef = useRef(visible);
  const cursorLabelRef = useRef(cursorLabel);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    cursorLabelRef.current = cursorLabel;
  }, [cursorLabel]);

  useEffect(() => {
    if (editMode && !adminCursorPreviewEnabled) {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.add("is-edit-mode");
      return;
    }

    document.body.classList.remove("is-edit-mode");

    if (isMobile || !customCursorEnabled) {
      document.body.classList.remove("has-custom-cursor");
      return;
    }

    document.body.classList.add("has-custom-cursor");
    const magnetismEnabled = globalContent.mouseMagnetismEnabled !== false;
    const magnetismScale = settingPercentToScale(
      Math.max(1, Math.min(150, globalContent.mouseMagnetismStrength ?? 100))
    );

    let cursorFrame: number | null = null;
    let pendingEvent: MouseEvent | null = null;

    const updateFromPointer = () => {
      cursorFrame = null;

      const event = pendingEvent;
      if (!event) return;
      pendingEvent = null;

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
      const labelEl = target?.closest("[data-cursor-label]") as HTMLElement | null;
      const nextCursorLabel = labelEl?.getAttribute("data-cursor-label")?.trim() ?? "";
      
      const magneticTarget = target?.closest("a, button, [role='button']");
      let targetX = event.clientX;
      let targetY = event.clientY;

      if (magneticTarget && magnetismEnabled && magnetismScale > 0) {
        const rect = magneticTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        targetX = event.clientX + (centerX - event.clientX) * 0.22 * magnetismScale;
        targetY = event.clientY + (centerY - event.clientY) * 0.22 * magnetismScale;
      }

      x.set(targetX);
      y.set(targetY);
      if (modeRef.current !== nextMode) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }

      if (cursorLabelRef.current !== nextCursorLabel) {
        cursorLabelRef.current = nextCursorLabel;
        setCursorLabel(nextCursorLabel);
      }

      if (cursorImg && portalCursorEnabled) {
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

    const handleMove = (event: MouseEvent) => {
      pendingEvent = event;
      if (cursorFrame !== null) return;
      cursorFrame = window.requestAnimationFrame(updateFromPointer);
    };

    const handleLeave = () => {
      if (cursorFrame !== null) {
        window.cancelAnimationFrame(cursorFrame);
        cursorFrame = null;
      }
      pendingEvent = null;
      visibleRef.current = false;
      setVisible(false);
      cursorLabelRef.current = "";
      setCursorLabel("");
      previewSrcRef.current = null;
      setPreviewSrc(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.remove("is-edit-mode");
      if (cursorFrame !== null) {
        window.cancelAnimationFrame(cursorFrame);
      }
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [
    adminCursorPreviewEnabled,
    customCursorEnabled,
    editMode,
    globalContent.mouseMagnetismEnabled,
    globalContent.mouseMagnetismStrength,
    portalCursorEnabled,
    isMobile,
    x,
    y
  ]);

  if ((editMode && !adminCursorPreviewEnabled) || isMobile || !customCursorEnabled) {
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
      style={{ x: cursorX, y: cursorY }}
      transformTemplate={(_, generated) => `${generated} translate(-50%, -50%)`}
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
            {cursorLabel || "Zobacz"}
          </span>
        )}
        {mode === "play" && !previewSrc && (
          <span className="customCursorLabel">
            {cursorLabel || "Play"}
          </span>
        )}
      </span>
    </motion.div>
  );
}

