"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X, Upload, Loader2 } from "lucide-react";
import type { ShowreelContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { ModalPortal } from "@/components/site/modal-portal";
import { SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { uploadImageFile } from "@/lib/firebase/content";
import { cn } from "@/lib/utils";

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

export function Showreel({ content: initialContent }: { content: ShowreelContent }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.showreel : initialContent;

  const [open, setOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const videoUrl = useMemo(() => getEmbeddableUrl(content.videoUrl), [content.videoUrl]);
  const isMp4 = videoUrl.toLowerCase().endsWith(".mp4");

  useEffect(() => {
    if (!open) {
      return;
    }

    // Reset video loading state when opening
    setIsVideoLoading(true);

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file, "showreel");
      updateContent((draft) => {
        draft.showreel.thumbnail.src = url;
        draft.showreel.thumbnail.alt = file.name.replace(/\.[^.]+$/, "");
      });
    } catch (error) {
      console.error(error);
      alert("Błąd przesyłania obrazu: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const isSectionEnabled = globalContent.sections.showreel.enabled;

  return (
    <SectionReveal
      id="showreel"
      className={cn(
        "relative bg-white py-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-3 bg-porcelain border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/65">
            Sekcja Showreel (Wideo)
          </span>
          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.sections.showreel.enabled = !draft.sections.showreel.enabled;
              })
            }
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] border transition-colors",
              isSectionEnabled
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-ink/15 bg-white text-ink/45 hover:border-ink hover:text-ink"
            )}
          >
            {isSectionEnabled ? "Aktywna" : "Ukryta"}
          </button>
        </div>
      )}

      <div className="section-shell">
        <div className="grid items-center gap-10 border-y border-ink/10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative group aspect-video w-full rounded-3xl overflow-hidden shadow-editorial">
            <button
              type="button"
              className="absolute inset-0 h-full w-full text-left cursor-pointer"
              onClick={() => !editMode && setOpen(true)}
              aria-label="Odtwórz showreel"
              disabled={editMode}
            >
              {content.thumbnail.enabled && (
                <CinematicImage
                  src={content.thumbnail.src}
                  alt={content.thumbnail.alt}
                  className="absolute inset-0 rounded-3xl"
                />
              )}
              <span className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/18" />
              {!editMode && (
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/18 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                  <Play className="ml-1 h-8 w-8 fill-current" />
                </span>
              )}
            </button>

            {editMode && (
              <label className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-[0.12em]">
                      Zmień miniaturę wideo
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div className="max-w-xl lg:pl-8 space-y-6">
            {editMode ? (
              <div className="grid gap-4 bg-porcelain p-4 border border-ink/10 rounded-2xl">
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Eyebrow (nadnagłówek):
                  </span>
                  <input
                    type="text"
                    value={content.eyebrow}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.showreel.eyebrow = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Tytuł sekcji:
                  </span>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.showreel.title = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2 font-serif text-2xl text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Opis showreela:
                  </span>
                  <textarea
                    value={content.description}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.showreel.description = e.target.value;
                      })
                    }
                    rows={3}
                    className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-ink resize-none"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Link do filmu (MP4 / YouTube / Vimeo):
                  </span>
                  <input
                    type="text"
                    value={content.videoUrl}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.showreel.videoUrl = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-full px-4 py-2 text-xs font-bold text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Tekst przycisku:
                  </span>
                  <input
                    type="text"
                    value={content.buttonText}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.showreel.buttonText = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
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
                className="relative w-full max-w-5xl bg-black rounded-3xl border border-white/10 shadow-editorial"
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 24 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rounded-3xl overflow-hidden bg-black relative w-full h-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-30 text-white hover:bg-white/10 rounded-full h-10 w-10"
                    onClick={() => setOpen(false)}
                    aria-label="Zamknij showreel"
                  >
                    <X className="h-5 w-5" />
                  </Button>

                  {/* Video loading spinner */}
                  {isVideoLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                      <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/50">
                        Ładowanie wideo...
                      </span>
                    </div>
                  )}

                  <div className="aspect-video w-full">
                    {isMp4 ? (
                      <video
                        src={videoUrl}
                        className="h-full w-full object-contain"
                        controls
                        autoPlay
                        playsInline
                        poster={content.thumbnail.src}
                        onCanPlay={() => setIsVideoLoading(false)}
                      />
                    ) : (
                      <iframe
                        src={videoUrl}
                        className="h-full w-full"
                        title={content.title}
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsVideoLoading(false)}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
