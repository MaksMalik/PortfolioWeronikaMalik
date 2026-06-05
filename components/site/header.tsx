"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminEdit } from "@/components/admin/admin-edit-context";

export function Header({ monogram }: { monogram: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const { content } = useAdminEdit();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 18);
  });

  const activeNavItems = [
    { label: content.sections.hero.label ?? "Start", href: "#home", enabled: content.sections.hero.enabled },
    { label: content.sections.about.label ?? "O mnie", href: "#about", enabled: content.sections.about.enabled },
    { label: content.sections.portfolio.label ?? "Role", href: "#work", enabled: content.sections.portfolio.enabled },
    { label: content.sections.showreel.label ?? "Showreel", href: "#showreel", enabled: content.sections.showreel.enabled },
    { label: content.sections.gallery.label ?? "Galeria", href: "#gallery", enabled: content.sections.gallery.enabled },
    { label: content.sections.press.label ?? "Prasa", href: "#press", enabled: content.sections.press.enabled },
    { label: content.sections.contact.label ?? "Kontakt", href: "#contact", enabled: content.sections.contact.enabled }
  ].filter((item) => item.enabled);

  return (
    <motion.header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b transition-all duration-500",
        isScrolled
          ? "border-ink/10 bg-porcelain/88 shadow-[0_12px_40px_rgba(16,16,16,0.05)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="section-shell flex h-20 items-center justify-between">
        <a
          href="#home"
          className="group flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 font-serif text-xl font-semibold text-ink transition-colors hover:border-ink"
          aria-label="Strona główna Weroniki Malik"
        >
          <span className="transition-transform duration-500 group-hover:scale-90">
            {monogram}
          </span>
        </a>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Główna nawigacja">
          {activeNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative text-[0.68rem] font-bold uppercase tracking-[0.22em] text-ink/70 transition-colors hover:text-ink"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 h-px w-0 bg-ink transition-all duration-500 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/admin"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
            aria-label="Otwórz panel admina"
            title="Panel"
          >
            <Plus className="h-4 w-4" />
          </a>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            className="border-t border-ink/10 bg-porcelain px-6 overflow-hidden lg:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col gap-4 py-5">
              {activeNavItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-ink"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.a
                href="/admin"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: activeNavItems.length * 0.04, duration: 0.35, ease: "easeOut" }}
                className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/60"
                onClick={() => setIsOpen(false)}
              >
                Panel
              </motion.a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
