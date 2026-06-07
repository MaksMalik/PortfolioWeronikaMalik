"use client";

import { useRef, useState, ChangeEvent } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { HeroContent } from "@/lib/types";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { uploadImageFile } from "@/lib/firebase/content";
import { ImagePreloader } from "@/components/site/image-preloader";
import { Upload, Loader2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { SectionReorderControls } from "@/components/admin/section-reorder-controls";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const HERO_NAME_DELAY = 0;
const HERO_WORD_DELAY = 0.18;
const HERO_META_DELAY = 0.28;
const HERO_TAGLINE_DELAY = 0.5;
const HERO_QUOTE_DELAY = 0.72;
const HERO_BUTTON_DELAY = 0.95;

export function Hero({
  content: initialContent,
  isLoaded
}: {
  content: HeroContent;
  isLoaded?: boolean;
}) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.hero : initialContent;

  const [isUploading, setIsUploading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "11%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const lightOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [0.62, 0.28, 0]);
  const rawNameX = useTransform(scrollYProgress, [0, 1], ["-22px", "22px"]);
  const rawMetaX = useTransform(scrollYProgress, [0, 1], ["22px", "-22px"]);
  const nameX = useSpring(rawNameX, { stiffness: 50, damping: 20, restDelta: 0.01 });
  const metaX = useSpring(rawMetaX, { stiffness: 50, damping: 20, restDelta: 0.01 });
  const nameWords = content.name.split(" ").filter(Boolean);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file, "hero");
      updateContent((draft) => {
        draft.hero.image.src = url;
        draft.hero.image.alt = file.name.replace(/\.[^.]+$/, "");
        draft.hero.image.enabled = true;
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
        "relative flex min-h-[92svh] items-center overflow-hidden pt-24 pb-10 transition-all duration-300 group/section",
        editMode && "hover:ring-1 hover:ring-ink/20",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {content.image.src && <ImagePreloader src={content.image.src} />}
      <div className="absolute inset-x-0 bottom-0 h-px bg-ink/10" />
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.46),transparent_32%,rgba(16,16,16,0.045)_78%,transparent)]"
        style={{ opacity: lightOpacity }}
        aria-hidden="true"
      />

      {/* Control overlay for Admin */}
      {editMode && (
        <div className="absolute top-24 right-4 z-20 flex flex-col items-end">
          <div className="flex items-center gap-2">
            {/* Section Visibility Toggle */}
            <div className="flex items-center gap-3 bg-white/90 border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
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
          <SectionReorderControls sectionId="hero" />
        </div>
      )}

      <div className="section-shell relative z-10 grid min-h-[calc(92svh-8.5rem)] items-center gap-10 py-6 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
        {content.image.src && content.image.enabled !== false ? (
          <motion.div
            style={{ y: imageY, willChange: "transform" }}
            className="mx-auto h-[52svh] min-h-[340px] w-full max-w-[430px] lg:h-[68svh] lg:max-h-[690px]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative h-full group">
              <motion.span
                className="pointer-events-none absolute -inset-3 rounded-t-full border border-ink/10"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.985 }}
                transition={{ delay: 0.22, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
              />
              <CinematicImage
                src={content.image.src}
                alt={content.image.alt}
                loading="eager"
                fetchPriority="high"
                className="h-full rounded-t-full border border-ink/10 shadow-editorial"
                imageClassName={cn(
                  "transition-transform duration-[2800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  isLoaded ? "scale-100" : "scale-115"
                )}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            style={{ y: imageY, willChange: "transform" }}
            className="mx-auto h-[52svh] min-h-[340px] w-full max-w-[430px] lg:h-[68svh] lg:max-h-[690px]"
          >
            <div className="relative h-full rounded-t-full bg-porcelain" />
          </motion.div>
        )}

        <motion.div style={{ y: textY }} className="heroMobileStaticText pb-0 lg:pt-6">
          <motion.div
            className="hero-eyebrow mb-9 flex items-center gap-4 text-[0.66rem] font-bold uppercase tracking-[0.24em] text-ink/45"
            style={{ x: metaX }}
            initial={{ opacity: 0, y: 18 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ delay: HERO_META_DELAY, duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="h-px w-16 bg-silver" />
            <span>{content.monogramTagline ?? "film / teatr / głos"}</span>
          </motion.div>

          <motion.h1
            className="hero-written-name heroMobileStaticName max-w-[760px] font-serif text-[2.85rem] font-normal leading-[0.92] text-ink min-[380px]:text-[3.2rem] sm:text-[5.1rem] lg:text-[6.2rem] xl:text-[6.8rem]"
            style={{ x: nameX }}
          >
            {nameWords.map((word, wordIndex) => (
              <motion.span
                key={`${word}-${wordIndex}`}
                className="hero-written-word relative block w-fit whitespace-nowrap"
                initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                animate={
                  isLoaded
                    ? { opacity: 1, clipPath: "inset(0 0% 0 0)" }
                    : { opacity: 0, clipPath: "inset(0 100% 0 0)" }
                }
                transition={{
                  delay: HERO_NAME_DELAY + wordIndex * HERO_WORD_DELAY,
                  duration: 0.74,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                {word}
                <motion.span
                  className="hero-write-edge"
                  initial={{ left: "0%", opacity: 0 }}
                  animate={
                    isLoaded
                      ? { left: ["0%", "100%"], opacity: [0, 0.65, 0] }
                      : { left: "0%", opacity: 0 }
                  }
                  transition={{
                    delay: HERO_NAME_DELAY + wordIndex * HERO_WORD_DELAY,
                    duration: 0.74,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  aria-hidden="true"
                />
              </motion.span>
            ))}
          </motion.h1>

          <div className="mt-8 max-w-xl space-y-7">
            <motion.p
              className="text-xs font-bold uppercase tracking-[0.26em] text-ink/55"
              initial={{ opacity: 0, y: 14 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ delay: HERO_TAGLINE_DELAY, duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.tagline}
            </motion.p>
            <motion.p
              className="font-serif text-2xl leading-tight text-graphite sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: HERO_QUOTE_DELAY, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.quote}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ delay: HERO_BUTTON_DELAY, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            >
              <MagneticButton href="#work">{content.buttonText}</MagneticButton>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Edit Drawer */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Sekcja Startowa (Hero)"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="hero-menu-label">Nazwa w menu</Label>
            <Input
              id="hero-menu-label"
              value={globalContent.sections.hero.label ?? "Start"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.hero.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="hero-monogram">Monogram (inicjały)</Label>
            <Input
              id="hero-monogram"
              value={content.monogram}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.monogram = e.target.value.toUpperCase();
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="hero-monogram-tagline">Podtytuł monogramu</Label>
            <Input
              id="hero-monogram-tagline"
              value={content.monogramTagline ?? "film / teatr / głos"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.monogramTagline = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4">
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              Zdjęcie główne
            </Label>
            <div className="grid grid-cols-[92px_1fr] items-center gap-4">
              <div className="aspect-[3/4] overflow-hidden rounded-t-full border border-ink/10 bg-porcelain">
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
                      draft.hero.image.alt = e.target.value;
                    })
                  }
                  placeholder="Opis alternatywny"
                  className="h-8 rounded-full text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="hero-name">Imię i Nazwisko</Label>
            <Input
              id="hero-name"
              value={content.name}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.name = e.target.value;
                })
              }
              className="rounded-full font-serif"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="hero-tagline">Tagline</Label>
            <Input
              id="hero-tagline"
              value={content.tagline}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.tagline = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="hero-quote">Cytat</Label>
            <Textarea
              id="hero-quote"
              value={content.quote}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.quote = e.target.value;
                })
              }
              rows={3}
              className="rounded-2xl"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="hero-btn-text">Tekst przycisku</Label>
            <Input
              id="hero-btn-text"
              value={content.buttonText}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.hero.buttonText = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>
        </div>
      </AdminDrawer>
    </section>
  );
}

