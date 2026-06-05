"use client";

import { useCallback, useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Edit, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import type { GallerySession, SiteImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { ModalPortal } from "@/components/site/modal-portal";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { uploadImageFile } from "@/lib/firebase/content";
import { createId, cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const aspectOptions: Array<{ value: NonNullable<SiteImage["aspect"]>; label: string }> = [
  { value: "portrait", label: "Pion" },
  { value: "landscape", label: "Poziom" },
  { value: "square", label: "Kwadrat" },
  { value: "wide", label: "Panorama" }
];

function aspectClass(image: SiteImage) {
  switch (image.aspect) {
    case "landscape":
      return "aspect-[5/3]";
    case "square":
      return "aspect-square";
    case "wide":
      return "aspect-[16/9]";
    case "portrait":
    default:
      return "aspect-[4/5]";
  }
}

function coverFor(session: GallerySession) {
  if (session.cover.enabled) {
    return session.cover;
  }
  return session.images.find((image) => image.enabled) ?? session.cover;
}

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

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<SiteImage | null>(null);
  const [sessionDirection, setSessionDirection] = useState(1);
  const [editingSession, setEditingSession] = useState<GallerySession | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const railRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const activeSession = activeIndex === null ? null : sessions[activeIndex];
  const visibleImages = useMemo(
    () => activeSession?.images.filter((image) => image.enabled) ?? [],
    [activeSession]
  );

  const activeImageIndex = useMemo(() => {
    if (!activeImage || visibleImages.length === 0) return -1;
    return visibleImages.findIndex((img) => img.id === activeImage.id);
  }, [activeImage, visibleImages]);

  const navigateImage = useCallback(
    (direction: "next" | "prev") => {
      if (activeImageIndex === -1 || visibleImages.length === 0) return;
      let nextIndex = activeImageIndex;
      if (direction === "next") {
        nextIndex = (activeImageIndex + 1) % visibleImages.length;
      } else {
        nextIndex = (activeImageIndex - 1 + visibleImages.length) % visibleImages.length;
      }
      setActiveImage(visibleImages[nextIndex]);
    },
    [activeImageIndex, visibleImages]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diffX = touchStartRef.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        navigateImage("next");
      } else {
        navigateImage("prev");
      }
    }
    touchStartRef.current = null;
  };

  const goTo = useCallback(
    (direction: "next" | "prev") => {
      if (activeIndex === null || sessions.length === 0) {
        return;
      }

      setSessionDirection(direction === "next" ? 1 : -1);
      setActiveImage(null);
      setActiveIndex((current) => {
        if (current === null) {
          return current;
        }

        return direction === "next"
          ? (current + 1) % sessions.length
          : (current - 1 + sessions.length) % sessions.length;
      });
    },
    [activeIndex, sessions.length]
  );

  const handleRailWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!railRef.current || Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    railRef.current.scrollBy({ left: event.deltaY, behavior: "smooth" });
  };

  const scrollRail = (direction: -1 | 1) => {
    railRef.current?.scrollBy({
      left: direction * (railRef.current.clientWidth * 0.82),
      behavior: "smooth"
    });
  };

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeImage) {
          setActiveImage(null);
        } else {
          setActiveIndex(null);
        }
      }

      if (event.key === "ArrowRight") {
        if (activeImage) {
          navigateImage("next");
        } else {
          goTo("next");
        }
      }

      if (event.key === "ArrowLeft") {
        if (activeImage) {
          navigateImage("prev");
        } else {
          goTo("prev");
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeImage, activeIndex, goTo, navigateImage]);

  const isSectionEnabled = globalContent.sections.gallery.enabled;

  // Reordering sessions
  const moveSession = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sessions.length) return;
    updateContent((draft) => {
      const list = [...draft.gallery];
      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      draft.gallery = list;
    });
  };

  // Toggle Visibility
  const toggleSessionEnabled = (index: number) => {
    updateContent((draft) => {
      draft.gallery[index].enabled = !draft.gallery[index].enabled;
    });
  };

  // Delete Session
  const deleteSession = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć tę sesję zdjęciową?")) {
      updateContent((draft) => {
        draft.gallery = draft.gallery.filter((s) => s.id !== id);
      });
      if (editingSession?.id === id) setEditingSession(null);
    }
  };

  // Add Session
  const addSession = () => {
    const id = createId("session");
    const newSession: GallerySession = {
      id,
      enabled: true,
      title: "Nowa sesja",
      subtitle: "Sesja zdjęciowa / nowa",
      description: "Opcjonalny opis sesji.",
      cover: emptyImage(`${id}-cover`),
      images: []
    };
    updateContent((draft) => {
      draft.gallery.push(newSession);
    });
    setEditingSession(newSession);
  };

  // Update specific fields of editing session
  const updateSessionField = (field: keyof GallerySession, value: any) => {
    if (!editingSession) return;
    const nextSession = { ...editingSession, [field]: value };
    setEditingSession(nextSession);
    updateContent((draft) => {
      draft.gallery = draft.gallery.map((s) => (s.id === nextSession.id ? nextSession : s));
    });
  };

  // Reorder image inside session
  const moveSessionImage = (index: number, direction: -1 | 1) => {
    if (!editingSession) return;
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= editingSession.images.length) return;
    const list = [...editingSession.images];
    const [item] = list.splice(index, 1);
    list.splice(toIndex, 0, item);
    updateSessionField("images", list);
  };

  // Handle uploading session cover
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

  // Add multiple uploaded images to session
  const addSessionImages = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!editingSession) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      setUploadingImageId("multiple");
      const uploaded = await Promise.all(
        files.map(async (file) => ({
          id: createId("gallery-image"),
          enabled: true,
          src: await uploadImageFile(file, `gallery-${editingSession.id}`),
          alt: file.name.replace(/\.[^.]+$/, ""),
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          aspect: "portrait" as const
        }))
      );
      updateSessionField("images", [...editingSession.images, ...uploaded]);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania zdjęć: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
      event.target.value = "";
    }
  };

  // Remove image from session
  const removeSessionImage = (imageId: string) => {
    if (!editingSession) return;
    const nextImages = editingSession.images.filter((img) => img.id !== imageId);
    updateSessionField("images", nextImages);
  };

  if (sessions.length === 0 && !editMode) {
    return null;
  }

  return (
    <SectionReveal
      id="gallery"
      className={cn(
        "relative bg-porcelain py-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-3 bg-white border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
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
      )}

      <div className="section-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end w-full">
          {editMode ? (
            <div className="grid gap-4 bg-white/70 p-4 border border-ink/10 rounded-2xl w-full">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Galeria Eyebrow (nadnagłówek):
                  </span>
                  <input
                    type="text"
                    value={globalContent.sections.gallery.eyebrow ?? "galeria"}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.sections.gallery.eyebrow = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ink focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Galeria Tytuł:
                  </span>
                  <input
                    type="text"
                    value={globalContent.sections.gallery.title ?? "Sesje zdjęciowe"}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.sections.gallery.title = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-xl px-4 py-1.5 font-serif text-lg text-ink focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                  Galeria Wprowadzenie:
                </span>
                <textarea
                  value={globalContent.sections.gallery.description ?? "Editorialowe portrety, kadry i fragmenty pracy przed obiektywem."}
                  onChange={(e) =>
                    updateContent((draft) => {
                      draft.sections.gallery.description = e.target.value;
                    })
                  }
                  rows={2}
                  className="w-full bg-white border border-ink/10 rounded-xl px-4 py-1.5 text-xs text-ink focus:outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            <>
              <SectionHeading
                eyebrow={globalContent.sections.gallery.eyebrow ?? "galeria"}
                title={globalContent.sections.gallery.title ?? "Sesje zdjęciowe"}
              />
              <p className="max-w-sm text-sm leading-7 text-ink/55">
                {globalContent.sections.gallery.description ?? "Editorialowe portrety, kadry i fragmenty pracy przed obiektywem."}
              </p>
            </>
          )}
        </div>

        <div className="relative mt-12">
          {sessions.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-2 md:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pointer-events-auto border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white rounded-full"
                onClick={() => scrollRail(-1)}
                aria-label="Przewiń galerię w lewo"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pointer-events-auto border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white rounded-full"
                onClick={() => scrollRail(1)}
                aria-label="Przewiń galerię w prawo"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div
            ref={railRef}
            className="no-scrollbar grid auto-cols-[84%] grid-flow-col gap-5 overflow-x-auto scroll-smooth pt-3 pb-7 -mt-3 [scroll-snap-type:x_mandatory] sm:auto-cols-[52%] lg:auto-cols-[36%]"
            onWheel={handleRailWheel}
          >
            {sessions.map((session, index) => {
              const cover = coverFor(session);

              return (
                <div key={session.id} className="relative group scroll-ml-4 [scroll-snap-align:start]">
                  <motion.button
                    type="button"
                    className={cn(
                      "w-full group grid min-h-[520px] border border-ink/10 bg-white text-left shadow-[0_18px_60px_rgba(16,16,16,0.04)] rounded-2xl",
                      !session.enabled && "opacity-50"
                    )}
                    onClick={() => {
                      if (!editMode) {
                        setSessionDirection(1);
                        setActiveIndex(index);
                      }
                    }}
                    aria-label={`Otwórz sesję ${session.title}`}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ delay: index * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
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
                          Otwórz sesję
                        </span>
                      )}
                      {editMode && !session.enabled && (
                        <span className="mt-4 inline-flex items-center gap-1 rounded bg-ink/5 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/40 w-fit">
                          Ukryty
                        </span>
                      )}
                    </div>
                  </motion.button>

                  {/* Admin Overlays for gallery session */}
                  {editMode && (
                    <div className="absolute top-3 right-3 z-30 flex flex-wrap gap-1 bg-white/95 border border-ink/10 p-1 rounded-full shadow-[0_4px_20px_rgba(16,16,16,0.08)] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        type="button"
                        onClick={() => moveSession(index, index - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
                        title="Przesuń wyżej"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSession(index, index + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
                        title="Przesuń niżej"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSessionEnabled(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
                        title={session.enabled ? "Ukryj" : "Pokaż"}
                      >
                        {session.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSession(session)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white hover:bg-graphite transition-colors"
                        title="Edytuj sesję"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(session.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Usuń sesję"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Session Trigger Card in edit mode */}
            {editMode && (
              <button
                type="button"
                onClick={addSession}
                className="group border-2 border-dashed border-ink/20 hover:border-ink/40 bg-ink/[0.01] hover:bg-ink/[0.03] transition-all duration-300 rounded-2xl min-w-[280px] min-h-[520px] flex flex-col items-center justify-center p-6 text-center cursor-pointer [scroll-snap-align:start]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-ink/10 text-ink/50 group-hover:scale-110 group-hover:text-ink transition-all duration-500">
                  <Plus className="h-7 w-7" />
                </span>
                <span className="mt-4 block font-serif text-2xl text-ink/70 group-hover:text-ink transition-colors">
                  Dodaj nową sesję
                </span>
                <span className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Zostanie dodana na końcu
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Edit Drawer */}
      <AdminDrawer
        isOpen={editingSession !== null}
        onClose={() => setEditingSession(null)}
        title={editingSession?.title || "Sesja zdjęciowa"}
      >
        {editingSession && (
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label>Tytuł sesji</Label>
              <Input
                value={editingSession.title}
                onChange={(e) => updateSessionField("title", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Podtytuł (np. Sesja studyjna / 2026)</Label>
              <Input
                value={editingSession.subtitle}
                onChange={(e) => updateSessionField("subtitle", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Krótki opis</Label>
              <Textarea
                value={editingSession.description ?? ""}
                onChange={(e) => updateSessionField("description", e.target.value)}
                rows={3}
                className="rounded-2xl"
              />
            </div>

            {/* Cover image field */}
            <div className="grid gap-3 p-4 border border-ink/10 rounded-2xl bg-white">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Zdjęcie okładkowe sesji
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
                    Wyślij okładkę
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleCoverUpload}
                      disabled={uploadingImageId !== null}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Gallery Images List & Multi-Upload */}
            <div className="grid gap-4 p-4 border border-ink/10 rounded-2xl bg-white mt-2">
              <div className="flex flex-col gap-2 border-b border-ink/10 pb-3">
                <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                  Zdjęcia w sesji ({editingSession.images.length})
                </Label>
                <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-ink bg-ink text-white px-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-graphite">
                  {uploadingImageId === "multiple" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Wysyłanie zdjęć...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Wyślij wiele zdjęć na raz
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={addSessionImages}
                    disabled={uploadingImageId !== null}
                  />
                </label>
              </div>

              <div className="grid gap-3">
                {editingSession.images.map((img, idx) => (
                  <div key={img.id} className="grid grid-cols-[80px_1fr_auto] gap-3 items-center bg-porcelain/60 p-2 border border-ink/5 rounded-xl">
                    <div className="aspect-square overflow-hidden border border-ink/10 bg-white rounded-lg">
                      <img src={img.src} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="grid gap-1.5">
                      <input
                        type="text"
                        placeholder="Tytuł / Podpis..."
                        value={img.title ?? ""}
                        onChange={(e) => {
                          const updated = editingSession.images.map((image, i) =>
                            i === idx ? { ...image, title: e.target.value } : image
                          );
                          updateSessionField("images", updated);
                        }}
                        className="w-full bg-white border border-ink/10 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-ink"
                      />
                      <div className="flex gap-2">
                        {/* Aspect selector */}
                        <select
                          value={img.aspect ?? "portrait"}
                          onChange={(e) => {
                            const updated = editingSession.images.map((image, i) =>
                              i === idx ? { ...image, aspect: e.target.value as any } : image
                            );
                            updateSessionField("images", updated);
                          }}
                          className="bg-white border border-ink/10 rounded-full px-2 py-0.5 text-[0.62rem] font-bold text-ink focus:outline-none"
                        >
                          {aspectOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => moveSessionImage(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                        title="Przesuń w górę"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSessionImage(idx, 1)}
                        disabled={idx === editingSession.images.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                        title="Przesuń w dół"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSessionImage(img.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 mt-1 transition-colors"
                        title="Usuń zdjęcie"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
              className="fixed inset-0 z-[90] overflow-y-auto bg-porcelain text-ink"
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
                  <p className="mb-8 max-w-3xl px-4 text-lg leading-8 text-graphite/70 sm:px-6">
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
                    {visibleImages.map((image, imageIndex) => (
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
                              <p className="font-serif text-2xl leading-none text-ink">
                                {image.title}
                              </p>
                            )}
                            {image.description && (
                              <p className="mt-2 text-sm leading-6 text-ink/55">
                                {image.description}
                              </p>
                            )}
                            <span className="mt-3 block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink/35">
                              {String(imageIndex + 1).padStart(2, "0")}
                            </span>
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Full Zoom Image Modal */}
              <AnimatePresence>
                {activeImage && (
                  <motion.div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/88 p-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveImage(null)}
                  >
                    {/* Close Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-5 top-5 z-[130] text-white hover:bg-white/10 rounded-full h-10 w-10 bg-black/20"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveImage(null);
                      }}
                      aria-label="Zamknij zdjęcie"
                    >
                      <X className="h-5 w-5" />
                    </Button>

                    {/* Left arrow navigation */}
                    <button
                      type="button"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-[120] hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10 shadow-lg cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage("prev");
                      }}
                      aria-label="Poprzednie zdjęcie"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* Right arrow navigation */}
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-[120] hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10 shadow-lg cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage("next");
                      }}
                      aria-label="Następne zdjęcie"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <motion.div
                      layoutId={`session-image-${activeImage.id}`}
                      className="max-h-[85vh] w-full max-w-5xl bg-black rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden"
                      onClick={(event) => event.stopPropagation()}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="rounded-3xl overflow-hidden bg-black flex items-center justify-center min-h-[40vh]">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.img
                            key={activeImage.id}
                            src={activeImage.src}
                            alt={activeImage.alt}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="max-h-[85vh] max-w-full object-contain rounded-3xl"
                            draggable={false}
                          />
                        </AnimatePresence>
                      </div>

                      {/* Image index counter */}
                      {activeImageIndex !== -1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/60 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/80 border border-white/5 backdrop-blur-sm">
                          {activeImageIndex + 1} / {visibleImages.length}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
