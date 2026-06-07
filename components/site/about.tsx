"use client";

import { useState, ChangeEvent, useRef, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import type { AboutContent, TimelineEvent } from "@/lib/types";
import { siteContent as defaultSiteContent } from "@/lib/site-content";
import { AboutImageFrame } from "@/components/site/about-image-frame";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { RevealBlock, SectionHeading } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { uploadImageFile } from "@/lib/firebase/content";
import { Upload, Loader2, Edit, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { createId, cn } from "@/lib/utils";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionReorderControls } from "@/components/admin/section-reorder-controls";
import { useScroll, useTransform, useSpring, motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { formatTextTemplate } from "@/lib/text-template";

const DESKTOP_TIMELINE_SCROLL_FACTOR = 1.08;
const ANCHOR_NAVIGATION_FREEZE_MS = 1700;
const DEFAULT_TIMELINE_EYEBROW = "Oś Czasu";
const DEFAULT_TIMELINE_TITLE = "Droga twórcza";
const DEFAULT_TIMELINE_STEP_TEMPLATE = "Krok {current} / {total}";

type AnchorScrollEventDetail = {
  href?: string;
};

export function About({
  content: initialContent,
  bgClass,
  reverseParallax
}: {
  content: AboutContent;
  bgClass?: string;
  reverseParallax?: boolean;
}) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.about : initialContent;

  const [isUploading, setIsUploading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Timeline event editing states
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [desktopScrollHeight, setDesktopScrollHeight] = useState<number | null>(null);
  const [anchorNavigationOffsets, setAnchorNavigationOffsets] = useState<{
    imageX: string;
    railX: number;
    yearX: string;
  } | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const timelineEvents = useMemo(() => {
    return content.timeline ?? defaultSiteContent.about.timeline ?? [];
  }, [content.timeline]);
  const visibleEvents = useMemo(() => timelineEvents.filter(e => editMode || e.enabled), [timelineEvents, editMode]);
  const hasVisibleTimelineEvents = visibleEvents.length > 0;
  const timelineEyebrow = content.timelineEyebrow ?? DEFAULT_TIMELINE_EYEBROW;
  const timelineTitle = content.timelineTitle ?? DEFAULT_TIMELINE_TITLE;

  // Framer Motion scroll logic for horizontal parallax on desktop
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [translateXVal, setTranslateXVal] = useState(0);

  useEffect(() => {
    if (isMobile || !hasVisibleTimelineEvents) {
      const frame = window.requestAnimationFrame(() => {
        setTranslateXVal(0);
        setDesktopScrollHeight(null);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const element = scrollRef.current;
    if (!element) return;

    const measure = () => {
      const railWidth = element.offsetWidth;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const overflow = railWidth - viewportWidth;
      const safeOverflow = Math.max(0, overflow);

      setTranslateXVal(safeOverflow > 0 ? -safeOverflow : 0);
      setDesktopScrollHeight(
        Math.round(viewportHeight + safeOverflow * DESKTOP_TIMELINE_SCROLL_FACTOR)
      );
    };

    // ResizeObserver catches font/image loads that change dimensions
    const ro = new ResizeObserver(measure);
    ro.observe(element);
    measure();

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [hasVisibleTimelineEvents, isMobile, visibleEvents.length]);

  const x = useTransform(scrollYProgress, [0, 1], [0, translateXVal]);
  const springX = useSpring(x, { stiffness: 90, damping: 22, mass: 0.4 });

  // Parallax translation for timeline images (percentage based to prevent gaps when scaled)
  const imgX = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  // Year indicator translation (slightly faster to create depth/stagger)
  const yearX = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  useEffect(() => {
    let freezeTimer = 0;

    const clearFreezeTimer = () => {
      if (freezeTimer) {
        window.clearTimeout(freezeTimer);
        freezeTimer = 0;
      }
    };

    const freezeHorizontalMotion = (event: Event) => {
      const href = (event as CustomEvent<AnchorScrollEventDetail>).detail?.href;
      if (!href || href === "#about") return;

      clearFreezeTimer();
      flushSync(() => {
        setAnchorNavigationOffsets({
          imageX: imgX.get(),
          railX: springX.get(),
          yearX: yearX.get()
        });
      });
      freezeTimer = window.setTimeout(() => {
        setAnchorNavigationOffsets(null);
        freezeTimer = 0;
      }, ANCHOR_NAVIGATION_FREEZE_MS);
    };

    const releaseHorizontalMotion = () => {
      clearFreezeTimer();
      setAnchorNavigationOffsets(null);
    };

    window.addEventListener("portfolio:anchor-scroll-start", freezeHorizontalMotion);
    window.addEventListener("portfolio:anchor-scroll-end", releaseHorizontalMotion);

    return () => {
      clearFreezeTimer();
      window.removeEventListener("portfolio:anchor-scroll-start", freezeHorizontalMotion);
      window.removeEventListener("portfolio:anchor-scroll-end", releaseHorizontalMotion);
    };
  }, [imgX, springX, yearX]);

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

  const addTimelineEvent = () => {
    const newEvent: TimelineEvent = {
      id: createId("timeline-event"),
      enabled: true,
      year: new Date().getFullYear().toString(),
      title: "Nowy kamień milowy",
      description: "Opis ważnego momentu biograficznego.",
      image: {
        id: createId("timeline-img"),
        enabled: true,
        src: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
        alt: "Domyślny placeholder",
        aspect: "landscape"
      }
    };
    updateContent((draft) => {
      if (!draft.about.timeline) {
        draft.about.timeline = [];
      }
      draft.about.timeline.push(newEvent);
    });
    setIsDrawerOpen(false);
    setEditingEvent(newEvent);
  };

  const deleteTimelineEvent = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć to wydarzenie z osi czasu?")) {
      updateContent((draft) => {
        draft.about.timeline = (draft.about.timeline ?? []).filter((e) => e.id !== id);
      });
      if (editingEvent?.id === id) setEditingEvent(null);
    }
  };

  const toggleTimelineEventEnabled = (index: number) => {
    updateContent((draft) => {
      if (draft.about.timeline) {
        draft.about.timeline[index].enabled = !draft.about.timeline[index].enabled;
      }
    });
  };

  const moveTimelineEvent = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= timelineEvents.length) return;
    updateContent((draft) => {
      const list = [...(draft.about.timeline ?? [])];
      const [item] = list.splice(index, 1);
      list.splice(toIndex, 0, item);
      draft.about.timeline = list;
    });
  };

  const updateEventField = <K extends keyof TimelineEvent>(field: K, value: TimelineEvent[K]) => {
    if (!editingEvent) return;
    const nextEvent = { ...editingEvent, [field]: value };
    setEditingEvent(nextEvent);
    updateContent((draft) => {
      if (draft.about.timeline) {
        draft.about.timeline = draft.about.timeline.map((e) => (e.id === nextEvent.id ? nextEvent : e));
      }
    });
  };

  const handleEventImageUpload = async (event: ChangeEvent<HTMLInputElement>, eventId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImageId(eventId);
      const url = await uploadImageFile(file, `about-timeline-${eventId}`);
      const nextImg = { 
        id: editingEvent?.image.id || createId("timeline-img"),
        enabled: true, 
        src: url, 
        alt: file.name.replace(/\.[^.]+$/, ""),
        aspect: "landscape" as const
      };
      updateEventField("image", nextImg);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania obrazu wydarzenia: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
    }
  };

  const isSectionEnabled = globalContent.sections.about.enabled;
  const shouldUseDesktopTimeline = !isMobile && hasVisibleTimelineEvents;
  const currentX = shouldUseDesktopTimeline
    ? anchorNavigationOffsets?.railX ?? springX
    : 0;
  const currentImageX = shouldUseDesktopTimeline
    ? anchorNavigationOffsets?.imageX ?? imgX
    : 0;
  const currentYearX = shouldUseDesktopTimeline
    ? anchorNavigationOffsets?.yearX ?? yearX
    : 0;

  return (
    <div
      ref={containerRef}
      id="about"
      style={
        !isMobile && hasVisibleTimelineEvents && desktopScrollHeight
          ? { height: `${desktopScrollHeight}px` }
          : undefined
      }
      className={cn(
        "relative border-y border-ink/10 py-20 transition-all duration-300 lg:border-none lg:py-0",
        bgClass || "bg-white",
        editMode && "hover:ring-1 hover:ring-ink/20",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Control overlay for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex flex-col items-end">
          <div className="flex items-center gap-2">
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
          <SectionReorderControls sectionId="about" />
        </div>
      )}

      {/* Desktop view (sticky horizontal scroll with parallax) - hidden on mobile */}
      <div className="hidden lg:block relative lg:sticky lg:top-0 lg:h-screen lg:w-full lg:overflow-hidden lg:flex-row lg:items-center lg:py-0 lg:px-0 lg:border-y lg:border-ink/10">
        <motion.div
          ref={scrollRef}
          style={{ x: currentX, willChange: "transform" }}
          className="flex lg:flex-row lg:h-full lg:items-center lg:pl-16 lg:pr-32 lg:gap-0 lg:w-max lg:shrink-0"
        >
          {/* Slide 0: Biography Intro */}
          <div className="flex lg:w-auto lg:shrink-0 lg:flex-row lg:gap-16 lg:pr-24 lg:h-[80vh] lg:items-center lg:justify-start lg:pl-16 xl:pl-[calc((100vw-1240px)/2+4rem)]">
            <div className="max-w-2xl space-y-6">
              <SectionHeading eyebrow={content.eyebrow} title={content.title} reverseDirection={reverseParallax} />
              <RevealBlock delay={0.12}>
                <p className="mt-6 text-lg leading-8 text-graphite/80 sm:text-xl sm:leading-9 whitespace-pre-wrap">
                  {content.body}
                </p>
              </RevealBlock>
              <RevealBlock delay={0.22} className="mt-8">
                <MagneticButton href="#contact" variant="outline">
                  {content.buttonText}
                </MagneticButton>
              </RevealBlock>
            </div>

            {content.image.src && content.image.enabled !== false ? (
              <RevealBlock className="ornament-line lg:shrink-0 lg:w-[420px] lg:pl-5 lg:pt-5" delay={0.14} x={34} y={18}>
                <div className="relative group overflow-hidden rounded-[1.5rem] rounded-tl-none border border-ink/10 shadow-editorial">
                  <AboutImageFrame className="hidden lg:block" />
                  <CinematicImage
                    src={content.image.src}
                    alt={content.image.alt}
                    className="aspect-[4/5] lg:max-h-[520px] rounded-[1.5rem] rounded-tl-none"
                  />
                </div>
              </RevealBlock>
            ) : null}
          </div>

          {/* Slides 1-N: Timeline Milestones */}
          {visibleEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              className={cn(
                "relative lg:border-none lg:bg-transparent lg:rounded-none lg:p-0 lg:w-[45vw] lg:max-w-[500px] lg:shrink-0 lg:flex-col lg:justify-center lg:px-12 lg:border-l lg:border-ink/10 lg:h-[80vh] lg:min-h-0",
                !event.enabled && "opacity-50"
              )}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4, margin: "0px -180px 0px 0px" }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
            >
              {/* Year Indicator with staggered/faster parallax translation */}
              <motion.div
                style={{ x: currentYearX }}
                className="absolute top-4 left-12 text-[10rem] font-bold font-serif text-ink/[0.04] leading-none select-none pointer-events-none"
              >
                {event.year}
              </motion.div>

              <div className="space-y-3 lg:mt-12 lg:space-y-4 lg:relative lg:z-10">
                <span className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/40">
                  {formatTextTemplate(content.timelineStepTemplate, DEFAULT_TIMELINE_STEP_TEMPLATE, {
                    current: idx + 1,
                    total: visibleEvents.length
                  })}
                </span>
                <h4 className="font-serif text-3xl lg:md:text-4xl text-ink leading-tight">{event.title}</h4>
                <p className="text-sm leading-6 text-graphite/75 lg:max-w-lg">{event.description}</p>
              </div>

              {event.image?.src && event.image.enabled !== false && (
                <div className="mt-8 aspect-[16/10] max-w-md overflow-hidden rounded-xl border border-ink/10 w-full lg:shadow-editorial relative">
                  <motion.div
                    style={{ x: currentImageX, scale: shouldUseDesktopTimeline ? 1.15 : 1, willChange: "transform" }}
                    className="w-full h-full"
                  >
                    <CinematicImage
                      src={event.image.src}
                      alt={event.image.alt || event.title}
                      className="w-full h-full object-cover"
                      imageClassName="rounded-xl lg:rounded-2xl"
                    />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Bar (Desktop only) */}
        {visibleEvents.length > 0 && (
          <div className="absolute bottom-8 left-16 right-16 h-px bg-ink/[0.055]">
            <motion.div
              style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
              className="h-full bg-ink/45 timeline-progress-bar"
            />
          </div>
        )}
      </div>

      {/* Mobile view (vertical intro, swipeable timeline carousel) - hidden on desktop */}
      <div className="block lg:hidden w-full py-16 px-6 sm:px-10 space-y-16">
        {/* Intro Slide */}
        <div className="flex flex-col gap-8 w-full">
          <div className="space-y-6">
            <SectionHeading eyebrow={content.eyebrow} title={content.title} reverseDirection={reverseParallax} />
            <p className="text-lg leading-8 text-graphite/80 sm:text-xl sm:leading-9 whitespace-pre-wrap">
              {content.body}
            </p>
            <div className="pt-4">
              <MagneticButton href="#contact" variant="outline">
                {content.buttonText}
              </MagneticButton>
            </div>
          </div>

          {content.image.src && content.image.enabled !== false ? (
            <div className="w-full max-w-md ornament-line pl-4 pt-4">
              <div className="relative group overflow-hidden rounded-[1.5rem] rounded-tl-none border border-ink/10 shadow-editorial">
                <CinematicImage
                  src={content.image.src}
                  alt={content.image.alt}
                  className="aspect-[4/5] max-h-[480px] rounded-[1.5rem] rounded-tl-none"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Timeline Events Carousel */}
        {visibleEvents.length > 0 && (
          <div className="space-y-6 -mx-6 sm:-mx-10">
            <div className="space-y-1 px-6 sm:px-10">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/40">{timelineEyebrow}</span>
              <h3 className="font-serif text-2xl text-ink">{timelineTitle}</h3>
            </div>

            {/* Horizontal Swipeable Snap container */}
            <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 px-6 sm:px-10 scroll-pl-6 sm:scroll-pl-10 scrollbar-hide">
              {visibleEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  className={cn(
                    "snap-start shrink-0 w-[78vw] max-w-[290px] border border-ink/10 bg-porcelain/30 rounded-2xl p-5 flex flex-col justify-between min-h-[360px] relative",
                    !event.enabled && "opacity-50 border-dashed"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.64, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="absolute top-4 right-4 text-4xl font-bold font-serif text-ink/10 select-none pointer-events-none">
                    {event.year}
                  </div>

                  <div className="space-y-2 mt-4">
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink/40">
                      {formatTextTemplate(content.timelineStepTemplate, DEFAULT_TIMELINE_STEP_TEMPLATE, {
                        current: idx + 1,
                        total: visibleEvents.length
                      })}
                    </span>
                    <h4 className="font-serif text-lg text-ink leading-tight">{event.title}</h4>
                    <p className="text-xs leading-5 text-graphite/75">{event.description}</p>
                  </div>

                  {event.image?.src && event.image.enabled !== false && (
                    <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-ink/10 w-full relative">
                      <CinematicImage
                        src={event.image.src}
                        alt={event.image.alt || event.title}
                        className="w-full h-full object-cover"
                        imageClassName="rounded-xl"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Section Settings Drawer */}
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
              rows={6}
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

          <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4">
            <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
              Teksty osi czasu
            </Label>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="about-timeline-eyebrow">Nadtytuł osi czasu</Label>
                <Input
                  id="about-timeline-eyebrow"
                  value={timelineEyebrow}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.about.timelineEyebrow = e.target.value;
                    })
                  }
                  className="rounded-full"
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="about-timeline-title">Tytuł osi czasu</Label>
                <Input
                  id="about-timeline-title"
                  value={timelineTitle}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.about.timelineTitle = e.target.value;
                    })
                  }
                  className="rounded-xl font-serif text-lg"
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="about-timeline-step-template">Format licznika wydarzenia</Label>
                <Input
                  id="about-timeline-step-template"
                  value={content.timelineStepTemplate ?? DEFAULT_TIMELINE_STEP_TEMPLATE}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.about.timelineStepTemplate = e.target.value;
                    })
                  }
                  className="rounded-full"
                />
                <span className="text-[0.62rem] leading-5 text-ink/40">
                  Użyj {"{current}"} i {"{total}"}, np. Etap {"{current}"} z {"{total}"}.
                </span>
              </div>
            </div>
          </div>

          {/* Timeline events in drawer */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Wydarzenia na osi czasu ({timelineEvents.length})
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addTimelineEvent} className="h-8 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" /> Dodaj wydarzenie
              </Button>
            </div>

            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {timelineEvents.map((event, idx) => (
                  <motion.div
                    layout
                    key={event.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink/10 bg-white p-2.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <div className="truncate">
                      <p className="text-[0.62rem] font-bold uppercase text-ink/40 truncate">Rok {event.year}</p>
                      <p className="text-xs font-serif font-bold text-ink truncate">{event.title}</p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => moveTimelineEvent(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTimelineEvent(idx, 1)}
                        disabled={idx === timelineEvents.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleTimelineEventEnabled(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                      >
                        {event.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setEditingEvent(event);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white hover:bg-graphite"
                        title="Edytuj szczegóły"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTimelineEvent(event.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </AdminDrawer>

      {/* Individual Event Edit Drawer */}
      <AdminDrawer
        isOpen={editingEvent !== null}
        onClose={() => {
          setEditingEvent(null);
          setIsDrawerOpen(true); // Return to about list
        }}
        title={`Edycja wydarzenia: ${editingEvent?.year || ""}`}
      >
        {editingEvent && (
          <div className="grid gap-5">
            <div className="grid gap-1">
              <Label>Rok (np. 2019)</Label>
              <Input
                value={editingEvent.year}
                onChange={(e) => updateEventField("year", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-1">
              <Label>Tytuł wydarzenia</Label>
              <Input
                value={editingEvent.title}
                onChange={(e) => updateEventField("title", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-1">
              <Label>Opis wydarzenia</Label>
              <Textarea
                value={editingEvent.description}
                onChange={(e) => updateEventField("description", e.target.value)}
                rows={4}
                className="rounded-xl text-sm"
              />
            </div>

            {/* Event Image field */}
            <div className="grid gap-3 p-4 border border-ink/10 rounded-2xl bg-white">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Zdjęcie wydarzenia
              </Label>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <div className="aspect-[4/3] overflow-hidden border border-ink/10 bg-porcelain rounded-lg">
                  {editingEvent.image.src && (
                    <img
                      src={editingEvent.image.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 hover:border-ink hover:text-ink transition-colors">
                    {uploadingImageId === editingEvent.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Wyślij plik
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleEventImageUpload(e, editingEvent.id)}
                      disabled={uploadingImageId !== null}
                    />
                  </label>
                  <span className="text-[0.6rem] text-ink/40">Zalecany poziomy kadr</span>
                  <Input
                    value={editingEvent.image.alt}
                    onChange={(e) =>
                      updateEventField("image", {
                        ...editingEvent.image,
                        alt: e.target.value
                      })
                    }
                    placeholder="Opis alternatywny"
                    className="h-8 rounded-full text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
}
