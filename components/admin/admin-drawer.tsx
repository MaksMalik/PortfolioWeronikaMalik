"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type AdminDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function AdminDrawer({ isOpen, onClose, title, children }: AdminDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-ink/30 backdrop-blur-[2px]"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[130] w-full max-w-lg bg-porcelain border-l border-ink/10 shadow-[0_0_50px_rgba(16,16,16,0.15)] flex flex-col pt-14 sm:pt-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5 bg-white">
              <div>
                <h3 className="font-serif text-3xl leading-none text-ink">{title}</h3>
                <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/40">
                  Edycja szczegółów
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink/60 hover:border-ink hover:text-ink transition-colors"
                aria-label="Zamknij panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
