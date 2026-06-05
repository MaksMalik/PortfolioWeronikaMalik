"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Start", href: "#home" },
  { label: "O mnie", href: "#about" },
  { label: "Role", href: "#work" },
  { label: "Showreel", href: "#showreel" },
  { label: "Galeria", href: "#gallery" },
  { label: "Prasa", href: "#press" },
  { label: "Kontakt", href: "#contact" }
];

export function Header({ monogram }: { monogram: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 18);
  });

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
          {navItems.map((item) => (
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

      {isOpen && (
        <motion.nav
          className="border-t border-ink/10 bg-porcelain px-6 py-5 lg:hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-[0.2em] text-ink"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/admin"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/60"
              onClick={() => setIsOpen(false)}
            >
              Panel
            </a>
          </div>
        </motion.nav>
      )}
    </motion.header>
  );
}
