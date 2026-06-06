"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/components/site/use-body-scroll-lock";
import { ModalPortal } from "@/components/site/modal-portal";

type AdminDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function AdminDrawer({ isOpen, onClose, title, children }: AdminDrawerProps) {
  useBodyScrollLock(isOpen);

  return (
    <ModalPortal>
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
              className="fixed inset-y-0 right-0 z-[130] flex w-full max-w-lg flex-col border-l border-ink/10 bg-porcelain pt-14 shadow-[0_0_50px_rgba(16,16,16,0.15)] sm:pt-0 h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4 sm:px-6 sm:py-5">
                <div>
                  <h3 className="font-serif text-2xl leading-none text-ink sm:text-3xl">{title}</h3>
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
              <div className="no-scrollbar flex-1 overscroll-contain overflow-y-auto p-5 space-y-6 sm:p-6" onClick={(e) => e.stopPropagation()} style={{ height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)' } as any}>
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
