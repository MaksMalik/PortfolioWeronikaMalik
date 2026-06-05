"use client";

import { useState, ChangeEvent } from "react";
import type { AboutContent } from "@/lib/types";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { RevealBlock, SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { uploadImageFile } from "@/lib/firebase/content";
import { Upload, Loader2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function About({ content: initialContent }: { content: AboutContent }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.about : initialContent;

  const [isUploading, setIsUploading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file, "about");
      updateContent((draft) => {
        draft.about.image.src = url;
        draft.about.image.alt = file.name.replace(/\.[^.]+$/, "");
        draft.about.image.enabled = true;
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
        "relative border-y border-ink/10 bg-white py-24 transition-all duration-300 group/section",
        editMode && "hover:ring-1 hover:ring-ink/20",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Control overlay for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-2">
          {/* Section Visibility Toggle */}
          <div className="flex items-center gap-3 bg-porcelain/90 border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
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

          {/* Edit Drawer Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/70 hover:border-ink hover:text-ink shadow-sm transition-all"
          >
            <Edit className="h-3.5 w-3.5" />
            Edytuj
          </button>
        </div>
      )}

      <div className="section-shell grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="max-w-2xl space-y-6">
          <SectionHeading eyebrow={content.eyebrow} title={content.title} />
          <RevealBlock delay={0.12}>
            <p className="mt-8 text-lg leading-8 text-graphite/80 sm:text-xl sm:leading-9 whitespace-pre-wrap">
              {content.body}
            </p>
          </RevealBlock>
          <RevealBlock delay={0.22} className="mt-10">
            <MagneticButton href="#contact" variant="outline">
              {content.buttonText}
            </MagneticButton>
          </RevealBlock>
        </div>

        {(content.image.src && content.image.enabled !== false) && (
          <RevealBlock className="ornament-line pl-5 pt-5" delay={0.14} x={34} y={18}>
            <div className="relative group overflow-hidden rounded-[1.5rem] rounded-tl-none border border-ink/10 shadow-editorial">
              <CinematicImage
                src={content.image.src}
                alt={content.image.alt}
                className="aspect-[4/5] max-h-[640px] rounded-[1.5rem] rounded-tl-none"
              />
            </div>
          </RevealBlock>
        )}
      </div>

      {/* Edit Drawer */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Sekcja O mnie"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="about-menu-label">Nazwa w menu</Label>
            <Input
              id="about-menu-label"
              value={globalContent.sections.about.label ?? "O mnie"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.about.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="about-eyebrow">Eyebrow (nadnagłówek)</Label>
            <Input
              id="about-eyebrow"
              value={content.eyebrow}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.about.eyebrow = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="about-title">Tytuł sekcji</Label>
            <Input
              id="about-title"
              value={content.title}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.about.title = e.target.value;
                })
              }
              className="rounded-xl font-serif text-lg"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="about-body">Treść opisu</Label>
            <Textarea
              id="about-body"
              value={content.body}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.about.body = e.target.value;
                })
              }
              rows={8}
              className="rounded-xl text-sm"
            />
          </div>

          <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4">
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              Zdjęcie sekcji
            </Label>
            <div className="grid grid-cols-[92px_1fr] items-center gap-4">
              <div className="aspect-[4/5] overflow-hidden rounded-xl rounded-tl-none border border-ink/10 bg-porcelain">
                {content.image.src && (
                  <img src={content.image.src} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="grid gap-2">
                <label className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Zmień zdjęcie
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
                <Input
                  value={content.image.alt}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.about.image.alt = e.target.value;
                    })
                  }
                  placeholder="Opis alternatywny"
                  className="h-8 rounded-full text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="about-btn-text">Tekst przycisku</Label>
            <Input
              id="about-btn-text"
              value={content.buttonText}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.about.buttonText = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>
        </div>
      </AdminDrawer>
    </SectionReveal>
  );
}
