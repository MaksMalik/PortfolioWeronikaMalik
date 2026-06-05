"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import type { ShowreelContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { ModalPortal } from "@/components/site/modal-portal";
import { SectionReveal } from "@/components/site/section-reveal";

function getEmbeddableUrl(url: string) {
  if (url.includes("youtube.com/watch")) {
    try {
      const videoId = new URL(url).searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  }

  if (url.includes("youtube.com/shorts/")) {
    const videoId = url.split("youtube.com/shorts/")[1]?.split(/[?&/]/)[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) {
    const videoId = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  return url;
}

export function Showreel({ content }: { content: ShowreelContent }) {
  const [open, setOpen] = useState(false);
  const videoUrl = useMemo(() => getEmbeddableUrl(content.videoUrl), [content.videoUrl]);
  const isMp4 = videoUrl.toLowerCase().endsWith(".mp4");

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <SectionReveal id="showreel" className="bg-white py-24">
      <div className="section-shell">
        <div className="grid items-center gap-10 border-y border-ink/10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <button
            type="button"
            className="group relative aspect-video w-full overflow-hidden text-left"
            onClick={() => setOpen(true)}
            aria-label="Odtwórz showreel"
          >
            {content.thumbnail.enabled && (
              <CinematicImage
                src={content.thumbnail.src}
                alt={content.thumbnail.alt}
                className="absolute inset-0"
              />
            )}
            <span className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/18" />
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/18 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
              <Play className="ml-1 h-8 w-8 fill-current" />
            </span>
          </button>

          <div className="max-w-xl lg:pl-8">
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 className="mt-5 font-serif text-5xl font-medium leading-none text-ink sm:text-7xl">
              {content.title}
            </h2>
            <p className="mt-6 text-lg leading-8 text-graphite/75">{content.description}</p>
            <div className="mt-9">
              <MagneticButton onClick={() => setOpen(true)}>
                {content.buttonText}
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      <ModalPortal>
        <AnimatePresence>
          {open && (
            <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/82 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="relative w-full max-w-5xl bg-black shadow-editorial"
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-14 z-10 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Zamknij showreel"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="aspect-video w-full">
                {isMp4 ? (
                  <video src={videoUrl} className="h-full w-full" controls autoPlay />
                ) : (
                  <iframe
                    src={videoUrl}
                    className="h-full w-full"
                    title={content.title}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
