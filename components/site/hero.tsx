"use client";

import { useRef, useState, ChangeEvent } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { HeroContent } from "@/lib/types";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { uploadImageFile } from "@/lib/firebase/content";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero({ content: initialContent }: { content: HeroContent }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.hero : initialContent;

  const [isUploading, setIsUploading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "11%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const nameWords = content.name.split(" ");

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file, "hero");
      updateContent((draft) => {
        draft.hero.image.src = url;
        draft.hero.image.alt = file.name.replace(/\.[^.]+$/, "");
      });
    } catch (error) {
      console.error(error);
      alert("Błąd przesyłania obrazu: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const isSectionEnabled = globalContent.sections.hero.enabled;

  return (
    <section
      id="home"
      ref={ref}
      className={cn(
        "relative flex min-h-[80svh] items-end overflow-hidden pt-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      <div className="absolute inset-x-0 top-20 h-px bg-ink/10" />

      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-24 right-4 z-20 flex items-center gap-3 bg-white border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/65">
            Sekcja Startowa (Hero)
          </span>
          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.sections.hero.enabled = !draft.sections.hero.enabled;
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

      <div className="section-shell grid min-h-[calc(80svh-6rem)] items-center gap-10 pb-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        {content.image.enabled && (
          <motion.div
            style={{ y: imageY }}
            className="h-[54svh] min-h-[380px] lg:h-[64svh]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative h-full group">
              <CinematicImage
                src={content.image.src}
                alt={content.image.alt}
                className="h-full rounded-t-full border border-ink/10 shadow-editorial"
              />
              {editMode && (
                <label className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/40 text-white rounded-t-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-[0.12em]">
                        Zmień zdjęcie
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
          </motion.div>
        )}

        <motion.div style={{ y: textY }} className="pb-6">
          <motion.div
            className="mb-9 flex items-center gap-4 text-[0.66rem] font-bold uppercase tracking-[0.24em] text-ink/45"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="h-px w-16 bg-silver" />
            {editMode ? (
              <div className="flex items-center gap-2">
                <span className="text-[0.55rem] uppercase text-ink/40">Monogram:</span>
                <input
                  type="text"
                  value={content.monogram}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.hero.monogram = e.target.value.toUpperCase();
                    })
                  }
                  className="w-12 bg-transparent border-b border-ink/15 text-center text-[0.66rem] font-bold uppercase tracking-[0.24em] text-ink focus:outline-none focus:border-ink"
                />
              </div>
            ) : (
              <span>film / teatr / głos</span>
            )}
          </motion.div>

          {editMode ? (
            <textarea
              value={content.name}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.name = e.target.value.toUpperCase();
                })
              }
              rows={2}
              className="w-full bg-transparent border-none text-ink font-serif text-[clamp(2.4rem,5.5vw,5.5rem)] font-medium uppercase leading-[0.88] focus:outline-none focus:ring-1 focus:ring-ink/10 hover:bg-ink/[0.02] resize-none"
            />
          ) : (
            <h1 className="max-w-[760px] font-serif text-[clamp(3.2rem,7.1vw,7.2rem)] font-medium uppercase leading-[0.88] text-ink">
              {nameWords.map((word, wordIndex) => (
                <span key={word} className="block whitespace-nowrap">
                  {word.split("").map((letter, letterIndex) => {
                    const index = wordIndex * 9 + letterIndex;

                    return (
                      <motion.span
                        key={`${word}-${letter}-${letterIndex}`}
                        className="inline-block"
                        initial={{ opacity: 0, y: 54, rotateX: -18 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{
                          delay: 0.1 + index * 0.035,
                          duration: 0.72,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        {letter}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </h1>
          )}

          <motion.div
            className="mt-8 max-w-xl space-y-7"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {editMode ? (
              <div className="grid gap-4">
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Tagline:
                  </span>
                  <input
                    type="text"
                    value={content.tagline}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.hero.tagline = e.target.value;
                      })
                    }
                    className="w-full bg-transparent border-none text-xs font-bold uppercase tracking-[0.26em] text-ink/65 focus:outline-none focus:ring-1 focus:ring-ink/10 hover:bg-ink/[0.02] p-1"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                    Cytat:
                  </span>
                  <textarea
                    value={content.quote}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.hero.quote = e.target.value;
                      })
                    }
                    rows={3}
                    className="w-full bg-transparent border-none text-2xl leading-snug font-serif text-graphite focus:outline-none focus:ring-1 focus:ring-ink/10 hover:bg-ink/[0.02] p-1 resize-none"
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
                        draft.hero.buttonText = e.target.value;
                      })
                    }
                    className="w-full bg-transparent border-none text-xs font-bold uppercase tracking-[0.14em] text-ink/80 focus:outline-none focus:ring-1 focus:ring-ink/10 hover:bg-ink/[0.02] p-1"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-ink/55">
                  {content.tagline}
                </p>
                <p className="font-serif text-3xl leading-tight text-graphite sm:text-4xl">
                  {content.quote}
                </p>
                <MagneticButton href="#work">{content.buttonText}</MagneticButton>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
