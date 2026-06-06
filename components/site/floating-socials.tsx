"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContactContent, SocialLink } from "@/lib/types";
import { FilmwebMark } from "@/components/site/brand-icons";
import { cn } from "@/lib/utils";

function FloatingInstagramIcon() {
  return (
    <svg
      className="h-4.5 w-4.5 shrink-0 fill-none stroke-[1.7] stroke-ink/65 transition-all duration-700 group-hover:stroke-[url(#floating-insta-grad)]"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="floating-insta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FloatingFacebookIcon() {
  return (
    <svg
      className="h-4.5 w-4.5 shrink-0 fill-ink/65 transition-colors duration-700 group-hover:fill-[#1877F2]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function socialIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("instagram")) {
    return <FloatingInstagramIcon />;
  }

  if (normalized.includes("facebook")) {
    return <FloatingFacebookIcon />;
  }

  if (normalized.includes("filmweb")) {
    return <FilmwebMark className="h-4.5 w-4.5" />;
  }

  return (
    <MessageCircle
      className="h-4.5 w-4.5 shrink-0 stroke-ink/65 transition-colors duration-700 group-hover:stroke-ink"
      aria-hidden="true"
    />
  );
}

function isValidFloatingLink(social: SocialLink) {
  return social.enabled && social.url && social.url !== "https://";
}

export function FloatingSocials({
  contact,
  initialDelay = 0
}: {
  contact: ContactContent;
  initialDelay?: number;
}) {
  const [introReady, setIntroReady] = useState(initialDelay <= 0);
  const [contactSocialsVisible, setContactSocialsVisible] = useState(false);
  const socials = useMemo(
    () => contact.socials.filter(isValidFloatingLink).slice(0, 5),
    [contact.socials]
  );
  const enabled = contact.floatingSocialsEnabled ?? true;

  useEffect(() => {
    if (initialDelay <= 0) {
      setIntroReady(true);
      return;
    }

    setIntroReady(false);
    const timer = window.setTimeout(() => setIntroReady(true), initialDelay * 1000);
    return () => window.clearTimeout(timer);
  }, [initialDelay]);

  useEffect(() => {
    const target = document.getElementById("contact-social-links");
    if (!target) {
      setContactSocialsVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setContactSocialsVisible(entry.isIntersecting && entry.intersectionRatio > 0.18);
      },
      {
        threshold: [0, 0.18, 0.34],
        rootMargin: "0px 0px -8% 0px"
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {introReady && enabled && socials.length > 0 && !contactSocialsVisible && (
        <motion.aside
          className="pointer-events-none fixed right-5 top-1/2 z-[70] hidden -translate-y-1/2 lg:block"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Szybkie linki społecznościowe"
        >
          <div className="flex flex-col items-end gap-2">
            {socials.map((social, index) => (
              <motion.a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group pointer-events-auto flex h-11 w-11 items-center justify-end overflow-hidden rounded-full border border-ink/10 bg-white/74 text-ink/65 shadow-[0_12px_34px_rgba(16,16,16,0.06)] backdrop-blur-md transition-[width,border-color,background-color,box-shadow,color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-40 hover:border-ink/18 hover:bg-white hover:text-ink hover:shadow-[0_18px_46px_rgba(16,16,16,0.09)]"
                )}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.055, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                aria-label={social.label}
              >
                <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 text-[0.62rem] font-bold uppercase tracking-[0.16em] opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-24 group-hover:pl-4 group-hover:opacity-100">
                  {social.label}
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                  {socialIcon(social.label)}
                </span>
                <ExternalLink className="h-3 w-0 shrink-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:mr-3 group-hover:w-3 group-hover:opacity-40" />
              </motion.a>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
