"use client";

import { useEffect, useMemo, useState, ChangeEvent, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X, Upload, Loader2, Edit, ChevronLeft, ChevronRight, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import type { ShowreelContent, ShowreelVideo, SiteImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { ModalPortal } from "@/components/site/modal-portal";
import { RevealBlock, SectionReveal, SectionHeading } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { useBodyScrollLock } from "@/components/site/use-body-scroll-lock";
import { useHorizontalRail } from "@/components/site/use-horizontal-rail";
import { uploadImageFile } from "@/lib/firebase/content";
import { createId, cn } from "@/lib/utils";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=80";

function emptyImage(prefix: string): SiteImage {
  return {
    id: createId(prefix),
    enabled: true,
    src: PLACEHOLDER_IMAGE,
    alt: "Miniatura wideo",
    aspect: "wide"
  };
}

function getEmbeddableUrl(url: string, autoplay: boolean = false) {
  let embedUrl = url;
  if (url.includes("youtube.com/watch")) {
    try {
      const videoId = new URL(url).searchParams.get("v");
      embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      embedUrl = url;
    }
  } else if (url.includes("youtube.com/shorts/")) {
    const videoId = url.split("youtube.com/shorts/")[1]?.split(/[?&/]/)[0];
    embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } else if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } else if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) {
    const videoId = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    embedUrl = videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  if (autoplay) {
    if (embedUrl.includes("youtube.com/embed/")) {
      embedUrl += (embedUrl.includes("?") ? "&" : "?") + "autoplay=1&mute=0&rel=0&modestbranding=1";
    } else if (embedUrl.includes("player.vimeo.com/video/")) {
      embedUrl += (embedUrl.includes("?") ? "&" : "?") + "autoplay=1&muted=0";
    }
  }
  return embedUrl;
}

function getYoutubeVideoId(url: string) {
  if (!url) return null;
  if (url.includes("youtube.com/watch")) {
    try {
      return new URL(url).searchParams.get("v");
    } catch {
      return null;
    }
  }
  if (url.includes("youtube.com/shorts/")) {
    return url.split("youtube.com/shorts/")[1]?.split(/[?&/]/)[0] ?? null;
  }
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1]?.split(/[?&]/)[0] ?? null;
  }
  return null;
}

