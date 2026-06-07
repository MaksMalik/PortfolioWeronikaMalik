"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MutableRefObject } from "react";
import { Loader2, Upload } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
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
const SETTINGS_COMMIT_DELAY = 420;
const clampPercent = (value: number) => Math.max(1, Math.min(150, value));

function clearSettingsTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

export function AdminSettingsDrawer({ isOpen, onClose }: AdminSettingsDrawerProps) {
  const { content, updateContent } = useAdminEdit();
  const [isSeoImageUploading, setIsSeoImageUploading] = useState(false);
  const [draftAccentColor, setDraftAccentColor] = useState(content.accentColor || "#c5a880");
  const [draftMagnetismStrength, setDraftMagnetismStrength] = useState(clampPercent(content.mouseMagnetismStrength ?? 100));
  const [draftFollowLagStrength, setDraftFollowLagStrength] = useState(clampPercent(content.mouseFollowLagStrength ?? 100));
  const colorCommitTimerRef = useRef<number | null>(null);
  const magnetismCommitTimerRef = useRef<number | null>(null);
  const followLagCommitTimerRef = useRef<number | null>(null);

  const seo = content.seo ?? defaultSeo;
  const accentColor = draftAccentColor;
  const customCursorEnabled = content.customCursorEnabled !== false;
  const portalCursorEnabled = content.portalCursorEnabled === true;
  const adminCursorPreviewEnabled = content.adminCursorPreviewEnabled === true;
  const mouseMagnetismEnabled = content.mouseMagnetismEnabled !== false;
  const mouseMagnetismStrength = draftMagnetismStrength;
  const mouseFollowLagEnabled = content.mouseFollowLagEnabled !== false;
  const mouseFollowLagStrength = draftFollowLagStrength;

  const commitAccentColor = (value: string) => {
    clearSettingsTimer(colorCommitTimerRef);
    updateContent((draft) => {
      draft.accentColor = value;
    });
  };

  const scheduleAccentColorCommit = (value: string) => {
    clearSettingsTimer(colorCommitTimerRef);
    colorCommitTimerRef.current = window.setTimeout(() => {
      commitAccentColor(value);
    }, SETTINGS_COMMIT_DELAY);
  };

  const commitMagnetismStrength = (value: number) => {
    const nextValue = clampPercent(value);
    clearSettingsTimer(magnetismCommitTimerRef);
    updateContent((draft) => {
      draft.mouseMagnetismStrength = nextValue;
    });
  };

  const scheduleMagnetismStrengthCommit = (value: number) => {
    const nextValue = clampPercent(value);
    clearSettingsTimer(magnetismCommitTimerRef);
    magnetismCommitTimerRef.current = window.setTimeout(() => {
      commitMagnetismStrength(nextValue);
    }, SETTINGS_COMMIT_DELAY);
  };

  const commitFollowLagStrength = (value: number) => {
    const nextValue = clampPercent(value);
    clearSettingsTimer(followLagCommitTimerRef);
    updateContent((draft) => {
      draft.mouseFollowLagStrength = nextValue;
    });
  };

  const scheduleFollowLagStrengthCommit = (value: number) => {
    const nextValue = clampPercent(value);
    clearSettingsTimer(followLagCommitTimerRef);
    followLagCommitTimerRef.current = window.setTimeout(() => {
      commitFollowLagStrength(nextValue);
    }, SETTINGS_COMMIT_DELAY);
  };

  const flushPendingSettings = () => {
    if (colorCommitTimerRef.current !== null) {
      commitAccentColor(draftAccentColor);
    }
    if (magnetismCommitTimerRef.current !== null) {
      commitMagnetismStrength(draftMagnetismStrength);
    }
    if (followLagCommitTimerRef.current !== null) {
      commitFollowLagStrength(draftFollowLagStrength);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDraftAccentColor(content.accentColor || "#c5a880");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content.accentColor]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDraftMagnetismStrength(clampPercent(content.mouseMagnetismStrength ?? 100));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content.mouseMagnetismStrength]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDraftFollowLagStrength(clampPercent(content.mouseFollowLagStrength ?? 100));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content.mouseFollowLagStrength]);

  useEffect(() => {
    return () => {
      clearSettingsTimer(colorCommitTimerRef);
      clearSettingsTimer(magnetismCommitTimerRef);
      clearSettingsTimer(followLagCommitTimerRef);
    };
  }, []);

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
    <AdminDrawer
      isOpen={isOpen}
      onClose={() => {
        flushPendingSettings();
        onClose();
      }}
      title="Ustawienia strony"
    >
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
                onChange={(e) => {
                  setDraftAccentColor(e.target.value);
                  scheduleAccentColorCommit(e.target.value);
                }}
                onBlur={() => commitAccentColor(draftAccentColor)}
                className="h-11 w-12 cursor-pointer rounded-xl border border-ink/10 bg-white p-1"
              />
              <Input
                value={accentColor}
                onChange={(e) => {
                  setDraftAccentColor(e.target.value);
                  scheduleAccentColorCommit(e.target.value);
                }}
                onBlur={() => commitAccentColor(draftAccentColor)}
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
              Włącz efektowną myszkę na stronie, wybierz jej styl i zdecyduj, czy chcesz widzieć ją podczas edycji.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.customCursorEnabled = !customCursorEnabled;
              })
            }
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors",
              customCursorEnabled
                ? "border-ink bg-ink text-white"
                : "border-ink/10 bg-porcelain/60 text-ink"
            )}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                Efektowna myszka
              </span>
              <span className={cn("mt-1 block text-[0.68rem]", customCursorEnabled ? "text-white/55" : "text-ink/45")}>
                Wyłącz, jeśli strona ma używać zwykłego kursora bez efektów.
              </span>
            </span>
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
              {customCursorEnabled ? "Wł." : "Wył."}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                updateContent((draft) => {
                  draft.portalCursorEnabled = false;
                })
              }
              disabled={!customCursorEnabled}
              className={cn(
                "h-10 rounded-full border text-xs font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                customCursorEnabled && !portalCursorEnabled
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
              disabled={!customCursorEnabled}
              className={cn(
                "h-10 rounded-full border text-xs font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                customCursorEnabled && portalCursorEnabled
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
                draft.adminCursorPreviewEnabled = !adminCursorPreviewEnabled;
              })
            }
            disabled={!customCursorEnabled}
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              adminCursorPreviewEnabled
                ? "border-ink bg-ink text-white"
                : "border-ink/10 bg-porcelain/60 text-ink"
            )}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                Podgląd w adminie
              </span>
              <span className={cn("mt-1 block text-[0.68rem]", adminCursorPreviewEnabled ? "text-white/55" : "text-ink/45")}>
                Włącz tylko wtedy, gdy chcesz sprawdzić zachowanie kursora z live podczas edycji.
              </span>
            </span>
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
              {adminCursorPreviewEnabled ? "Wł." : "Wył."}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.mouseMagnetismEnabled = !mouseMagnetismEnabled;
              })
            }
            disabled={!customCursorEnabled}
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              customCursorEnabled && mouseMagnetismEnabled
                ? "border-ink bg-ink text-white"
                : "border-ink/10 bg-porcelain/60 text-ink"
            )}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                Magnetyzm myszki
              </span>
              <span className={cn("mt-1 block text-[0.68rem]", customCursorEnabled && mouseMagnetismEnabled ? "text-white/55" : "text-ink/45")}>
                Przyciąganie kursora i magnetycznych przycisków.
              </span>
            </span>
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
              {mouseMagnetismEnabled ? "Wł." : "Wył."}
            </span>
          </button>

          <div className={cn("grid gap-2", (!customCursorEnabled || !mouseMagnetismEnabled) && "opacity-45")}>
            <div className="flex items-center justify-between">
              <Label htmlFor="mouse-magnetism-strength">Siła magnetyzmu</Label>
              <span className="rounded-full bg-porcelain px-2 py-1 text-[0.62rem] font-bold text-ink/50">
                {mouseMagnetismStrength}%
              </span>
            </div>
            <input
              id="mouse-magnetism-strength"
              type="range"
              min={1}
              max={150}
              step={1}
              value={mouseMagnetismStrength}
              disabled={!customCursorEnabled || !mouseMagnetismEnabled}
              onChange={(e) => {
                const value = clampPercent(Number(e.target.value));
                setDraftMagnetismStrength(value);
                scheduleMagnetismStrengthCommit(value);
              }}
              className="w-full accent-ink disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.mouseFollowLagEnabled = !mouseFollowLagEnabled;
              })
            }
            disabled={!customCursorEnabled}
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              customCursorEnabled && mouseFollowLagEnabled
                ? "border-ink bg-ink text-white"
                : "border-ink/10 bg-porcelain/60 text-ink"
            )}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                Opóźnienie kursora
              </span>
              <span className={cn("mt-1 block text-[0.68rem]", customCursorEnabled && mouseFollowLagEnabled ? "text-white/55" : "text-ink/45")}>
                Sprężyste doganianie kursora w wybranym stylu myszki.
              </span>
            </span>
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
              {mouseFollowLagEnabled ? "Wł." : "Wył."}
            </span>
          </button>

          <div className={cn("grid gap-2", (!customCursorEnabled || !mouseFollowLagEnabled) && "opacity-45")}>
            <div className="flex items-center justify-between">
              <Label htmlFor="mouse-follow-lag-strength">Siła opóźnienia</Label>
              <span className="rounded-full bg-porcelain px-2 py-1 text-[0.62rem] font-bold text-ink/50">
                {mouseFollowLagStrength}%
              </span>
            </div>
            <input
              id="mouse-follow-lag-strength"
              type="range"
              min={1}
              max={150}
              step={1}
              value={mouseFollowLagStrength}
              disabled={!customCursorEnabled || !mouseFollowLagEnabled}
              onChange={(e) => {
                const value = clampPercent(Number(e.target.value));
                setDraftFollowLagStrength(value);
                scheduleFollowLagStrengthCommit(value);
              }}
              className="w-full accent-ink disabled:cursor-not-allowed"
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
        </section>
      </div>
    </AdminDrawer>
  );
}
