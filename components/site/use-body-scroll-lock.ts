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
    const headers = document.querySelectorAll("header");
    const asides = document.querySelectorAll("aside");

    if (lockCount === 0) {
      originalBodyOverflow = body.style.overflow;
      originalBodyPaddingRight = body.style.paddingRight;
      body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
        body.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
        headers.forEach((h) => {
          h.style.paddingRight = `${scrollbarWidth}px`;
        });
        asides.forEach((a) => {
          a.style.marginRight = `${scrollbarWidth}px`;
        });
      }

      body.dataset.scrollLocked = "true";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        body.style.overflow = originalBodyOverflow;
        body.style.paddingRight = originalBodyPaddingRight;
        body.style.removeProperty("--scrollbar-width");
        headers.forEach((h) => {
          h.style.paddingRight = "";
        });
        asides.forEach((a) => {
          a.style.marginRight = "";
        });
        delete body.dataset.scrollLocked;
      }
    };
  }, [locked]);
}

let savedScrollY = 0;

export function useEditorialModalOptimization(active: boolean) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const body = document.body;

    if (active) {
      if (editorialModalCount === 0) {
        savedScrollY = window.scrollY;
        body.dataset.editorialModalOpen = "true";
      }
      editorialModalCount += 1;
    }

    return () => {
      if (active) {
        editorialModalCount = Math.max(0, editorialModalCount - 1);

        if (editorialModalCount === 0) {
          delete body.dataset.editorialModalOpen;
          const targetScroll = savedScrollY;
          setTimeout(() => {
            window.scrollTo(0, targetScroll);
          }, 0);
        }
      }
    };
  }, [active]);
}
