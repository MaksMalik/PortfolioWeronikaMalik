"use client";

import { useState, type ChangeEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageFile } from "@/lib/firebase/content";
import { siteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";

type AdminSettingsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultSeo = siteContent.seo!;

export function AdminSettingsDrawer({ isOpen, onClose }: AdminSettingsDrawerProps) {
  const { content, updateContent } = useAdminEdit();
  const [isSeoImageUploading, setIsSeoImageUploading] = useState(false);

  const seo = content.seo ?? defaultSeo;
  const accentColor = content.accentColor || "#c5a880";
  const portalCursorEnabled = content.portalCursorEnabled === true;
  const mouseMagnetismEnabled = content.mouseMagnetismEnabled !== false;
  const mouseMagnetismStrength = Math.max(0, Math.min(150, content.mouseMagnetismStrength ?? 100));

  const ensureSeo = (draft: typeof content) => {
    draft.seo ??= {
      ...defaultSeo,
      image: { ...defaultSeo.image }
    };
    return draft.seo;
  };

  const handleSeoImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSeoImageUploading(true);
      const url = await uploadImageFile(file, "seo");
      updateContent((draft) => {
        const draftSeo = ensureSeo(draft);
        draftSeo.image = {
          ...draftSeo.image,
          enabled: true,
          src: url,
          alt: file.name.replace(/\.[^.]+$/, "")
        };
      });
    } catch (error) {
      console.error(error);
      alert("Błąd przesyłania obrazu SEO: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSeoImageUploading(false);
    }
  };

  return (
    <AdminDrawer isOpen={isOpen} onClose={onClose} title="Ustawienia strony">
      <div className="grid gap-6">
        <section className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              Wygląd
            </Label>
            <p className="mt-1 text-[0.68rem] leading-5 text-ink/45">
              Motyw i kolor akcentu zapisywane są razem ze szkicem.
            </p>
          </div>

          <div className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/35">
              Tryb kolorystyczny
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["light", "dark"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() =>
                    updateContent((draft) => {
                      draft.theme = theme;
                    })
                  }
                  className={cn(
                    "h-10 rounded-full border text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                    content.theme === theme
                      ? "border-ink bg-ink text-white"
                      : "border-ink/10 bg-porcelain/60 text-ink/55 hover:border-ink/25 hover:text-ink"
                  )}
                >
                  {theme === "light" ? "Jasny" : "Ciemny"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.accentColorsEnabled = !draft.accentColorsEnabled;
              })
            }
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors",
              content.accentColorsEnabled
                ? "border-ink bg-ink text-white"
                : "border-ink/10 bg-porcelain/60 text-ink"
            )}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                Kolor akcentu
              </span>
              <span className={cn("mt-1 block text-[0.68rem]", content.accentColorsEnabled ? "text-white/55" : "text-ink/45")}>
                Podbija aktywne elementy i detale na stronie.
              </span>
            </span>
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
              {content.accentColorsEnabled ? "Wł." : "Wył."}
            </span>
          </button>

          <div className="grid gap-2">
            <Label htmlFor="global-accent-color">Kolor akcentu</Label>
            <div className="grid grid-cols-[48px_1fr] gap-3">
              <input
                id="global-accent-color"
                type="color"
                value={accentColor}
                onChange={(e) =>
                  updateContent((draft) => {
                    draft.accentColor = e.target.value;
                  })
                }
                className="h-11 w-12 cursor-pointer rounded-xl border border-ink/10 bg-white p-1"
              />
              <Input
                value={accentColor}
                onChange={(e) =>
                  updateContent((draft) => {
                    draft.accentColor = e.target.value;
                  })
                }
                className="rounded-full font-mono text-xs"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              Myszka i kursor
            </Label>
            <p className="mt-1 text-[0.68rem] leading-5 text-ink/45">
              Klasyczny kursor jest teraz domyślnym trybem, gdy treść nie ma jeszcze własnego ustawienia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                updateContent((draft) => {
                  draft.portalCursorEnabled = false;
                })
              }
              className={cn(
                "h-10 rounded-full border text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                !portalCursorEnabled
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-porcelain/60 text-ink/55 hover:border-ink/25 hover:text-ink"
              )}
            >
              Klasyczny
            </button>
            <button
              type="button"
              onClick={() =>
                updateContent((draft) => {
                  draft.portalCursorEnabled = true;
                })
              }
              className={cn(
                "h-10 rounded-full border text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                portalCursorEnabled
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-porcelain/60 text-ink/55 hover:border-ink/25 hover:text-ink"
              )}
            >
              Portale
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.mouseMagnetismEnabled = !mouseMagnetismEnabled;
              })
            }
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors",
              mouseMagnetismEnabled
                ? "border-ink bg-ink text-white"
                : "border-ink/10 bg-porcelain/60 text-ink"
            )}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                Magnetyzm myszki
              </span>
              <span className={cn("mt-1 block text-[0.68rem]", mouseMagnetismEnabled ? "text-white/55" : "text-ink/45")}>
                Przyciąganie kursora i magnetycznych przycisków.
              </span>
            </span>
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
              {mouseMagnetismEnabled ? "Wł." : "Wył."}
            </span>
          </button>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mouse-magnetism-strength">Siła magnetyzmu</Label>
              <span className="rounded-full bg-porcelain px-2 py-1 text-[0.62rem] font-bold text-ink/50">
                {mouseMagnetismStrength}%
              </span>
            </div>
            <input
              id="mouse-magnetism-strength"
              type="range"
              min={0}
              max={150}
              step={5}
              value={mouseMagnetismStrength}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.mouseMagnetismStrength = Number(e.target.value);
                })
              }
              className="w-full accent-ink"
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              SEO
            </Label>
            <p className="mt-1 text-[0.68rem] leading-5 text-ink/45">
              Tytuł, opis i obraz podglądu dla wyszukiwarek oraz udostępnień.
            </p>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="seo-title">SEO title</Label>
            <Input
              id="seo-title"
              value={seo.title}
              onChange={(e) =>
                updateContent((draft) => {
                  ensureSeo(draft).title = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="seo-description">SEO description</Label>
            <Textarea
              id="seo-description"
              value={seo.description}
              onChange={(e) =>
                updateContent((draft) => {
                  ensureSeo(draft).description = e.target.value;
                })
              }
              rows={3}
              className="min-h-24 rounded-xl text-sm"
            />
          </div>

          <div className="grid gap-3 rounded-2xl border border-ink/10 bg-porcelain/50 p-3">
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              Obraz SEO
            </Label>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <div className="aspect-video overflow-hidden rounded-xl border border-ink/10 bg-white">
                {seo.image.src ? (
                  <img src={seo.image.src} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="grid gap-2">
                <label className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
                  {isSeoImageUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Wgraj obraz
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleSeoImageUpload}
                    disabled={isSeoImageUploading}
                  />
                </label>
                <Input
                  value={seo.image.src}
                  onChange={(e) =>
                    updateContent((draft) => {
                      ensureSeo(draft).image.src = e.target.value;
                    })
                  }
                  placeholder="URL obrazu SEO"
                  className="h-8 rounded-full text-xs"
                />
                <Input
                  value={seo.image.alt}
                  onChange={(e) =>
                    updateContent((draft) => {
                      ensureSeo(draft).image.alt = e.target.value;
                    })
                  }
                  placeholder="Opis alternatywny"
                  className="h-8 rounded-full text-xs"
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateContent((draft) => {
                draft.seo = {
                  ...defaultSeo,
                  image: { ...defaultSeo.image }
                };
              })
            }
            className="w-fit"
          >
            Przywróć teksty tymczasowe
          </Button>
        </section>
      </div>
    </AdminDrawer>
  );
}