export function Showreel({ content: initialContent, bgClass }: { content: ShowreelContent; bgClass?: string }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.showreel : initialContent;

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");
  const [activeVideoPoster, setActiveVideoPoster] = useState<string>("");
  
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ShowreelVideo | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const {
    canScrollNext,
    canScrollPrev,
    isDragging,
    railDragHandlers,
    railRef,
    scrollRail,
    shouldIgnoreRailClick,
    updateScrollState
  } = useHorizontalRail();

  const videosList = useMemo(() => content.videos ?? [], [content.videos]);
  const visibleVideos = useMemo(() => videosList.filter(v => editMode || v.enabled), [videosList, editMode]);

  useEffect(() => {
    updateScrollState();
  }, [updateScrollState, visibleVideos.length]);

  useBodyScrollLock(activeVideoUrl !== null);

  const mainVideoUrl = useMemo(() => getEmbeddableUrl(content.videoUrl, true), [content.videoUrl]);
  const mainIsMp4 = mainVideoUrl.toLowerCase().endsWith(".mp4");

  const mainYtId = getYoutubeVideoId(content.videoUrl);
  const mainYtThumbUrl =
    content.youtubeThumbnailEnabled && mainYtId
      ? `https://img.youtube.com/vi/${mainYtId}/hqdefault.jpg`
      : null;

  const mainThumbnailSrc = mainYtThumbUrl || content.thumbnail?.src || PLACEHOLDER_IMAGE;

  useEffect(() => {
    if (!activeVideoUrl) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveVideoUrl(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeVideoUrl]);

  const handleMainImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file, "showreel");
      updateContent((draft) => {
        draft.showreel.thumbnail.src = url;
        draft.showreel.thumbnail.alt = file.name.replace(/\.[^.]+$/, "");
        draft.showreel.thumbnail.enabled = true;
      });
    } catch (error) {
      console.error(error);
      alert("Błąd przesyłania obrazu: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoThumbUpload = async (event: ChangeEvent<HTMLInputElement>, videoIndex: number) => {
    if (!editingVideo) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImageId(editingVideo.id);
      const url = await uploadImageFile(file, `showreel-${editingVideo.id}`);
      const updatedVideos = videosList.map((v, i) =>
        i === videoIndex ? { ...v, thumbnail: { ...v.thumbnail, src: url, alt: file.name.replace(/\.[^.]+$/, "") } } : v
      );
      updateContent((draft) => {
        draft.showreel.videos = updatedVideos;
      });
      setEditingVideo((prev) => prev ? { ...prev, thumbnail: { ...prev.thumbnail, src: url } } : null);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania miniatury: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
    }
  };

  const addVideoItem = () => {
    const newVideo: ShowreelVideo = {
      id: createId("video"),
      enabled: true,
      title: "Nowe wideo",
      description: "Opis wideo.",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      thumbnail: emptyImage("video-thumb"),
      youtubeThumbnailEnabled: false
    };
    updateContent((draft) => {
      if (!draft.showreel.videos) {
        draft.showreel.videos = [];
      }
      draft.showreel.videos.push(newVideo);
    });
    setIsSectionDrawerOpen(false);
    setEditingVideo(newVideo);
  };

  const deleteVideoItem = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć to wideo?")) {
      updateContent((draft) => {
        draft.showreel.videos = (draft.showreel.videos ?? []).filter((v) => v.id !== id);
      });
      if (editingVideo?.id === id) setEditingVideo(null);
    }
  };

  const toggleVideoEnabled = (index: number) => {
    updateContent((draft) => {
      if (draft.showreel.videos) {
        draft.showreel.videos[index].enabled = !draft.showreel.videos[index].enabled;
      }
    });
  };

  const moveVideoItem = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= videosList.length) return;
    updateContent((draft) => {
      const list = [...(draft.showreel.videos ?? [])];
      const [item] = list.splice(index, 1);
      list.splice(toIndex, 0, item);
      draft.showreel.videos = list;
    });
  };

  const updateVideoField = <K extends keyof ShowreelVideo>(index: number, field: K, value: ShowreelVideo[K]) => {
    updateContent((draft) => {
      if (draft.showreel.videos) {
        draft.showreel.videos[index] = { ...draft.showreel.videos[index], [field]: value };
      }
    });
    setEditingVideo((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const isSectionEnabled = globalContent.sections.showreel.enabled;

  return (
    <SectionReveal
      id="showreel"
      className={cn(
        "relative py-24 transition-all duration-300 group/section",
        bgClass || "bg-white",
        editMode && "hover:ring-1 hover:ring-ink/20",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      <link rel="preconnect" href="https://www.youtube.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
      
      {/* Control overlay for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-3 bg-porcelain/90 border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
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

          <button
            type="button"
            onClick={() => setIsSectionDrawerOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/70 hover:border-ink hover:text-ink shadow-sm transition-all"
          >
            <Edit className="h-3.5 w-3.5" />
            Edytuj
          </button>
        </div>
      )}

      <div className="section-shell">
        {visibleVideos.length > 0 ? (
          // Multi video layout: Horizontal scrolling list (rail)
          <div>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end w-full mb-10">
              <SectionHeading eyebrow={content.eyebrow} title={content.title} />
              {content.description && (
                <RevealBlock delay={0.14} x={24} y={18}>
                  <p className="max-w-sm text-sm leading-7 text-ink/55">
                    {content.description}
                  </p>
                </RevealBlock>
              )}
            </div>

            <div className="relative mt-12">
              {visibleVideos.length > 1 && (
                <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden md:block">
                  <AnimatePresence initial={false}>
                    {canScrollPrev && (
                      <motion.div
                        key="showreel-prev"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, x: -12, y: "-50%", scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1, y: "-50%" }}
                        exit={{ opacity: 0, x: -12, y: "-50%", scale: 0.92 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="pointer-events-auto rounded-full border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white"
                          onClick={() => scrollRail(-1)}
                          aria-label="Przewiń showreel w lewo"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence initial={false}>
                    {canScrollNext && (
                      <motion.div
                        key="showreel-next"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, x: 12, y: "-50%", scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1, y: "-50%" }}
                        exit={{ opacity: 0, x: 12, y: "-50%", scale: 0.92 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="pointer-events-auto rounded-full border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white"
                          onClick={() => scrollRail(1)}
                          aria-label="Przewiń showreel w prawo"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div
                ref={railRef}
                {...railDragHandlers}
                className={cn(
                  "no-scrollbar grid auto-cols-[88%] grid-flow-col gap-6 overflow-x-auto pt-8 pb-16 -mt-8 select-none [scroll-snap-type:x_mandatory] [touch-action:pan-y] sm:auto-cols-[56%] lg:auto-cols-[40%]",
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
              >
                {visibleVideos.map((video, idx) => {
                  const ytId = getYoutubeVideoId(video.videoUrl);
                  const ytThumb = video.youtubeThumbnailEnabled && ytId
                    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                    : null;
                  const thumbSrc = ytThumb || video.thumbnail?.src || PLACEHOLDER_IMAGE;

                  return (
                    <div key={video.id} className="relative group scroll-ml-4 [scroll-snap-align:start]">
                      <motion.button
                        type="button"
                        className={cn(
                          "w-full group text-left border border-ink/10 bg-white shadow-[0_18px_60px_rgba(16,16,16,0.04)] rounded-2xl flex flex-col h-full overflow-hidden transition-shadow duration-500 hover:shadow-editorial",
                          !video.enabled && "opacity-50 border-dashed"
                        )}
                        onClick={() => {
                          if (shouldIgnoreRailClick()) return;
                          setIsVideoLoading(true);
                          setActiveVideoUrl(getEmbeddableUrl(video.videoUrl, true));
                          setActiveVideoTitle(video.title);
                          setActiveVideoPoster(thumbSrc);
                        }}
                        aria-label={`Odtwórz wideo ${video.title}`}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.05 }}
                        transition={{ delay: idx * 0.08, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={editMode ? {} : { y: -8 }}
                      >
                        <div className="relative aspect-video w-full overflow-hidden">
                          <CinematicImage
                            src={thumbSrc}
                            alt={video.thumbnail.alt || video.title}
                            className="absolute inset-0 h-full w-full"
                          />
                          <span className="absolute inset-0 z-10 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/18" />
                          {!editMode && (
                            <span className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/20 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                              <Play className="ml-0.5 h-6 w-6 fill-current" />
                            </span>
                          )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between w-full">
                          <div>
                            <h3 className="font-serif text-2xl leading-tight text-ink">
                              {video.title}
                            </h3>
                            {video.description && (
                              <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink/55">
                                {video.description}
                              </p>
                            )}
                          </div>
                          {!video.enabled && (
                            <span className="mt-4 inline-flex items-center gap-1 rounded bg-ink/5 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/40 w-fit">
                              Ukryty
                            </span>
                          )}
                        </div>
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // Single video layout: Default fallback
          <div className="relative">
            {/* Ozdobne luksusowe kółko z kropką w lewym górnym rogu sekcji, w linii z lewą krawędzią zawartości na PC */}
            <div className="absolute left-0 top-0 z-10 hidden lg:block">
              <div className="eyebrow-ornament-only" />
            </div>

            <div className="grid items-center gap-10 border-y border-ink/10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
            <RevealBlock className="relative group aspect-video w-full rounded-3xl overflow-hidden shadow-editorial" x={-28} y={12}>
              <button
                type="button"
                className="absolute inset-0 h-full w-full text-left cursor-pointer"
                onClick={() => {
                  if (!editMode) {
                    setIsVideoLoading(true);
                    setActiveVideoUrl(mainVideoUrl);
                    setActiveVideoTitle(content.title);
                    setActiveVideoPoster(mainThumbnailSrc);
                  }
                }}
                aria-label="Odtwórz showreel"
                disabled={editMode}
              >
                <CinematicImage
                  src={mainThumbnailSrc}
                  alt={content.thumbnail.alt || "Showreel thumbnail"}
                  className="absolute inset-0 h-full w-full"
                  imageClassName="rounded-3xl"
                />
                <span className="absolute inset-0 z-10 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/18" />
                {!editMode && (
                  <span className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/18 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                    <Play className="ml-1 h-8 w-8 fill-current" />
                  </span>
                )}
              </button>
            </RevealBlock>

            <div className="max-w-xl lg:pl-8 space-y-6">
              <RevealBlock delay={0.08} y={12}>
                <span className="eyebrow-simple">{content.eyebrow}</span>
              </RevealBlock>
              <RevealBlock delay={0.16}>
                <h2 className="mt-5 font-serif text-5xl font-medium leading-none text-ink sm:text-7xl">
                  {content.title}
                </h2>
              </RevealBlock>
              <RevealBlock delay={0.25}>
                <p className="mt-6 text-lg leading-8 text-graphite/75">{content.description}</p>
              </RevealBlock>
              <RevealBlock delay={0.34} className="mt-9">
                <MagneticButton
                  onClick={() => {
                    setIsVideoLoading(true);
                    setActiveVideoUrl(mainVideoUrl);
                    setActiveVideoTitle(content.title);
                    setActiveVideoPoster(mainThumbnailSrc);
                  }}
                >
                  {content.buttonText}
                </MagneticButton>
              </RevealBlock>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Main Section Settings Drawer */}
      <AdminDrawer
        isOpen={isSectionDrawerOpen}
        onClose={() => setIsSectionDrawerOpen(false)}
        title="Sekcja Showreel (Wideo)"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="showreel-menu-label">Nazwa w menu</Label>
            <Input
              id="showreel-menu-label"
              value={globalContent.sections.showreel.label ?? "Showreel"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.showreel.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="showreel-eyebrow">Eyebrow (nadnagłówek)</Label>
            <Input
              id="showreel-eyebrow"
              value={content.eyebrow}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.showreel.eyebrow = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="showreel-title">Tytuł sekcji</Label>
            <Input
              id="showreel-title"
              value={content.title}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.showreel.title = e.target.value;
                })
              }
              className="rounded-xl font-serif text-lg"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="showreel-desc">Opis</Label>
            <Textarea
              id="showreel-desc"
              value={content.description}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.showreel.description = e.target.value;
                })
              }
              rows={4}
              className="rounded-xl text-sm"
            />
          </div>

          {/* List of scrollable videos */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Lista wideo ({videosList.length})
              </Label>
              <Button variant="outline" size="sm" onClick={addVideoItem} className="h-8 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5 animate-none" /> Dodaj wideo
              </Button>
            </div>

            {videosList.length === 0 && (
              <div className="bg-porcelain p-4 rounded-2xl text-center text-xs text-ink/40 mb-3 border border-ink/5">
                Pusta lista. Używasz układu z jednym głównym filmem (wsteczna kompatybilność). Kliknij "Dodaj wideo", by włączyć tryb listy.
              </div>
            )}

            <div className="grid gap-2 max-h-60 overflow-y-auto no-scrollbar">
              <AnimatePresence initial={false}>
                {videosList.map((video, idx) => (
                  <motion.div
                    layout
                    key={video.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink/10 bg-white p-2.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <div className="truncate">
                      <p className="text-xs font-serif font-bold text-ink truncate">{video.title}</p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => moveVideoItem(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveVideoItem(idx, 1)}
                        disabled={idx === videosList.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVideoEnabled(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                      >
                        {video.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSectionDrawerOpen(false);
                          setEditingVideo(video);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white hover:bg-graphite"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVideoItem(video.id)}
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

          {videosList.length === 0 && (
            <div className="border-t border-ink/10 pt-4 mt-2 space-y-4">
              <Label className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink/40">
                Główny film (Pojedynczy)
              </Label>
              
              <div className="grid gap-1">
                <Label htmlFor="showreel-video-url">Link do filmu (MP4 / YouTube / Vimeo)</Label>
                <Input
                  id="showreel-video-url"
                  value={content.videoUrl}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.showreel.videoUrl = e.target.value;
                    })
                  }
                  className="rounded-full text-xs font-mono"
                />
              </div>

              {content.videoUrl && (content.videoUrl.includes("youtube.com") || content.videoUrl.includes("youtu.be")) && (
                <div className="flex items-center justify-between p-3.5 border border-ink/10 rounded-2xl bg-white mt-1">
                  <div className="grid gap-0.5">
                    <Label htmlFor="showreel-yt-thumb" className="text-xs font-bold cursor-pointer">Automatyczna miniatura z YouTube</Label>
                    <span className="text-[0.62rem] text-ink/40">Pobiera okładkę bezpośrednio z filmu na YouTube</span>
                  </div>
                  <input
                    id="showreel-yt-thumb"
                    type="checkbox"
                    checked={!!content.youtubeThumbnailEnabled}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.showreel.youtubeThumbnailEnabled = e.target.checked;
                      })
                    }
                    className="h-4 w-4 rounded border-ink/10 text-ink focus:ring-ink cursor-pointer"
                  />
                </div>
              )}

              <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4">
                <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                  Miniatura wideo
                </Label>
                <div className="grid grid-cols-[112px_1fr] items-center gap-4">
                  <div className="aspect-video overflow-hidden rounded-xl border border-ink/10 bg-porcelain">
                    {mainThumbnailSrc && (
                      <img src={mainThumbnailSrc} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
                      {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Zmień miniaturę
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleMainImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <Input
                      value={content.thumbnail.alt}
                      onChange={(e) =>
                        updateContent((draft) => {
                          draft.showreel.thumbnail.alt = e.target.value;
                        })
                      }
                      placeholder="Opis alternatywny"
                      className="h-8 rounded-full text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="showreel-btn-text">Tekst przycisku</Label>
                <Input
                  id="showreel-btn-text"
                  value={content.buttonText}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.showreel.buttonText = e.target.value;
                    })
                  }
                  className="rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </AdminDrawer>

      {/* Individual Video Edit Drawer */}
      <AdminDrawer
        isOpen={editingVideo !== null}
        onClose={() => {
          setEditingVideo(null);
          setIsSectionDrawerOpen(true);
        }}
        title={`Edycja wideo: ${editingVideo?.title || ""}`}
      >
        {editingVideo && (
          <div className="grid gap-5">
            {(() => {
              const videoIndex = videosList.findIndex((v) => v.id === editingVideo.id);
              if (videoIndex === -1) return null;

              const ytId = getYoutubeVideoId(editingVideo.videoUrl);
              const ytThumb = editingVideo.youtubeThumbnailEnabled && ytId
                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                : null;
              const thumbSrc = ytThumb || editingVideo.thumbnail?.src || PLACEHOLDER_IMAGE;

              return (
                <div className="space-y-5">
                  <div className="grid gap-1">
                    <Label>Tytuł filmu</Label>
                    <Input
                      value={editingVideo.title}
                      onChange={(e) => updateVideoField(videoIndex, "title", e.target.value)}
                      className="rounded-full"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label>Opis / Opis roli</Label>
                    <Textarea
                      value={editingVideo.description ?? ""}
                      onChange={(e) => updateVideoField(videoIndex, "description", e.target.value)}
                      rows={3}
                      className="rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label>Link do filmu (MP4 / YouTube / Vimeo)</Label>
                    <Input
                      value={editingVideo.videoUrl}
                      onChange={(e) => updateVideoField(videoIndex, "videoUrl", e.target.value)}
                      className="rounded-full text-xs font-mono"
                    />
                  </div>

                  {editingVideo.videoUrl && (editingVideo.videoUrl.includes("youtube.com") || editingVideo.videoUrl.includes("youtu.be")) && (
                    <div className="flex items-center justify-between p-3.5 border border-ink/10 rounded-2xl bg-white mt-1">
                      <div className="grid gap-0.5">
                        <Label className="text-xs font-bold cursor-pointer">Automatyczna miniatura z YouTube</Label>
                        <span className="text-[0.62rem] text-ink/40">Pobiera okładkę bezpośrednio z filmu na YouTube</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!editingVideo.youtubeThumbnailEnabled}
                        onChange={(e) => updateVideoField(videoIndex, "youtubeThumbnailEnabled", e.target.checked)}
                        className="h-4 w-4 rounded border-ink/10 text-ink focus:ring-ink cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4">
                    <Label className="text-xs font-bold uppercase tracking-[0.15em] text-ink/40">
                      Miniatura wideo
                    </Label>
                    <div className="grid grid-cols-[112px_1fr] items-center gap-4">
                      <div className="aspect-video overflow-hidden rounded-xl border border-ink/10 bg-porcelain">
                        {thumbSrc && (
                          <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="grid gap-2">
                        <label className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
                          {uploadingImageId === editingVideo.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Zmień miniaturę
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleVideoThumbUpload(e, videoIndex)}
                            disabled={uploadingImageId !== null}
                          />
                        </label>
                        <Input
                          value={editingVideo.thumbnail.alt}
                          onChange={(e) => {
                            const updatedThumb = { ...editingVideo.thumbnail, alt: e.target.value };
                            updateVideoField(videoIndex, "thumbnail", updatedThumb);
                          }}
                          placeholder="Opis alternatywny"
                          className="h-8 rounded-full text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </AdminDrawer>

      {/* Video Playback Modal */}
      <ModalPortal>
        <AnimatePresence>
          {activeVideoUrl && (
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
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rounded-3xl overflow-hidden bg-black relative w-full h-full">
                  <div className="absolute left-6 top-5 z-30 max-w-[75%]">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/50 mb-0.5">
                      Showreel
                    </p>
                    <h3 className="font-serif text-lg sm:text-xl text-white font-medium truncate">
                      {activeVideoTitle}
                    </h3>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-30 text-white hover:bg-white/10 rounded-full h-10 w-10"
                    onClick={() => setActiveVideoUrl(null)}
                    aria-label="Zamknij showreel"
                  >
                    <X className="h-5 w-5" />
                  </Button>

                  {isVideoLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                      <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/50">
                        Ładowanie wideo...
                      </span>
                    </div>
                  )}

                  <div className="aspect-video w-full">
                    {activeVideoUrl.toLowerCase().endsWith(".mp4") || activeVideoUrl.toLowerCase().includes(".mp4?") ? (
                      <video
                        src={activeVideoUrl}
                        className="h-full w-full object-contain"
                        controls
                        autoPlay
                        playsInline
                        poster={activeVideoPoster}
                        onCanPlay={() => setIsVideoLoading(false)}
                      />
                    ) : (
                      <iframe
                        src={activeVideoUrl}
                        className="h-full w-full"
                        title={activeVideoTitle}
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
