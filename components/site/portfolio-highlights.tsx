"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Edit, Upload, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioProject, SiteImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FilmwebMark } from "@/components/site/brand-icons";
import { CinematicCardFrame } from "@/components/site/cinematic-card-frame";
import { CinematicImage } from "@/components/site/cinematic-image";
import { ModalPortal } from "@/components/site/modal-portal";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";
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

const linkLabelOptions = [
  "Filmweb",
  "Strona teatru",
  "IMDb",
  "YouTube",
  "Vimeo",
  "Instagram",
  "Bilety",
  "Oficjalna strona",
  "Zobacz więcej"
];

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

function isFilmwebLink(label?: string, url?: string) {
  return `${label ?? ""} ${url ?? ""}`.toLowerCase().includes("filmweb");
}

export function PortfolioHighlights({ projects: initialProjects, bgClass }: { projects: PortfolioProject[]; bgClass?: string }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const projects = editMode ? globalContent.portfolio : initialProjects;
  const visibleProjects = projects.filter((project) => editMode || project.enabled);

  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
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

  useBodyScrollLock(activeProject !== null);

  useEffect(() => {
    if (!activeProject) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveProject(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeProject]);

  useEffect(() => {
    updateScrollState();
  }, [updateScrollState, visibleProjects.length]);

  const isSectionEnabled = globalContent.sections.portfolio.enabled;

  // Reordering projects
  const moveProject = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= projects.length) return;
    updateContent((draft) => {
      const list = [...draft.portfolio];
      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      draft.portfolio = list;
    });
  };

  // Toggling section or item visibility
  const toggleProjectEnabled = (index: number) => {
    updateContent((draft) => {
      draft.portfolio[index].enabled = !draft.portfolio[index].enabled;
    });
  };

  // Deleting project
  const deleteProject = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten projekt?")) {
      updateContent((draft) => {
        draft.portfolio = draft.portfolio.filter((p) => p.id !== id);
      });
      if (editingProject?.id === id) setEditingProject(null);
    }
  };

  // Adding project
  const addProject = () => {
    const newProj: PortfolioProject = {
      id: createId("project"),
      enabled: true,
      title: "Nowy projekt",
      type: "Film fabularny",
      role: "Rola główna",
      year: new Date().getFullYear().toString(),
      description: "Krótki opis roli i produkcji.",
      details: "Dłuższy, szczegółowy opis postaci i kulisów pracy.",
      linkLabel: "Filmweb",
      linkUrl: "https://filmweb.pl",
      image: emptyImage("project-image"),
      images: []
    };
    updateContent((draft) => {
      draft.portfolio.push(newProj);
    });
    setIsSectionDrawerOpen(false);
    setEditingProject(newProj); // Open editing immediately
  };

  // Update specific fields of editing project
  const updateProjectField = <K extends keyof PortfolioProject>(field: K, value: PortfolioProject[K]) => {
    if (!editingProject) return;
    const nextProj = { ...editingProject, [field]: value };
    setEditingProject(nextProj);
    updateContent((draft) => {
      draft.portfolio = draft.portfolio.map((p) => (p.id === nextProj.id ? nextProj : p));
    });
  };

  // Reorder detail image inside project
  const moveDetailImage = (index: number, direction: -1 | 1) => {
    if (!editingProject) return;
    const nextImages = [...(editingProject.images ?? [])];
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= nextImages.length) return;
    const [item] = nextImages.splice(index, 1);
    nextImages.splice(toIndex, 0, item);
    updateProjectField("images", nextImages);
  };

  // Handle uploading main project cover image
  const handleMainImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!editingProject) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImageId("main");
      const url = await uploadImageFile(file, `portfolio-${editingProject.id}`);
      const nextImg = { ...editingProject.image, src: url, alt: file.name.replace(/\.[^.]+$/, "") };
      updateProjectField("image", nextImg);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania obrazu głównego: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
    }
  };

  // Add additional image placeholder to project
  const addDetailImage = () => {
    if (!editingProject) return;
    const nextImages = [...(editingProject.images ?? []), emptyImage("project-detail-image")];
    updateProjectField("images", nextImages);
  };

  // Remove additional image from project
  const removeDetailImage = (imageId: string) => {
    if (!editingProject) return;
    const nextImages = (editingProject.images ?? []).filter((img) => img.id !== imageId);
    updateProjectField("images", nextImages);
  };

  // Handle uploading additional project image
  const handleDetailImageUpload = async (event: ChangeEvent<HTMLInputElement>, imgIndex: number) => {
    if (!editingProject) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageItem = (editingProject.images ?? [])[imgIndex];
      setUploadingImageId(imageItem.id);
      const url = await uploadImageFile(file, `portfolio-${editingProject.id}-details`);
      const updatedImages = (editingProject.images ?? []).map((img, idx) =>
        idx === imgIndex ? { ...img, src: url, alt: file.name.replace(/\.[^.]+$/, "") } : img
      );
      updateProjectField("images", updatedImages);
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania kadru: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingImageId(null);
    }
  };

  return (
    <SectionReveal
      id="work"
      reveal={false}
      className={cn(
        "relative py-24 transition-all duration-300 group/section",
        bgClass || "bg-porcelain",
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
              Sekcja Portfolio (Wybrane role)
            </span>
            <button
              type="button"
              onClick={() =>
                updateContent((draft) => {
                  draft.sections.portfolio.enabled = !draft.sections.portfolio.enabled;
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
            eyebrow={globalContent.sections.portfolio.eyebrow ?? "portfolio"}
            title={globalContent.sections.portfolio.title ?? "Wybrane role"}
          />
        </div>

        <div className="relative mt-12">
          {visibleProjects.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden md:block">
              <AnimatePresence initial={false}>
                {canScrollPrev && (
                  <motion.div
                    key="portfolio-prev"
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
                      aria-label="Przewiń portfolio w lewo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {canScrollNext && (
                  <motion.div
                    key="portfolio-next"
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
                      aria-label="Przewiń portfolio w prawo"
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
              "no-scrollbar grid auto-cols-[84%] grid-flow-col gap-5 overflow-x-auto pt-12 pb-20 -mt-12 -mb-16 select-none [scroll-snap-type:x_proximity] [touch-action:pan-y] sm:auto-cols-[52%] lg:auto-cols-[36%]",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            {visibleProjects.map((project, index) => (
              <div key={project.id} className="relative group scroll-ml-4 [scroll-snap-align:start]">
                <motion.button
                  type="button"
                  data-cursor="view"
                  className={cn(
                    "cinematic-card w-full group border border-ink/10 bg-white text-left rounded-2xl flex flex-col h-full",
                    !project.enabled && "opacity-50 border-dashed"
                  )}
                  onClick={(event) => {
                    if (shouldIgnoreRailClick()) {
                      event.preventDefault();
                      return;
                    }

                    setActiveProject(project);
                  }}
                  aria-label={`Czytaj więcej o roli ${project.title}`}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ delay: index * 0.08, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={editMode ? {} : { y: -10 }}
                >
                  {(project.image.src && project.image.enabled !== false) && (
                    <div className="relative">
                      <CinematicImage
                        src={project.image.src}
                        alt={project.image.alt}
                        className="aspect-[3/4] rounded-t-2xl w-full"
                      />
                      <CinematicCardFrame />
                    </div>
                  )}
                  <div className="relative overflow-hidden p-6 flex-1 flex flex-col justify-between w-full">
                    <div className="absolute inset-x-6 top-0 h-px bg-ink/10" />
                    <div>
                      <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/45">
                        {project.type} / {project.role}
                      </p>
                      <h3 className="cinematic-heading-line mt-4 font-serif text-3xl leading-none text-ink">
                        {project.title}
                      </h3>
                      <div className="mt-5 grid min-h-[4.5rem] grid-cols-[1fr_auto] items-start gap-4 text-sm text-ink/55">
                        <span className="line-clamp-3 leading-6">{project.description}</span>
                        <span className="inline-flex h-8 w-14 shrink-0 items-center justify-center rounded-full border border-ink/10 text-xs font-semibold tabular-nums text-ink/55">
                          {project.year}
                        </span>
                      </div>
                      {!editMode && (
                        <span className="mt-6 inline-flex border-b border-ink pb-1 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                          {globalContent.sections.portfolio.actionLabel ?? "Czytaj więcej"}
                        </span>
                      )}
                      {!project.enabled && (
                        <span className="mt-4 inline-flex items-center gap-1 rounded bg-ink/5 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/40 w-fit">
                          Ukryty
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section Settings Drawer */}
      <AdminDrawer
        isOpen={isSectionDrawerOpen}
        onClose={() => setIsSectionDrawerOpen(false)}
        title="Sekcja Portfolio"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="portfolio-menu-label">Nazwa w menu</Label>
            <Input
              id="portfolio-menu-label"
              value={globalContent.sections.portfolio.label ?? "Role"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.portfolio.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="portfolio-eyebrow">Eyebrow (nadnagłówek)</Label>
            <Input
              id="portfolio-eyebrow"
              value={globalContent.sections.portfolio.eyebrow ?? "portfolio"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.portfolio.eyebrow = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="portfolio-title">Tytuł sekcji</Label>
            <Input
              id="portfolio-title"
              value={globalContent.sections.portfolio.title ?? "Wybrane role"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.portfolio.title = e.target.value;
                })
              }
              className="rounded-xl font-serif text-lg"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="portfolio-action-label">Etykieta przycisku karty</Label>
            <Input
              id="portfolio-action-label"
              value={globalContent.sections.portfolio.actionLabel ?? "Czytaj więcej"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.portfolio.actionLabel = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          {/* List of projects in drawer */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Lista projektów ({projects.length})
              </Label>
              <Button variant="outline" size="sm" onClick={addProject} className="h-8 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" /> Dodaj projekt
              </Button>
            </div>

            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {projects.map((project, idx) => (
                <motion.div
                  layout
                  key={project.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-ink/10 bg-white p-2.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="truncate">
                    <p className="text-[0.62rem] font-bold uppercase text-ink/40 truncate">{project.type} ({project.year})</p>
                    <p className="text-xs font-serif font-bold text-ink truncate">{project.title}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => moveProject(idx, idx - 1)}
                      disabled={idx === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProject(idx, idx + 1)}
                      disabled={idx === projects.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProjectEnabled(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                    >
                      {project.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSectionDrawerOpen(false);
                        setEditingProject(project);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white hover:bg-graphite"
                      title="Edytuj szczegóły"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
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

      {/* Individual Project Edit Drawer */}
      <AdminDrawer
        isOpen={editingProject !== null}
        onClose={() => {
          setEditingProject(null);
          setIsSectionDrawerOpen(true); // Return to section list
        }}
        title={`Projekt: ${editingProject?.title || ""}`}
      >
        {editingProject && (
          <div className="grid gap-5">
            <div className="grid gap-1">
              <Label>Tytuł projektu</Label>
              <Input
                value={editingProject.title}
                onChange={(e) => updateProjectField("title", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-1">
              <Label>Typ (np. Film fabularny, Serial TV)</Label>
              <Input
                value={editingProject.type}
                onChange={(e) => updateProjectField("type", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Rola (np. Rola główna)</Label>
                <Input
                  value={editingProject.role}
                  onChange={(e) => updateProjectField("role", e.target.value)}
                  className="rounded-full text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label>Rok produkcji</Label>
                <Input
                  value={editingProject.year}
                  onChange={(e) => updateProjectField("year", e.target.value)}
                  className="rounded-full text-xs"
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Krótki opis (na karcie)</Label>
              <Textarea
                value={editingProject.description}
                onChange={(e) => updateProjectField("description", e.target.value)}
                rows={2}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid gap-1">
              <Label>Szczegóły roli (w modalu)</Label>
              <Textarea
                value={editingProject.details || ""}
                onChange={(e) => updateProjectField("details", e.target.value)}
                rows={4}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label htmlFor="portfolio-link-label">Typ linku</Label>
                <select
                  id="portfolio-link-label"
                  value={editingProject.linkLabel || "Zobacz więcej"}
                  onChange={(e) => updateProjectField("linkLabel", e.target.value)}
                  className="h-11 rounded-full border border-ink/15 bg-white/70 px-3 text-xs text-ink outline-none transition-colors focus:border-ink"
                >
                  {linkLabelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label>Adres URL linku</Label>
                <Input
                  value={editingProject.linkUrl || ""}
                  onChange={(e) => updateProjectField("linkUrl", e.target.value)}
                  className="rounded-full text-xs"
                />
              </div>
            </div>

            {/* Main Image field */}
            <div className="grid gap-3 p-4 border border-ink/10 rounded-2xl bg-white">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Główna miniatura projektu
              </Label>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <div className="aspect-[3/4] overflow-hidden border border-ink/10 bg-porcelain rounded-lg">
                  <img
                    src={editingProject.image.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 hover:border-ink hover:text-ink transition-colors">
                    {uploadingImageId === "main" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Wyślij plik
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleMainImageUpload}
                      disabled={uploadingImageId !== null}
                    />
                  </label>
                  <span className="text-[0.6rem] text-ink/40">Zalecany pion (aspect ratio 3:4)</span>
                </div>
              </div>
            </div>

            {/* Additional Project Photos */}
            <div className="grid gap-4 p-4 border border-ink/10 rounded-2xl bg-white mt-2">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                  Dodatkowe kadry (w modalu)
                </Label>
                <Button variant="outline" size="sm" onClick={addDetailImage} className="h-8 rounded-full text-xs">
                  <Plus className="h-3.5 w-3.5" /> Dodaj kadr
                </Button>
              </div>

              <div className="grid gap-3">
                <AnimatePresence initial={false}>
                  {(editingProject.images ?? []).map((img, idx) => (
                  <motion.div
                    layout
                    key={img.id}
                    className="grid grid-cols-[80px_1fr_auto] items-center gap-3 rounded-xl border border-ink/5 bg-porcelain/60 p-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <div className="aspect-[4/3] overflow-hidden border border-ink/10 bg-white rounded-lg">
                      <img src={img.src} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="grid gap-1.5">
                      <input
                        type="text"
                        placeholder="Tytuł kadru..."
                        value={img.title ?? ""}
                        onChange={(e) => {
                          const updated = (editingProject.images ?? []).map((image, i) =>
                            i === idx ? { ...image, title: e.target.value } : image
                          );
                          updateProjectField("images", updated);
                        }}
                        className="w-full bg-white border border-ink/10 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-ink"
                      />
                      <label className="inline-flex h-7 w-fit cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink/50 hover:text-ink transition-colors">
                        {uploadingImageId === img.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        Zmień
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleDetailImageUpload(e, idx)}
                          disabled={uploadingImageId !== null}
                        />
                      </label>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => moveDetailImage(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDetailImage(idx, 1)}
                        disabled={idx === (editingProject.images ?? []).length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDetailImage(img.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 mt-1 transition-colors"
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

      {/* Main Details Modal */}
      <ModalPortal>
        <AnimatePresence>
          {activeProject && (
            <motion.div
              className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-porcelain text-ink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                className="mx-auto max-w-6xl rounded-3xl bg-porcelain my-8 border border-ink/10 shadow-editorial relative overflow-hidden"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.66),transparent)]" aria-hidden="true" />
                <div className="rounded-3xl overflow-hidden bg-porcelain">
                  <div className="sticky top-0 z-20 mb-8 border-b border-ink/10 bg-porcelain px-4 py-4 shadow-[0_16px_50px_rgba(16,16,16,0.04)] sm:px-6">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
                          {activeProject.type} / {activeProject.role} / {activeProject.year}
                        </p>
                        <h2 className="font-serif text-4xl leading-none sm:text-6xl text-ink">
                          {activeProject.title}
                        </h2>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setActiveProject(null)}
                        aria-label="Zamknij szczegóły roli"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-8 px-6 pb-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr]">
                  {(activeProject.image.src && activeProject.image.enabled !== false) && (
                      <CinematicImage
                        src={activeProject.image.src}
                        alt={activeProject.image.alt}
                        className="aspect-[4/5] border border-ink/10 rounded-2xl overflow-hidden"
                      />
                    )}

                    <div className="flex flex-col justify-center">
                      <p className="font-serif text-3xl leading-tight text-graphite sm:text-4xl">
                        {activeProject.description}
                      </p>
                      {activeProject.details && (
                        <p className="mt-7 text-lg leading-8 text-graphite/70 whitespace-pre-wrap">
                          {activeProject.details}
                        </p>
                      )}
                      {activeProject.linkUrl && (
                        <Button
                          asChild
                          className="group mt-8 h-auto w-fit rounded-full border border-ink bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:!bg-ink hover:!text-white"
                        >
                          <a
                            href={activeProject.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {isFilmwebLink(activeProject.linkLabel, activeProject.linkUrl) && (
                              <FilmwebMark className="mr-1 h-4 w-4" />
                            )}
                            <span>{activeProject.linkLabel || "Zobacz więcej"}</span>
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {(activeProject.images ?? []).filter((image) => image.enabled).length > 0 && (
                    <div className="mt-10 border-t border-ink/10 pt-10 grid gap-5 px-6 pb-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
                      {(activeProject.images ?? [])
                        .filter((image) => image.enabled)
                        .map((image) => (
                          <figure key={image.id} className="border border-ink/10 bg-white rounded-2xl overflow-hidden shadow-sm">
                            <CinematicImage
                              src={image.src}
                              alt={image.alt}
                              className={cn(
                                "w-full",
                                image.aspect === "wide"
                                  ? "aspect-video"
                                  : image.aspect === "square"
                                  ? "aspect-square"
                                  : "aspect-[4/5]"
                              )}
                            />
                            {(image.title || image.description) && (
                              <figcaption className="p-4 border-t border-ink/5">
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
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
