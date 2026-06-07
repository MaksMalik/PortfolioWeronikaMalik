"use client";

import { useEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";
let editorialModalCount = 0;

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === "undefined") {
      return;
    }

    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (lockCount === 0) {
      originalBodyOverflow = body.style.overflow;
      originalBodyPaddingRight = body.style.paddingRight;
      body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }

      body.dataset.scrollLocked = "true";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        body.style.overflow = originalBodyOverflow;
        body.style.paddingRight = originalBodyPaddingRight;
        delete body.dataset.scrollLocked;
      }
    };
  }, [locked]);
}

export function useEditorialModalOptimization(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") {
      return;
    }

    const body = document.body;

    if (editorialModalCount === 0) {
      body.dataset.editorialModalOpen = "true";
    }

    editorialModalCount += 1;

    return () => {
      editorialModalCount = Math.max(0, editorialModalCount - 1);

      if (editorialModalCount === 0) {
        delete body.dataset.editorialModalOpen;
      }
    };
  }, [active]);
}
