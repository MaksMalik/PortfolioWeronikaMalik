"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";

type DragState = {
  active: boolean;
  didDrag: boolean;
  pointerId: number | null;
  scrollLeft: number;
  startX: number;
};

const DRAG_THRESHOLD = 6;

export function useHorizontalRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const dragState = useRef<DragState>({
    active: false,
    didDrag: false,
    pointerId: null,
    scrollLeft: 0,
    startX: 0
  });
  const ignoreClickRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setCanScrollPrev(rail.scrollLeft > 2);
    setCanScrollNext(maxScrollLeft > 2 && rail.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateScrollState();

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateScrollState();
      });
    };

    rail.addEventListener("scroll", handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);
    window.addEventListener("resize", updateScrollState);
    const timer = window.setTimeout(updateScrollState, 120);

    return () => {
      window.clearTimeout(timer);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      rail.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollRail = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 280),
      behavior: "smooth"
    });
  }, []);

  // Use window-level pointermove/pointerup instead of pointer capture
  // so click events on children always fire normally.
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return; // Allow native mobile touch scrolling
    const rail = railRef.current;
    if (!rail || event.button !== 0) return;

    const startX = event.clientX;
    const startScrollLeft = rail.scrollLeft;
    const pointerId = event.pointerId;
    let didDrag = false;

    dragState.current = {
      active: true,
      didDrag: false,
      pointerId,
      scrollLeft: startScrollLeft,
      startX
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) <= DRAG_THRESHOLD) return;

      if (!didDrag) {
        didDrag = true;
        dragState.current.didDrag = true;
        setIsDragging(true);
        // Disable scroll snap while dragging
        rail.style.scrollSnapType = "none";
      }
      rail.scrollLeft = startScrollLeft - deltaX;
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      if (didDrag) {
        ignoreClickRef.current = true;
        window.setTimeout(() => {
          ignoreClickRef.current = false;
        }, 200);
        // Re-enable scroll snap
        window.setTimeout(() => {
          if (rail) rail.style.scrollSnapType = "";
        }, 10);
      }

      dragState.current = {
        active: false,
        didDrag: false,
        pointerId: null,
        scrollLeft: 0,
        startX: 0
      };
      setIsDragging(false);
      updateScrollState();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }, [updateScrollState]);

  const shouldIgnoreRailClick = useCallback(() => {
    if (!ignoreClickRef.current) return false;
    ignoreClickRef.current = false;
    return true;
  }, []);

  return {
    canScrollNext,
    canScrollPrev,
    isDragging,
    railDragHandlers: {
      onPointerDown: handlePointerDown,
    },
    railRef,
    scrollRail,
    shouldIgnoreRailClick,
    updateScrollState
  };
}
