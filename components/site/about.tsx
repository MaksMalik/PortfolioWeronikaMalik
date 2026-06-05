"use client";

import { useState, ChangeEvent } from "react";
import type { AboutContent } from "@/lib/types";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { uploadImageFile } from "@/lib/firebase/content";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function About({ content: initialContent }: { content: AboutContent }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.about : initialContent;

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file, "about");
      updateContent((draft) => {
        draft.about.image.src = url;
        draft.about.image.alt = file.name.replace(/\.[^.]+$/, "");
      });
    } catch (error) {
      console.error(error);
      alert("Błąd przesyłania obrazu: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const isSectionEnabled = globalContent.sections.about.enabled;

  return (
    <SectionReveal
      id="about"
      className={cn(
        "relative border-y border-ink/10 bg-white py-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-3 bg-porcelain border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/65">
            Sekcja O mnie
          </span>
          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.sections.about.enabled = !draft.sections.about.enabled;
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

      <div className="section-shell grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
        {content.image.enabled && (
          <div className="ornament-line pl-5 pt-5">
            <div className="relative group rounded-3xl overflow-hidden border border-ink/10 shadow-editorial">
              <CinematicImage
                src={content.image.src}
                alt={content.image.alt}
                className="aspect-[4/5] max-h-[640px] rounded-3xl"
              />
              {editMode && (
                <label className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
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
          </div>
        )}

        <div className="max-w-2xl space-y-6">
          {editMode ? (
            <div className="grid gap-4 bg-porcelain/50 p-4 border border-ink/5 rounded-2xl">
              <div className="grid gap-1">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                  Eyebrow (nadnagłówek):
                </span>
                <input
                  type="text"
                  value={content.eyebrow}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.about.eyebrow = e.target.value;
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
                      draft.about.title = e.target.value;
                    })
                  }
                  className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2 font-serif text-2xl text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid gap-1">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink/30">
                  Treść opisu:
                </span>
                <textarea
                  value={content.body}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.about.body = e.target.value;
                    })
                  }
                  rows={6}
                  className="w-full bg-white border border-ink/10 rounded-xl px-4 py-3 text-sm leading-relaxed text-ink focus:outline-none focus:border-ink"
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
                      draft.about.buttonText = e.target.value;
                    })
                  }
                  className="w-full bg-white border border-ink/10 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink focus:outline-none focus:border-ink"
                />
              </div>
            </div>
          ) : (
            <>
              <SectionHeading eyebrow={content.eyebrow} title={content.title} />
              <p className="mt-8 text-lg leading-8 text-graphite/80 sm:text-xl sm:leading-9">
                {content.body}
              </p>
              <div className="mt-10">
                <MagneticButton href="#contact" variant="outline">
                  {content.buttonText}
                </MagneticButton>
              </div>
            </>
          )}
        </div>
      </div>
    </SectionReveal>
  );
}
