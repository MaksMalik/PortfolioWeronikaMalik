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

const DRAG_THRESHOLD = 12;

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

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || event.button !== 0) return;

    dragState.current = {
      active: true,
      didDrag: false,
      pointerId: event.pointerId,
      scrollLeft: rail.scrollLeft,
      startX: event.clientX
    };

    setIsDragging(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail on older touch implementations; dragging still works.
    }
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const rail = railRef.current;
      const state = dragState.current;
      if (!rail || !state.active) return;

      const deltaX = event.clientX - state.startX;
      if (Math.abs(deltaX) <= DRAG_THRESHOLD) {
        return;
      }

      state.didDrag = true;
      rail.scrollLeft = state.scrollLeft - deltaX;
      event.preventDefault();
    },
    []
  );

  const endPointerDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      if (!state.active) return;

      if (state.didDrag) {
        ignoreClickRef.current = true;
        window.setTimeout(() => {
          ignoreClickRef.current = false;
        }, 180);
      }

      try {
        if (state.pointerId !== null) {
          event.currentTarget.releasePointerCapture(state.pointerId);
        }
      } catch {
        // The pointer may already be released by the browser.
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
    },
    [updateScrollState]
  );

  const shouldIgnoreRailClick = useCallback(() => {
    if (!ignoreClickRef.current) {
      return false;
    }

    ignoreClickRef.current = false;
    return true;
  }, []);

  return {
    canScrollNext,
    canScrollPrev,
    isDragging,
    railDragHandlers: {
      onPointerCancel: endPointerDrag,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endPointerDrag
    },
    railRef,
    scrollRail,
    shouldIgnoreRailClick,
    updateScrollState
  };
}
