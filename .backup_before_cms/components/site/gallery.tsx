"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GallerySession, SiteImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { ModalPortal } from "@/components/site/modal-portal";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { cn } from "@/lib/utils";

function aspectClass(image: SiteImage) {
  switch (image.aspect) {
    case "landscape":
      return "aspect-[5/3]";
    case "square":
      return "aspect-square";
    case "wide":
      return "aspect-[16/9]";
    case "portrait":
    default:
      return "aspect-[4/5]";
  }
}

function coverFor(session: GallerySession) {
  if (session.cover.enabled) {
    return session.cover;
  }

  return session.images.find((image) => image.enabled) ?? session.cover;
}

export function Gallery({ sessions }: { sessions: GallerySession[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<SiteImage | null>(null);
  const [sessionDirection, setSessionDirection] = useState(1);
  const railRef = useRef<HTMLDivElement>(null);
  const activeSession = activeIndex === null ? null : sessions[activeIndex];
  const visibleImages = useMemo(
    () => activeSession?.images.filter((image) => image.enabled) ?? [],
    [activeSession]
  );

  const goTo = useCallback(
    (direction: "next" | "prev") => {
      if (activeIndex === null || sessions.length === 0) {
        return;
      }

      setSessionDirection(direction === "next" ? 1 : -1);
      setActiveImage(null);
      setActiveIndex((current) => {
        if (current === null) {
          return current;
        }

        return direction === "next"
          ? (current + 1) % sessions.length
          : (current - 1 + sessions.length) % sessions.length;
      });
    },
    [activeIndex, sessions.length]
  );

  const handleRailWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!railRef.current || Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    railRef.current.scrollBy({ left: event.deltaY, behavior: "smooth" });
  };

  const scrollRail = (direction: -1 | 1) => {
    railRef.current?.scrollBy({
      left: direction * (railRef.current.clientWidth * 0.82),
      behavior: "smooth"
    });
  };

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeImage) {
          setActiveImage(null);
        } else {
          setActiveIndex(null);
        }
      }

      if (event.key === "ArrowRight") {
        goTo("next");
      }

      if (event.key === "ArrowLeft") {
        goTo("prev");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeImage, activeIndex, goTo]);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <SectionReveal id="gallery" className="bg-porcelain py-24">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="galeria" title="Sesje zdjęciowe" />
          <p className="max-w-sm text-sm leading-7 text-ink/55">
            Editorialowe portrety, kadry i fragmenty pracy przed obiektywem.
          </p>
        </div>

        <div className="relative mt-12">
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-2 md:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="pointer-events-auto border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white"
              onClick={() => scrollRail(-1)}
              aria-label="Przewiń galerię w lewo"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="pointer-events-auto border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white"
              onClick={() => scrollRail(1)}
              aria-label="Przewiń galerię w prawo"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div
            ref={railRef}
            className="no-scrollbar grid auto-cols-[84%] grid-flow-col gap-5 overflow-x-auto scroll-smooth pb-5 [scroll-snap-type:x_mandatory] sm:auto-cols-[52%] lg:auto-cols-[36%]"
            onWheel={handleRailWheel}
          >
            {sessions.map((session, index) => {
              const cover = coverFor(session);

              return (
                <motion.button
                  type="button"
                  key={session.id}
                  className="group grid min-h-[520px] scroll-ml-4 overflow-hidden border border-ink/10 bg-white text-left shadow-[0_18px_60px_rgba(16,16,16,0.04)] [scroll-snap-align:start]"
                  onClick={() => {
                    setSessionDirection(1);
                    setActiveIndex(index);
                  }}
                  aria-label={`Otwórz sesję ${session.title}`}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -8 }}
                >
                  <CinematicImage
                    src={cover.src}
                    alt={cover.alt}
                    className={cn("min-h-[390px]", index % 2 === 0 ? "aspect-[4/5]" : "aspect-[5/4]")}
                  />
                  <div className="p-6">
                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/45">
                      {session.subtitle}
                    </p>
                    <h3 className="mt-3 font-serif text-4xl leading-none text-ink">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink/55">
                        {session.description}
                      </p>
                    )}
                    <span className="mt-6 inline-flex border-b border-ink pb-1 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                      Otwórz sesję
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <ModalPortal>
        <AnimatePresence>
          {activeSession && (
            <motion.div
            className="fixed inset-0 z-[90] overflow-y-auto bg-porcelain text-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto max-w-7xl">
              <div className="sticky top-0 z-20 mb-6 border-b border-ink/10 bg-porcelain px-4 py-4 shadow-[0_16px_50px_rgba(16,16,16,0.04)] sm:px-6">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
                      {activeSession.subtitle}
                    </p>
                    <h2 className="font-serif text-4xl leading-none sm:text-6xl">
                      {activeSession.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goTo("prev")}
                      aria-label="Poprzednia sesja"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goTo("next")}
                      aria-label="Następna sesja"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setActiveImage(null);
                        setActiveIndex(null);
                      }}
                      aria-label="Zamknij galerię"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {activeSession.description && (
                <p className="mb-8 max-w-3xl px-4 text-lg leading-8 text-graphite/70 sm:px-6">
                  {activeSession.description}
                </p>
              )}

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSession.id}
                  className="columns-1 gap-5 px-4 pb-10 sm:columns-2 sm:px-6 lg:columns-3"
                  initial={{ opacity: 0, x: sessionDirection * 56 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: sessionDirection * -56 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {visibleImages.map((image, imageIndex) => (
                    <figure
                      key={image.id}
                      className="mb-5 break-inside-avoid overflow-hidden border border-ink/10 bg-white"
                    >
                      <motion.button
                        type="button"
                        layoutId={`session-image-${image.id}`}
                        className="block w-full text-left"
                        onClick={() => setActiveImage(image)}
                        aria-label={`Powiększ zdjęcie ${image.title ?? image.alt}`}
                      >
                        <CinematicImage
                          src={image.src}
                          alt={image.alt}
                          className={aspectClass(image)}
                        />
                      </motion.button>
                      {(image.title || image.description) && (
                        <figcaption className="px-4 py-4">
                          {image.title && (
                            <p className="font-serif text-2xl leading-none text-ink">
                              {image.title}
                            </p>
                          )}
                          {image.description && (
                            <p className="mt-2 text-sm leading-6 text-ink/55">
                              {image.description}
                            </p>
                          )}
                          <span className="mt-3 block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink/35">
                            {String(imageIndex + 1).padStart(2, "0")}
                          </span>
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {activeImage && (
                <motion.div
                  className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/82 p-4 backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveImage(null)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-5 top-5 z-10 text-white hover:bg-white/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveImage(null);
                    }}
                    aria-label="Zamknij zdjęcie"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <motion.div
                    layoutId={`session-image-${activeImage.id}`}
                    className="max-h-[88svh] w-full max-w-5xl overflow-hidden bg-black shadow-editorial"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <img
                      src={activeImage.src}
                      alt={activeImage.alt}
                      className="max-h-[88svh] w-full object-contain"
                      draggable={false}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
