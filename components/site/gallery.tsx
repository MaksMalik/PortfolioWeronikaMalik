"use client";

import { useCallback, useEffect, useMemo, useState, ChangeEvent, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Edit, Upload, Loader2 } from "lucide-react";
import type { GallerySession, SiteImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { ModalPortal } from "@/components/site/modal-portal";
import { RevealBlock, SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { useBodyScrollLock } from "@/components/site/use-body-scroll-lock";
import { useHorizontalRail } from "@/components/site/use-horizontal-rail";
import { uploadImageFile } from "@/lib/firebase/content";
import { createId, cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80";

function emptyImage(prefix: string): SiteImage {
  return {
    id: createId(prefix),
    enabled: true,
    src: PLACEHOLDER_IMAGE,
    alt: "Zdjęcie zastępcze",
    title: "Nowe zdjęcie",
    description: "",
    aspect: "portrait"
  };
}

export function Gallery({ sessions: initialSessions }: { sessions: GallerySession[] }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const sessions = editMode ? globalContent.gallery : initialSessions;
  const visibleSessions = sessions.filter((session) => editMode || session.enabled);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<SiteImage | null>(null);
  const [editingSession, setEditingSession] = useState<GallerySession | null>(null);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [sessionDirection, setSessionDirection] = useState<-1 | 1>(1);

  const modalImageRef = useRef<HTMLDivElement>(null);
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

  const activeSession = activeIndex !== null ? sessions[activeIndex] : null;

  // Touch Swipe coordinates
  const touchStart = useRef<number | null>(null);

  const visibleImages = useMemo(
    () => activeSession?.images.filter((img) => editMode || img.enabled) ?? [],
    [activeSession?.images, editMode]
  );
  const currentImageIndex = activeImage
    ? visibleImages.findIndex((img) => img.id === activeImage.id)
    : -1;
  const imageNavigationState = useRef({ currentImageIndex, visibleImages });

  useEffect(() => {
    imageNavigationState.current = { currentImageIndex, visibleImages };
  }, [currentImageIndex, visibleImages]);

  const navigateImage = useCallback(
    (direction: "next" | "prev") => {
      const { currentImageIndex: imageIndex, visibleImages: images } = imageNavigationState.current;
      if (images.length <= 1) return;
      let nextIdx = imageIndex + (direction === "next" ? 1 : -1);
      if (nextIdx >= images.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = images.length - 1;
      setActiveImage(images[nextIdx]);
    },
    [setActiveImage]
  );

  useBodyScrollLock(activeSession !== null || activeImage !== null);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !activeImage) {
        setActiveIndex(null);
      } else if (event.key === "Escape" && activeImage) {
        setActiveImage(null);
      } else if (event.key === "ArrowLeft" && activeImage) {
        navigateImage("prev");
      } else if (event.key === "ArrowRight" && activeImage) {
        navigateImage("next");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, activeImage, navigateImage]);

  useEffect(() => {
    updateScrollState();
  }, [updateScrollState, visibleSessions.length]);

  const isSectionEnabled = globalContent.sections.gallery.enabled;

  const coverFor = (session: GallerySession) => {
    return session.cover?.enabled ? session.cover : emptyImage(`gallery-cover-${session.id}`);
  };

  const moveSession = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sessions.length) return;
    updateContent((draft) => {
      const list = [...draft.gallery];
      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      draft.gallery = list;
    });
  };

  const toggleSessionEnabled = (index: number) => {
    updateContent((draft) => {
      draft.gallery[index].enabled = !draft.gallery[index].enabled;
    });
  };

  const deleteSession = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć tę sesję z galerii?")) {
      updateContent((draft) => {
        draft.gallery = draft.gallery.filter((s) => s.id !== id);
      });
      if (editingSession?.id === id) setEditingSession(null);
    }
  };

  const addSession = () => {
    const newSession: GallerySession = {
      id: createId("session"),
      enabled: true,
      title: "Nowa sesja zdjęciowa",
      subtitle: "Sesja / " + new Date().getFullYear(),
      description: "Opis sesji zdjęciowej.",
      cover: emptyImage("session-cover"),
      images: []
    };
    updateContent((draft) => {
      draft.gallery.push(newSession);
    });
    setIsSectionDrawerOpen(false);
    setEditingSession(newSession); // Open editing immediately
  };

  const updateSessionField = <K extends keyof GallerySession>(field: K, value: GallerySession[K]) => {
    if (!editingSession) return;
    const nextSession = { ...editingSession, [field]: value };
    setEditingSession(nextSession);
    updateContent((draft) => {
      draft.gallery = draft.gallery.map((s) => (s.id === nextSession.id ? nextSession : s));
    });
  };

  const moveSessionImage = (index: number, direction: -1 | 1) => {
    if (!editingSession) return;
    const list = [...editingSession.images];
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= list.length) return;
    const [item] = list.splice(index, 1);
    list.splice(toIndex, 0, item);
    updateSessionField("images", list);
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!editingSession) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImageId("cover");
      const url = await uploadImageFile(file, `gallery-${editingSession.id}-cover`);
      const nextImg = { ...editingSession.cover, src: url, alt: file.name.replace(/\.[^.]+$/, "") };
      updateSessionField("cover", nextImg);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania okładki: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleMultipleImagesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!editingSession) return;
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImageId("multi");
      const uploaded: SiteImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const src = await uploadImageFile(file, `gallery-${editingSession.id}`);
        uploaded.push({
          id: createId("gal-img"),
          enabled: true,
          src,
          alt: file.name.replace(/\.[^.]+$/, ""),
          title: "",
          description: "",
          aspect: "portrait"
        });
      }
      updateSessionField("images", [...editingSession.images, ...uploaded]);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania zdjęć: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
    }
  };

  const removeSessionImage = (imageId: string) => {
    if (!editingSession) return;
    const nextImages = editingSession.images.filter((img) => img.id !== imageId);
    updateSessionField("images", nextImages);
  };

  const toggleImageEnabled = (imgIndex: number) => {
    if (!editingSession) return;
    const list = [...editingSession.images];
    list[imgIndex].enabled = !list[imgIndex].enabled;
    updateSessionField("images", list);
  };

  const aspectClass = (image: SiteImage) => {
    if (image.aspect === "landscape") return "aspect-[4/3]";
    if (image.aspect === "square") return "aspect-square";
    if (image.aspect === "wide") return "aspect-video";
    return "aspect-[3/4]";
  };

  const goTo = (direction: "next" | "prev") => {
    if (sessions.length <= 1) return;
    let nextIdx = (activeIndex ?? 0) + (direction === "next" ? 1 : -1);
    if (nextIdx >= sessions.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = sessions.length - 1;
    setSessionDirection(direction === "next" ? 1 : -1);
    setActiveIndex(nextIdx);
    setActiveImage(null);
  };

  // Mobile Swipe events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;
    if (Math.abs(diff) > 60) {
      navigateImage(diff > 0 ? "next" : "prev");
    }
    touchStart.current = null;
  };

  return (
    <SectionReveal
      id="gallery"
      reveal={false}
      className={cn(
        "relative bg-porcelain py-24 transition-all duration-300 group/section",
        editMode && "hover:ring-1 hover:ring-ink/20",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Control overlay for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-2">
          {/* Section Visibility Toggle */}
          <div className="flex items-center gap-3 bg-white border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/65">
              Sekcja Galeria (Sesje zdjęciowe)
            </span>
            <button
              type="button"
              onClick={() =>
                updateContent((draft) => {
                  draft.sections.gallery.enabled = !draft.sections.gallery.enabled;
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
            onClick={() => setIsSectionDrawerOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/70 hover:border-ink hover:text-ink shadow-sm transition-all"
          >
            <Edit className="h-3.5 w-3.5" />
            Edytuj
          </button>
        </div>
      )}

      <div className="section-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end w-full">
          <SectionHeading
            eyebrow={globalContent.sections.gallery.eyebrow ?? "galeria"}
            title={globalContent.sections.gallery.title ?? "Sesje zdjęciowe"}
          />
          <RevealBlock delay={0.14} x={24} y={18}>
            <p className="max-w-sm text-sm leading-7 text-ink/55">
              {globalContent.sections.gallery.description ?? "Editorialowe portrety, kadry i fragmenty pracy przed obiektywem."}
            </p>
          </RevealBlock>
        </div>

        <div className="relative mt-12">
          {visibleSessions.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden md:block">
              <AnimatePresence initial={false}>
                {canScrollPrev && (
                  <motion.div
                    key="gallery-prev"
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
                      aria-label="Przewiń galerię w lewo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {canScrollNext && (
                  <motion.div
                    key="gallery-next"
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
                      aria-label="Przewiń galerię w prawo"
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
              "no-scrollbar grid auto-cols-[84%] grid-flow-col gap-5 overflow-x-auto pt-12 pb-20 -mt-12 -mb-16 select-none [scroll-snap-type:x_mandatory] [touch-action:pan-y] sm:auto-cols-[52%] lg:auto-cols-[36%]",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            {visibleSessions.map((session, index) => {
              const cover = coverFor(session);

              return (
                <div key={session.id} className="relative group scroll-ml-4 [scroll-snap-align:start]">
                  <motion.button
                    type="button"
                    className={cn(
                      "w-full group grid min-h-[520px] border border-ink/10 bg-white text-left shadow-[0_18px_60px_rgba(16,16,16,0.04)] rounded-2xl",
                      !session.enabled && "opacity-50 border-dashed"
                    )}
                    onClick={() => {
                      if (shouldIgnoreRailClick()) {
                        return;
                      }

                      setSessionDirection(1);
                      setActiveIndex(index);
                    }}
                    aria-label={`Otwórz sesję ${session.title}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ delay: index * 0.08, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={editMode ? {} : { y: -8 }}
                  >
                    <CinematicImage
                      src={cover.src}
                      alt={cover.alt}
                      className={cn(
                        "min-h-[390px] w-full rounded-t-2xl",
                        index % 2 === 0 ? "aspect-[4/5]" : "aspect-[5/4]"
                      )}
                    />
                    <div className="p-6 w-full flex flex-col justify-between">
                      <div>
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
                      </div>
                      {!editMode && (
                        <span className="mt-6 inline-flex border-b border-ink pb-1 text-xs font-bold uppercase tracking-[0.18em] text-ink w-fit">
                          {globalContent.sections.gallery.actionLabel ?? "Otwórz sesję"}
                        </span>
                      )}
                      {!session.enabled && (
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

      {/* Section Settings Drawer */}
      <AdminDrawer
        isOpen={isSectionDrawerOpen}
        onClose={() => setIsSectionDrawerOpen(false)}
        title="Sekcja Galeria"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="gallery-menu-label">Nazwa w menu</Label>
            <Input
              id="gallery-menu-label"
              value={globalContent.sections.gallery.label ?? "Galeria"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.gallery.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="gallery-eyebrow">Eyebrow (nadnagłówek)</Label>
            <Input
              id="gallery-eyebrow"
              value={globalContent.sections.gallery.eyebrow ?? "galeria"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.gallery.eyebrow = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="gallery-title">Tytuł sekcji</Label>
            <Input
              id="gallery-title"
              value={globalContent.sections.gallery.title ?? "Sesje zdjęciowe"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.gallery.title = e.target.value;
                })
              }
              className="rounded-xl font-serif text-lg"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="gallery-description">Wprowadzenie</Label>
            <Textarea
              id="gallery-description"
              value={globalContent.sections.gallery.description ?? "Editorialowe portrety, kadry i fragmenty pracy przed obiektywem."}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.gallery.description = e.target.value;
                })
              }
              rows={3}
              className="rounded-xl text-sm"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="gallery-action-label">Etykieta przycisku karty</Label>
            <Input
              id="gallery-action-label"
              value={globalContent.sections.gallery.actionLabel ?? "Otwórz sesję"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.gallery.actionLabel = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          {/* List of sessions in drawer */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Lista sesji ({sessions.length})
              </Label>
              <Button variant="outline" size="sm" onClick={addSession} className="h-8 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" /> Dodaj sesję
              </Button>
            </div>

            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {sessions.map((session, idx) => (
                <motion.div
                  layout
                  key={session.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-ink/10 bg-white p-2.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="truncate">
                    <p className="text-[0.62rem] font-bold uppercase text-ink/40 truncate">{session.subtitle}</p>
                    <p className="text-xs font-serif font-bold text-ink truncate">{session.title}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSession(idx, idx - 1)}
                      disabled={idx === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSession(idx, idx + 1)}
                      disabled={idx === sessions.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSessionEnabled(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                    >
                      {session.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSectionDrawerOpen(false);
                        setEditingSession(session);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white hover:bg-graphite"
                      title="Edytuj szczegóły"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSession(session.id)}
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

      {/* Individual Session Edit Drawer */}
      <AdminDrawer
        isOpen={editingSession !== null}
        onClose={() => {
          setEditingSession(null);
          setIsSectionDrawerOpen(true); // Return to section list
        }}
        title={`Sesja: ${editingSession?.title || ""}`}
      >
        {editingSession && (
          <div className="grid gap-5">
            <div className="grid gap-1">
              <Label>Tytuł sesji</Label>
              <Input
                value={editingSession.title}
                onChange={(e) => updateSessionField("title", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-1">
              <Label>Podtytuł (np. Sesja studyjna / 2026)</Label>
              <Input
                value={editingSession.subtitle}
                onChange={(e) => updateSessionField("subtitle", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-1">
              <Label>Opis sesji (w modalu)</Label>
              <Textarea
                value={editingSession.description ?? ""}
                onChange={(e) => updateSessionField("description", e.target.value)}
                rows={3}
                className="rounded-xl text-sm"
              />
            </div>

            {/* Cover Image field */}
            <div className="grid gap-3 p-4 border border-ink/10 rounded-2xl bg-white">
              <Label className="text-xs font-bold uppercase tracking-[0.15em] text-ink/40">
                Okładka sesji zdjęciowej
              </Label>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <div className="aspect-[4/5] overflow-hidden border border-ink/10 bg-porcelain rounded-lg">
                  <img
                    src={editingSession.cover.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 hover:border-ink hover:text-ink transition-colors">
                    {uploadingImageId === "cover" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Wyślij plik
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleCoverUpload}
                      disabled={uploadingImageId !== null}
                    />
                  </label>
                  <span className="text-[0.6rem] text-ink/40">Zalecany pion (aspect ratio 4:5)</span>
                </div>
              </div>
            </div>

            {/* Session Photos */}
            <div className="grid gap-4 p-4 border border-ink/10 rounded-2xl bg-white mt-2">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <Label className="text-xs font-bold uppercase tracking-[0.15em] text-ink/40">
                  Zdjęcia w sesji ({editingSession.images.length})
                </Label>
                <label className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-xs font-bold uppercase tracking-[0.08em] text-ink/60 hover:text-ink transition-colors">
                  {uploadingImageId === "multi" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Dodaj zdjęcia
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleMultipleImagesUpload}
                    disabled={uploadingImageId !== null}
                  />
                </label>
              </div>

              <div className="grid gap-3">
                <AnimatePresence initial={false}>
                  {editingSession.images.map((img, idx) => (
                  <motion.div
                    layout
                    key={img.id}
                    className="grid grid-cols-[70px_1fr_auto] items-center gap-3 rounded-xl border border-ink/5 bg-porcelain/60 p-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <div className="aspect-[3/4] overflow-hidden border border-ink/10 bg-white rounded-lg">
                      <img src={img.src} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="grid gap-1">
                      <input
                        type="text"
                        placeholder="Tytuł / podpis..."
                        value={img.title ?? ""}
                        onChange={(e) => {
                          const updated = editingSession.images.map((image, i) =>
                            i === idx ? { ...image, title: e.target.value } : image
                          );
                          updateSessionField("images", updated);
                        }}
                        className="w-full bg-white border border-ink/10 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-ink"
                      />
                      <select
                        value={img.aspect ?? "portrait"}
                        onChange={(e) => {
                          const updated = editingSession.images.map((image, i) =>
                            i === idx
                              ? { ...image, aspect: e.target.value as NonNullable<SiteImage["aspect"]> }
                              : image
                          );
                          updateSessionField("images", updated);
                        }}
                        className="w-full bg-white border border-ink/10 rounded-full px-2 py-0.5 text-[0.62rem] text-ink focus:outline-none"
                      >
                        <option value="portrait">Pion (3:4)</option>
                        <option value="landscape">Poziom (4:3)</option>
                        <option value="square">Kwadrat (1:1)</option>
                        <option value="wide">Szeroki (16:9)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => moveSessionImage(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSessionImage(idx, 1)}
                        disabled={idx === editingSession.images.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleImageEnabled(idx)}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                      >
                        {img.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSessionImage(img.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </AdminDrawer>

      {/* Gallery Session Modal */}
      <ModalPortal>
        <AnimatePresence>
          {activeSession && (
            <motion.div
              className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-porcelain text-ink"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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
                      <h2 className="font-serif text-4xl leading-none sm:text-6xl text-ink">
                        {activeSession.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => goTo("prev")}
                        aria-label="Poprzednia sesja"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => goTo("next")}
                        aria-label="Następna sesja"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
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
                  <p className="mb-8 max-w-3xl px-4 text-lg leading-8 text-graphite/70 sm:px-6 whitespace-pre-wrap">
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
                    {visibleImages.map((image) => (
                      <figure
                        key={image.id}
                        className="mb-5 break-inside-avoid overflow-hidden border border-ink/10 bg-white rounded-2xl shadow-sm"
                      >
                        <motion.button
                          type="button"
                          layoutId={`session-image-${image.id}`}
                          className="block w-full text-left cursor-zoom-in"
                          onClick={() => setActiveImage(image)}
                          aria-label={`Powiększ zdjęcie ${image.title ?? image.alt}`}
                        >
                          <CinematicImage
                            src={image.src}
                            alt={image.alt}
                            className={cn("w-full", aspectClass(image))}
                            imageClassName="rounded-2xl"
                          />
                        </motion.button>
                        {(image.title || image.description) && (
                          <figcaption className="px-4 py-4 border-t border-ink/5">
                            {image.title && (
                              <p className="font-serif text-2xl leading-none text-ink">{image.title}</p>
                            )}
                            {image.description && (
                              <p className="mt-2 text-sm leading-6 text-ink/55">
                                {image.description}
                              </p>
                            )}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>

      {/* Full Screen Image Modal */}
      <ModalPortal>
        <AnimatePresence>
          {activeImage && (
            <motion.div
              className="fixed inset-0 z-[100] flex flex-col bg-ink/95 text-white select-none touch-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-white/5">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/55">
                  Zdjęcie {currentImageIndex + 1} z {visibleImages.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 rounded-full"
                    onClick={() => navigateImage("prev")}
                    aria-label="Poprzednie zdjęcie"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 rounded-full"
                    onClick={() => navigateImage("next")}
                    aria-label="Następne zdjęcie"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 rounded-full"
                    onClick={() => setActiveImage(null)}
                    aria-label="Zamknij podgląd"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-4 relative" ref={modalImageRef}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="max-h-[82vh] max-w-full flex flex-col items-center"
                  >
                    <img
                      src={activeImage.src}
                      alt={activeImage.alt}
                      className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/5"
                    />
                    {activeImage.title && (
                      <p className="mt-4 font-serif text-2xl text-white/90 text-center">{activeImage.title}</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
