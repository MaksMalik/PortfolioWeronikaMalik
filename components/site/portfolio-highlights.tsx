"use client";

import { useEffect, useState, ChangeEvent, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Edit, Upload, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioProject, SiteImage } from "@/lib/types";
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

export function PortfolioHighlights({ projects: initialProjects }: { projects: PortfolioProject[] }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const projects = editMode ? globalContent.portfolio : initialProjects;

  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const railRef = useRef<HTMLDivElement>(null);

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
    setEditingProject(newProj); // Open editing immediately
  };

  // Update specific fields of editing project
  const updateProjectField = (field: keyof PortfolioProject, value: any) => {
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
      className={cn(
        "relative bg-porcelain py-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-3 bg-white border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
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
      )}

      <div className="section-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="portfolio" title="Wybrane role" />
        </div>

        <div className="relative mt-12">
          {projects.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-2 md:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pointer-events-auto border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white rounded-full"
                onClick={() => scrollRail(-1)}
                aria-label="Przewiń portfolio w lewo"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pointer-events-auto border-white/70 bg-porcelain/85 shadow-[0_16px_40px_rgba(16,16,16,0.08)] backdrop-blur-md hover:bg-ink hover:text-white rounded-full"
                onClick={() => scrollRail(1)}
                aria-label="Przewiń portfolio w prawo"
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
            {projects.map((project, index) => (
              <div key={project.id} className="relative group scroll-ml-4 [scroll-snap-align:start]">
                <motion.button
                  type="button"
                  className={cn(
                    "w-full group border border-ink/10 bg-white text-left transition-shadow duration-500 hover:shadow-editorial rounded-2xl flex flex-col h-full",
                    !project.enabled && "opacity-50"
                  )}
                  onClick={() => !editMode && setActiveProject(project)}
                  aria-label={`Czytaj więcej o roli ${project.title}`}
                  initial={{ opacity: 0, y: 34 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={editMode ? {} : { y: -10 }}
                >
                  {project.image.enabled && (
                    <CinematicImage
                      src={project.image.src}
                      alt={project.image.alt}
                      className="aspect-[3/4] rounded-t-2xl w-full"
                    />
                  )}
                  <div className="relative overflow-hidden p-6 flex-1 flex flex-col justify-between w-full">
                    <div className="absolute inset-x-6 top-0 h-px bg-ink/10" />
                    <div className="transition-transform duration-500 group-hover:-translate-y-1">
                      <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/45">
                        {project.type} / {project.role}
                      </p>
                      <h3 className="mt-4 font-serif text-3xl leading-none text-ink">
                        {project.title}
                      </h3>
                      <div className="mt-5 flex items-center justify-between text-sm text-ink/55">
                        <span>{project.description}</span>
                        <span className="ml-4 shrink-0 font-semibold">{project.year}</span>
                      </div>
                      {!editMode && (
                        <span className="mt-6 inline-flex border-b border-ink pb-1 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                          Czytaj więcej
                        </span>
                      )}
                      {editMode && !project.enabled && (
                        <span className="mt-4 inline-flex items-center gap-1 rounded bg-ink/5 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/40">
                          Ukryty
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>

                {/* Admin overlays for reordering, visible, editing */}
                {editMode && (
                  <div className="absolute top-3 right-3 z-30 flex flex-wrap gap-1 bg-white/95 border border-ink/10 p-1 rounded-full shadow-[0_4px_20px_rgba(16,16,16,0.08)] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={() => moveProject(index, index - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
                      title="Przesuń wyżej"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProject(index, index + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
                      title="Przesuń niżej"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProjectEnabled(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
                      title={project.enabled ? "Ukryj" : "Pokaż"}
                    >
                      {project.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProject(project)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white hover:bg-graphite transition-colors"
                      title="Edytuj szczegóły"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                      title="Usuń projekt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add Project card in edit mode */}
            {editMode && (
              <button
                type="button"
                onClick={addProject}
                className="group border-2 border-dashed border-ink/20 hover:border-ink/40 bg-ink/[0.01] hover:bg-ink/[0.03] transition-all duration-300 rounded-2xl min-h-[380px] min-w-[280px] flex flex-col items-center justify-center p-6 text-center cursor-pointer [scroll-snap-align:start]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-ink/10 text-ink/50 group-hover:scale-110 group-hover:text-ink transition-all duration-500">
                  <Plus className="h-7 w-7" />
                </span>
                <span className="mt-4 block font-serif text-2xl text-ink/70 group-hover:text-ink transition-colors">
                  Dodaj nowy projekt
                </span>
                <span className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Zostanie dodany na końcu
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Edit Drawer */}
      <AdminDrawer
        isOpen={editingProject !== null}
        onClose={() => setEditingProject(null)}
        title={editingProject?.title || "Projekt"}
      >
        {editingProject && (
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label>Tytuł projektu</Label>
              <Input
                value={editingProject.title}
                onChange={(e) => updateProjectField("title", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Typ (np. Film fabularny, Serial TV)</Label>
              <Input
                value={editingProject.type}
                onChange={(e) => updateProjectField("type", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Rola</Label>
              <Input
                value={editingProject.role}
                onChange={(e) => updateProjectField("role", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Rok</Label>
              <Input
                value={editingProject.year}
                onChange={(e) => updateProjectField("year", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Krótki opis (na kafelku)</Label>
              <Input
                value={editingProject.description}
                onChange={(e) => updateProjectField("description", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Szczegółowy opis (w modalu)</Label>
              <Textarea
                value={editingProject.details ?? ""}
                onChange={(e) => updateProjectField("details", e.target.value)}
                rows={5}
                className="rounded-2xl"
              />
            </div>

            <div className="grid gap-2">
              <Label>Nazwa linku (np. Filmweb)</Label>
              <Input
                value={editingProject.linkLabel ?? ""}
                onChange={(e) => updateProjectField("linkLabel", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label>Adres URL linku</Label>
              <Input
                value={editingProject.linkUrl ?? ""}
                onChange={(e) => updateProjectField("linkUrl", e.target.value)}
                className="rounded-full"
              />
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
                {(editingProject.images ?? []).map((img, idx) => (
                  <div key={img.id} className="grid grid-cols-[80px_1fr_auto] gap-3 items-center bg-porcelain/60 p-2 border border-ink/5 rounded-xl">
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
                        title="Przesuń w górę"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDetailImage(idx, 1)}
                        disabled={idx === (editingProject.images ?? []).length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                        title="Przesuń w dół"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDetailImage(img.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 mt-1 transition-colors"
                        title="Usuń kadr"
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

      {/* Main Details Modal */}
      <ModalPortal>
        <AnimatePresence>
          {activeProject && (
            <motion.div
              className="fixed inset-0 z-[90] overflow-y-auto bg-porcelain text-ink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                className="mx-auto max-w-6xl rounded-3xl bg-porcelain my-8 border border-ink/10 shadow-editorial relative"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
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
                  {activeProject.image.enabled && (
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
                      <p className="mt-7 text-lg leading-8 text-graphite/70">
                        {activeProject.details}
                      </p>
                    )}
                    {activeProject.linkUrl && (
                      <Button
                        asChild
                        className="mt-8 rounded-full border border-ink bg-ink text-white hover:bg-transparent hover:text-ink transition-colors font-bold uppercase tracking-[0.16em] h-auto px-6 py-3.5 text-xs w-fit"
                      >
                        <a
                          href={activeProject.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {activeProject.linkLabel || "Zobacz więcej"}
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
