"use client";

import { ChangeEvent, FormEvent, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LogOut,
  Plus,
  Rocket,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_EMAIL, firebaseAuth } from "@/lib/firebase/client";
import {
  saveSiteContent,
  subscribeSiteContent,
  uploadImageFile
} from "@/lib/firebase/content";
import { siteContent } from "@/lib/site-content";
import type {
  AboutContent,
  ContactContent,
  GallerySession,
  HeroContent,
  PortfolioProject,
  PressMention,
  ShowreelContent,
  SiteContent,
  SiteImage,
  SocialLink
} from "@/lib/types";
import { cloneContent, cn, createId } from "@/lib/utils";

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type TabId = "hero" | "about" | "portfolio" | "showreel" | "gallery" | "press" | "contact";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "hero", label: "Start" },
  { id: "about", label: "O mnie" },
  { id: "portfolio", label: "Portfolio" },
  { id: "showreel", label: "Showreel" },
  { id: "gallery", label: "Galeria" },
  { id: "press", label: "Prasa" },
  { id: "contact", label: "Kontakt" }
];

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

function ToggleField({
  label,
  checked,
  onChange,
  description,
  className
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      title={description}
      className={cn(
        "inline-flex min-h-9 w-full items-center justify-between gap-2 rounded-full border px-2.5 py-1.5 text-left transition-colors",
        checked
          ? "border-ink/15 bg-white text-ink shadow-[0_8px_24px_rgba(16,16,16,0.04)]"
          : "border-ink/10 bg-ink/[0.03] text-ink/45",
        className
      )}
    >
      <span className="min-w-0 truncate text-[0.62rem] font-bold uppercase tracking-[0.14em]">
        {label}
      </span>
      <span
        className={cn(
          "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[0.62rem] font-bold uppercase tracking-[0.1em]",
          checked ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/45"
        )}
      >
        {checked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {checked ? "Włączone" : "Wyłączone"}
      </span>
    </button>
  );
}

function AdminSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-[0_18px_60px_rgba(16,16,16,0.05)] sm:p-7">
      <div className="mb-7 flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-4xl leading-none text-ink">{title}</h2>
          {description && <p className="mt-2 text-sm leading-6 text-ink/55">{description}</p>}
        </div>
        {action && <div className="shrink-0 sm:pt-1">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 5
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

const aspectOptions: Array<{ value: NonNullable<SiteImage["aspect"]>; label: string }> = [
  { value: "portrait", label: "Pion" },
  { value: "landscape", label: "Poziom" },
  { value: "square", label: "Kwadrat" },
  { value: "wide", label: "Panorama" }
];

function AspectSelector({
  value,
  onChange
}: {
  value?: SiteImage["aspect"];
  onChange: (value: NonNullable<SiteImage["aspect"]>) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>Proporcje</Label>
      <div className="flex flex-wrap gap-2">
        {aspectOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "min-w-20 rounded-full border px-3 py-2 text-center text-[0.68rem] font-bold uppercase tracking-[0.08em] transition-colors",
              (value ?? "portrait") === option.value
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink/55 hover:border-ink hover:text-ink"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ImageField({
  label,
  image,
  onChange,
  uploadFolder,
  onUploadError,
  showTitle = false
}: {
  label: string;
  image: SiteImage;
  onChange: (image: SiteImage) => void;
  uploadFolder: string;
  onUploadError: (message: string) => void;
  showTitle?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      const src = await uploadImageFile(file, uploadFolder);
      onChange({ ...image, src, alt: image.alt || file.name.replace(/\.[^.]+$/, "") });
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : "Nie udało się wysłać obrazu.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-4 rounded-md border border-ink/10 bg-porcelain p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Label>{label}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleField
            label="Pokaż"
            checked={image.enabled}
            onChange={(enabled) => onChange({ ...image, enabled })}
            description="Wyłączony obraz zostanie ukryty na stronie publicznej."
            className="w-auto min-w-36"
          />
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-white px-3 text-xs font-bold uppercase tracking-[0.12em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? "Wysyłanie" : "Wyślij"}
            <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[150px_1fr]">
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden border border-ink/10 bg-white">
          {image.src ? (
            <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-ink/25" />
          )}
        </div>
        <div className="grid gap-4">
          <Field label="Adres obrazu" value={image.src} onChange={(src) => onChange({ ...image, src })} />
          <Field label="Tekst alternatywny" value={image.alt} onChange={(alt) => onChange({ ...image, alt })} />
          <AspectSelector
            value={image.aspect}
            onChange={(aspect) => onChange({ ...image, aspect })}
          />
          {showTitle && (
            <>
              <Field
                label="Tytuł"
                value={image.title ?? ""}
                onChange={(title) => onChange({ ...image, title })}
              />
              <AreaField
                label="Opis obrazu"
                value={image.description ?? ""}
                rows={3}
                onChange={(description) => onChange({ ...image, description })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroEditor({
  content,
  update,
  onUploadError,
  sectionAction
}: {
  content: HeroContent;
  update: (hero: HeroContent) => void;
  onUploadError: (message: string) => void;
  sectionAction?: React.ReactNode;
}) {
  return (
    <AdminSection
      title="Hero"
      description="Sekcja startowa z monogramem, nazwą, tagline i głównym portretem."
      action={sectionAction}
    >
      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Monogram" value={content.monogram} onChange={(monogram) => update({ ...content, monogram })} />
          <Field label="Imię i nazwisko" value={content.name} onChange={(name) => update({ ...content, name })} />
          <Field label="Tagline" value={content.tagline} onChange={(tagline) => update({ ...content, tagline })} />
          <Field label="Tekst przycisku" value={content.buttonText} onChange={(buttonText) => update({ ...content, buttonText })} />
        </div>
        <AreaField label="Cytat w hero" value={content.quote} onChange={(quote) => update({ ...content, quote })} />
        <ImageField
          label="Zdjęcie hero"
          image={content.image}
          uploadFolder="hero"
          onUploadError={onUploadError}
          showTitle
          onChange={(image) => update({ ...content, image })}
        />
      </div>
    </AdminSection>
  );
}

function AboutEditor({
  content,
  update,
  onUploadError,
  sectionAction
}: {
  content: AboutContent;
  update: (about: AboutContent) => void;
  onUploadError: (message: string) => void;
  sectionAction?: React.ReactNode;
}) {
  return (
    <AdminSection title="O mnie" description="Portret i opis narracyjny aktorki." action={sectionAction}>
      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Mały nagłówek" value={content.eyebrow} onChange={(eyebrow) => update({ ...content, eyebrow })} />
          <Field label="Tytuł" value={content.title} onChange={(title) => update({ ...content, title })} />
          <Field label="Tekst przycisku" value={content.buttonText} onChange={(buttonText) => update({ ...content, buttonText })} />
        </div>
        <AreaField label="Opis" value={content.body} onChange={(body) => update({ ...content, body })} rows={7} />
        <ImageField
          label="Zdjęcie w sekcji O mnie"
          image={content.image}
          uploadFolder="about"
          onUploadError={onUploadError}
          showTitle
          onChange={(image) => update({ ...content, image })}
        />
      </div>
    </AdminSection>
  );
}

function PortfolioEditor({
  projects,
  update,
  onUploadError,
  sectionAction
}: {
  projects: PortfolioProject[];
  update: (projects: PortfolioProject[]) => void;
  onUploadError: (message: string) => void;
  sectionAction?: React.ReactNode;
}) {
  const [collapsedProjects, setCollapsedProjects] = useState<string[]>([]);
  const [collapsedProjectImages, setCollapsedProjectImages] = useState<string[]>([]);

  const addProject = () => {
    update([
      ...projects,
      {
        id: createId("project"),
        enabled: true,
        title: "Nowy projekt",
        type: "Film fabularny",
        role: "Rola drugoplanowa",
        year: "2026",
        description: "Krótki opis projektu, roli i klimatu produkcji.",
        details: "Dłuższy opis roli, procesu pracy, emocji postaci i kontekstu produkcji.",
        linkLabel: "Filmweb",
        linkUrl: "https://www.filmweb.pl",
        image: emptyImage("project-image"),
        images: [
          {
            ...emptyImage("project-detail-image"),
            title: "Kadr z roli",
            alt: "Dodatkowe zdjęcie projektu"
          }
        ]
      }
    ]);
  };

  const updateProject = (index: number, project: PortfolioProject) => {
    update(projects.map((item, itemIndex) => (itemIndex === index ? project : item)));
  };

  const updateProjectImage = (projectIndex: number, imageIndex: number, image: SiteImage) => {
    const project = projects[projectIndex];
    updateProject(projectIndex, {
      ...project,
      images: (project.images ?? []).map((item, itemIndex) =>
        itemIndex === imageIndex ? image : item
      )
    });
  };

  const addProjectImage = (projectIndex: number) => {
    const project = projects[projectIndex];
    updateProject(projectIndex, {
      ...project,
      images: [
        ...(project.images ?? []),
        {
          ...emptyImage("project-detail-image"),
          title: "Nowy kadr",
          alt: "Dodatkowe zdjęcie projektu"
        }
      ]
    });
  };

  return (
    <AdminSection
      title="Portfolio"
      description="Dodawanie, edycja, ukrywanie i usuwanie projektów aktorskich."
      action={sectionAction}
    >
      <div className="mb-6 flex justify-end">
        <Button variant="admin" onClick={addProject}>
          <Plus className="h-4 w-4" />
          Dodaj projekt
        </Button>
      </div>

      <div className="grid gap-6">
        {projects.map((project, index) => (
          <motion.article layout key={project.id} className="rounded-md border border-ink/10 bg-porcelain p-4">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-ink/10 pb-4">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink/35">
                  {String(index + 1).padStart(2, "0")} / {project.type}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-3xl leading-none text-ink">{project.title}</h3>
                  <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">
                    {(project.images ?? []).filter((image) => image.enabled).length} zdjęć
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update(moveItem(projects, index, index - 1))}
                  aria-label="Przesuń projekt wyżej"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update(moveItem(projects, index, index + 1))}
                  aria-label="Przesuń projekt niżej"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCollapsedProjects((current) =>
                      current.includes(project.id)
                        ? current.filter((id) => id !== project.id)
                        : [...current, project.id]
                    )
                  }
                  aria-label={collapsedProjects.includes(project.id) ? "Rozwiń projekt" : "Zwiń projekt"}
                >
                  {collapsedProjects.includes(project.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update(projects.filter((item) => item.id !== project.id))}
                  aria-label={`Usuń ${project.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!collapsedProjects.includes(project.id) && (
                <motion.div
                  className="grid gap-5 overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
              <div className="grid gap-5 md:grid-cols-2">
                <ToggleField
                  label="Pokaż projekt"
                  checked={project.enabled}
                  onChange={(enabled) => updateProject(index, { ...project, enabled })}
                  description="Wyłączony projekt nie pojawi się na stronie."
                  className="md:w-52"
                />
                <Field label="Tytuł" value={project.title} onChange={(title) => updateProject(index, { ...project, title })} />
                <Field label="Typ projektu" value={project.type} onChange={(type) => updateProject(index, { ...project, type })} />
                <Field label="Rola" value={project.role} onChange={(role) => updateProject(index, { ...project, role })} />
                <Field label="Rok" value={project.year} onChange={(year) => updateProject(index, { ...project, year })} />
              </div>
              <AreaField
                label="Opis"
                value={project.description}
                onChange={(description) => updateProject(index, { ...project, description })}
              />
              <AreaField
                label="Dłuższy opis roli"
                value={project.details ?? ""}
                rows={6}
                onChange={(details) => updateProject(index, { ...project, details })}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Tekst linku" value={project.linkLabel ?? ""} onChange={(linkLabel) => updateProject(index, { ...project, linkLabel })} />
                <Field label="Adres linku" value={project.linkUrl ?? ""} onChange={(linkUrl) => updateProject(index, { ...project, linkUrl })} />
              </div>
              <ImageField
                label="Zdjęcie projektu"
                image={project.image}
                uploadFolder={`portfolio-${project.id}`}
                onUploadError={onUploadError}
                showTitle
                onChange={(image) => updateProject(index, { ...project, image })}
              />
              <div className="rounded-md border border-ink/10 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-serif text-3xl leading-none">Dodatkowe zdjęcia roli</h4>
                  <Button variant="outline" onClick={() => addProjectImage(index)}>
                    <Plus className="h-4 w-4" />
                    Dodaj placeholder
                  </Button>
                </div>
                <div className="grid gap-4">
                  {(project.images ?? []).map((image, imageIndex) => (
                    <div key={image.id} className="rounded-md border border-ink/10 bg-porcelain p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink/35">
                            Zdjęcie {String(imageIndex + 1).padStart(2, "0")}
                          </p>
                          <h5 className="mt-1 font-serif text-2xl leading-none">{image.title ?? "Zdjęcie"}</h5>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateProject(index, {
                                ...project,
                                images: moveItem(project.images ?? [], imageIndex, imageIndex - 1)
                              })
                            }
                            aria-label="Przesuń zdjęcie wyżej"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateProject(index, {
                                ...project,
                                images: moveItem(project.images ?? [], imageIndex, imageIndex + 1)
                              })
                            }
                            aria-label="Przesuń zdjęcie niżej"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setCollapsedProjectImages((current) =>
                                current.includes(image.id)
                                  ? current.filter((id) => id !== image.id)
                                  : [...current, image.id]
                              )
                            }
                            aria-label={collapsedProjectImages.includes(image.id) ? "Rozwiń zdjęcie" : "Zwiń zdjęcie"}
                          >
                            {collapsedProjectImages.includes(image.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateProject(index, {
                                ...project,
                                images: (project.images ?? []).filter((item) => item.id !== image.id)
                              })
                            }
                            aria-label={`Usuń ${image.title ?? image.alt}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {!collapsedProjectImages.includes(image.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <ImageField
                              label="Zdjęcie dodatkowe"
                              image={image}
                              uploadFolder={`portfolio-${project.id}-details`}
                              onUploadError={onUploadError}
                              showTitle
                              onChange={(nextImage) => updateProjectImage(index, imageIndex, nextImage)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
      </div>
    </AdminSection>
  );
}

function ShowreelEditor({
  content,
  update,
  onUploadError,
  sectionAction
}: {
  content: ShowreelContent;
  update: (showreel: ShowreelContent) => void;
  onUploadError: (message: string) => void;
  sectionAction?: React.ReactNode;
}) {
  return (
    <AdminSection title="Showreel" description="Miniatura, tekst i link do materiału wideo." action={sectionAction}>
      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Mały nagłówek" value={content.eyebrow} onChange={(eyebrow) => update({ ...content, eyebrow })} />
          <Field label="Tytuł" value={content.title} onChange={(title) => update({ ...content, title })} />
          <Field label="Tekst przycisku" value={content.buttonText} onChange={(buttonText) => update({ ...content, buttonText })} />
          <Field label="Link do wideo" value={content.videoUrl} onChange={(videoUrl) => update({ ...content, videoUrl })} />
        </div>
        <AreaField label="Opis" value={content.description} onChange={(description) => update({ ...content, description })} />
        <ImageField
          label="Miniatura"
          image={content.thumbnail}
          uploadFolder="showreel"
          onUploadError={onUploadError}
          showTitle
          onChange={(thumbnail) => update({ ...content, thumbnail })}
        />
      </div>
    </AdminSection>
  );
}

function GalleryEditor({
  sessions,
  update,
  onUploadError,
  sectionAction
}: {
  sessions: GallerySession[];
  update: (sessions: GallerySession[]) => void;
  onUploadError: (message: string) => void;
  sectionAction?: React.ReactNode;
}) {
  const [uploadingSessionId, setUploadingSessionId] = useState<string | null>(null);
  const [collapsedSessions, setCollapsedSessions] = useState<string[]>([]);
  const [collapsedGalleryImages, setCollapsedGalleryImages] = useState<string[]>([]);

  const updateSession = (index: number, session: GallerySession) => {
    update(sessions.map((item, itemIndex) => (itemIndex === index ? session : item)));
  };

  const addSession = () => {
    const id = createId("session");
    update([
      ...sessions,
      {
        id,
        enabled: true,
        title: "Nowa sesja",
        subtitle: "Sesja zdjęciowa / nowy materiał",
        description: "Opcjonalny opis sesji, jej klimatu i kontekstu.",
        cover: emptyImage(`${id}-cover`),
        images: [
          {
            ...emptyImage(`${id}-image`),
            title: "Pierwszy kadr",
            alt: "Zdjęcie z nowej sesji"
          }
        ]
      }
    ]);
  };

  const updateSessionImage = (sessionIndex: number, imageIndex: number, image: SiteImage) => {
    const session = sessions[sessionIndex];
    updateSession(sessionIndex, {
      ...session,
      images: session.images.map((item, itemIndex) => (itemIndex === imageIndex ? image : item))
    });
  };

  const addPlaceholderImage = (sessionIndex: number) => {
    const session = sessions[sessionIndex];
    updateSession(sessionIndex, {
      ...session,
      images: [
        ...session.images,
        {
          ...emptyImage("gallery-image"),
          title: "Nowy kadr",
          alt: "Nowe zdjęcie w sesji"
        }
      ]
    });
  };

  const addUploadedImages = async (
    event: ChangeEvent<HTMLInputElement>,
    sessionIndex: number
  ) => {
    const files = Array.from(event.target.files ?? []);
    const session = sessions[sessionIndex];

    try {
      setUploadingSessionId(session.id);
      const uploaded = await Promise.all(
        files.map(async (file) => ({
          id: createId("gallery-image"),
          enabled: true,
          src: await uploadImageFile(file, `gallery-${session.id}`),
          alt: file.name.replace(/\.[^.]+$/, ""),
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          aspect: "portrait" as const
        }))
      );

      updateSession(sessionIndex, {
        ...session,
        images: [...session.images, ...uploaded]
      });
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : "Nie udało się wysłać zdjęć galerii.");
    } finally {
      setUploadingSessionId(null);
      event.target.value = "";
    }
  };

  return (
    <AdminSection
      title="Galeria"
      description="Sesje zdjęciowe z okładką, opisem, wieloma zdjęciami i wygodną kolejnością."
      action={sectionAction}
    >
      <div className="mb-6 flex justify-end">
        <Button variant="admin" onClick={addSession}>
          <Plus className="h-4 w-4" />
          Dodaj sesję
        </Button>
      </div>

      <div className="grid gap-6">
        {sessions.map((session, sessionIndex) => (
          <motion.article
            layout
            key={session.id}
            className="rounded-md border border-ink/10 bg-porcelain p-4"
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-ink/10 pb-4">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <h3 className="font-serif text-3xl leading-none text-ink">{session.title}</h3>
                <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                  {session.images.filter((image) => image.enabled).length} zdjęć
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update(moveItem(sessions, sessionIndex, sessionIndex - 1))}
                  aria-label="Przesuń sesję wyżej"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update(moveItem(sessions, sessionIndex, sessionIndex + 1))}
                  aria-label="Przesuń sesję niżej"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCollapsedSessions((current) =>
                      current.includes(session.id)
                        ? current.filter((id) => id !== session.id)
                        : [...current, session.id]
                    )
                  }
                  aria-label={collapsedSessions.includes(session.id) ? "Rozwiń sesję" : "Zwiń sesję"}
                >
                  {collapsedSessions.includes(session.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update(sessions.filter((item) => item.id !== session.id))}
                  aria-label={`Usuń ${session.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!collapsedSessions.includes(session.id) && (
            <motion.div
              className="grid gap-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <ToggleField
                  label="Pokaż sesję"
                  checked={session.enabled}
                  onChange={(enabled) => updateSession(sessionIndex, { ...session, enabled })}
                  description="Wyłączona sesja nie pojawi się na stronie."
                  className="md:w-52"
                />
                <Field label="Tytuł sesji" value={session.title} onChange={(title) => updateSession(sessionIndex, { ...session, title })} />
                <Field label="Podtytuł" value={session.subtitle} onChange={(subtitle) => updateSession(sessionIndex, { ...session, subtitle })} />
              </div>
              <AreaField
                label="Opis sesji opcjonalny"
                value={session.description ?? ""}
                rows={4}
                onChange={(description) => updateSession(sessionIndex, { ...session, description })}
              />
              <ImageField
                label="Okładka sesji"
                image={session.cover}
                uploadFolder={`gallery-${session.id}-cover`}
                onUploadError={onUploadError}
                showTitle
                onChange={(cover) => updateSession(sessionIndex, { ...session, cover })}
              />

              <div className="rounded-md border border-ink/10 bg-white p-4">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <h4 className="font-serif text-3xl leading-none">Zdjęcia w sesji</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => addPlaceholderImage(sessionIndex)}>
                      <Plus className="h-4 w-4" />
                      Dodaj placeholder
                    </Button>
                    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-ink bg-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-graphite">
                      <Upload className="h-4 w-4" />
                      {uploadingSessionId === session.id ? "Wysyłanie" : "Wyślij zdjęcia"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(event) => addUploadedImages(event, sessionIndex)}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4">
                  {session.images.map((image, imageIndex) => (
                    <div
                      key={image.id}
                      className="grid gap-4 rounded-md border border-ink/10 bg-porcelain p-4 md:grid-cols-[120px_1fr_120px]"
                    >
                      <div className="aspect-[4/5] overflow-hidden border border-ink/10 bg-white">
                        {image.src ? (
                          <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-ink/25" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h5 className="font-serif text-2xl leading-none text-ink">
                            {image.title || image.alt || "Zdjęcie"}
                          </h5>
                          <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/35">
                            {String(imageIndex + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <AnimatePresence initial={false}>
                          {!collapsedGalleryImages.includes(image.id) && (
                            <motion.div
                              className="grid gap-4 overflow-hidden"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <ToggleField
                                label="Pokaż zdjęcie"
                                checked={image.enabled}
                                onChange={(enabled) => updateSessionImage(sessionIndex, imageIndex, { ...image, enabled })}
                              />
                              <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Tytuł" value={image.title ?? ""} onChange={(title) => updateSessionImage(sessionIndex, imageIndex, { ...image, title })} />
                                <Field label="Alt" value={image.alt} onChange={(alt) => updateSessionImage(sessionIndex, imageIndex, { ...image, alt })} />
                                <Field label="Adres obrazu" value={image.src} onChange={(src) => updateSessionImage(sessionIndex, imageIndex, { ...image, src })} />
                                <AspectSelector
                                  value={image.aspect}
                                  onChange={(aspect) => updateSessionImage(sessionIndex, imageIndex, { ...image, aspect })}
                                />
                              </div>
                              <AreaField
                                label="Opis opcjonalny"
                                value={image.description ?? ""}
                                rows={3}
                                onChange={(description) => updateSessionImage(sessionIndex, imageIndex, { ...image, description })}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex md:flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateSession(sessionIndex, {
                              ...session,
                              images: moveItem(session.images, imageIndex, imageIndex - 1)
                            })
                          }
                          aria-label="Przesuń zdjęcie wyżej"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateSession(sessionIndex, {
                              ...session,
                              images: moveItem(session.images, imageIndex, imageIndex + 1)
                            })
                          }
                          aria-label="Przesuń zdjęcie niżej"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setCollapsedGalleryImages((current) =>
                              current.includes(image.id)
                                ? current.filter((id) => id !== image.id)
                                : [...current, image.id]
                            )
                          }
                          aria-label={collapsedGalleryImages.includes(image.id) ? "Rozwiń zdjęcie" : "Zwiń zdjęcie"}
                        >
                          {collapsedGalleryImages.includes(image.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateSession(sessionIndex, {
                              ...session,
                              images: session.images.filter((item) => item.id !== image.id)
                            })
                          }
                          aria-label={`Usuń ${image.title ?? image.alt}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
      </div>
    </AdminSection>
  );
}

function PressEditor({
  mentions,
  update,
  sectionAction
}: {
  mentions: PressMention[];
  update: (mentions: PressMention[]) => void;
  sectionAction?: React.ReactNode;
}) {
  const addMention = () => {
    update([
      ...mentions,
      {
        id: createId("press"),
        enabled: true,
        quote: "Pięknie prowadzona, uważna i wyciszona rola.",
        outlet: "Magazyn",
        author: "Recenzja"
      }
    ]);
  };

  const updateMention = (index: number, mention: PressMention) => {
    update(mentions.map((item, itemIndex) => (itemIndex === index ? mention : item)));
  };

  return (
    <AdminSection title="Prasa" description="Cytaty, nazwy mediów i autorzy recenzji." action={sectionAction}>
      <div className="mb-6 flex justify-end">
        <Button variant="admin" onClick={addMention}>
          <Plus className="h-4 w-4" />
          Dodaj cytat
        </Button>
      </div>

      <div className="grid gap-5">
        {mentions.map((mention, index) => (
          <article key={mention.id} className="rounded-md border border-ink/10 bg-porcelain p-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="font-serif text-3xl leading-none">{mention.outlet}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => update(mentions.filter((item) => item.id !== mention.id))}
                aria-label={`Usuń ${mention.outlet}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleField
                label="Pokaż cytat"
                checked={mention.enabled}
                onChange={(enabled) => updateMention(index, { ...mention, enabled })}
                description="Wyłączony cytat zostanie ukryty na stronie."
                className="md:w-52"
              />
              <Field label="Medium" value={mention.outlet} onChange={(outlet) => updateMention(index, { ...mention, outlet })} />
              <Field label="Autor" value={mention.author} onChange={(author) => updateMention(index, { ...mention, author })} />
              <div className="md:col-span-2">
                <AreaField label="Cytat" value={mention.quote} onChange={(quote) => updateMention(index, { ...mention, quote })} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminSection>
  );
}

function ContactEditor({
  content,
  update,
  sectionAction
}: {
  content: ContactContent;
  update: (contact: ContactContent) => void;
  sectionAction?: React.ReactNode;
}) {
  const updateSocial = (index: number, social: SocialLink) => {
    update({
      ...content,
      socials: content.socials.map((item, itemIndex) => (itemIndex === index ? social : item))
    });
  };

  return (
    <AdminSection title="Kontakt" description="Treść kontaktowa, reprezentacja i linki społecznościowe." action={sectionAction}>
      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Mały nagłówek" value={content.eyebrow} onChange={(eyebrow) => update({ ...content, eyebrow })} />
          <Field label="Nagłówek" value={content.heading} onChange={(heading) => update({ ...content, heading })} />
          <Field label="Email" value={content.email} onChange={(email) => update({ ...content, email })} />
          <Field label="Telefon" value={content.phone} onChange={(phone) => update({ ...content, phone })} />
          <Field label="Lokalizacja" value={content.location} onChange={(location) => update({ ...content, location })} />
          <Field
            label="Reprezentacja"
            value={content.representation}
            onChange={(representation) => update({ ...content, representation })}
          />
        </div>
        <AreaField label="Tekst wprowadzający" value={content.intro} onChange={(intro) => update({ ...content, intro })} />

        <div className="rounded-md border border-ink/10 bg-porcelain p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-serif text-3xl leading-none text-ink">Social media</h3>
            <Button
              variant="admin"
              onClick={() =>
                update({
                  ...content,
                  socials: [
                    ...content.socials,
                    { id: createId("social"), enabled: true, label: "Nowy link", url: "https://" }
                  ]
                })
              }
            >
              <Plus className="h-4 w-4" />
              Dodaj link
            </Button>
          </div>

          <div className="grid gap-4">
            {content.socials.map((social, index) => (
              <motion.div
                layout
                key={social.id}
                className="grid gap-3 rounded-md border border-ink/10 bg-white p-3 md:grid-cols-[160px_1fr_1fr_132px]"
              >
                <ToggleField
                  label="Pokaż link"
                  checked={social.enabled}
                  onChange={(enabled) => updateSocial(index, { ...social, enabled })}
                />
                <Field label="Nazwa" value={social.label} onChange={(label) => updateSocial(index, { ...social, label })} />
                <Field label="URL" value={social.url} onChange={(url) => updateSocial(index, { ...social, url })} />
                <div className="flex gap-1 self-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => update({ ...content, socials: moveItem(content.socials, index, index - 1) })}
                    aria-label="Przesuń link wyżej"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => update({ ...content, socials: moveItem(content.socials, index, index + 1) })}
                    aria-label="Przesuń link niżej"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      update({
                        ...content,
                        socials: content.socials.filter((item) => item.id !== social.id)
                      })
                    }
                    aria-label={`Usuń ${social.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}

export function AdminPanel() {
  const [content, setContent] = useState<SiteContent>(() => cloneContent(siteContent));
  const [activeTab, setActiveTab] = useState<TabId>("hero");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isAuthorized = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (nextUser && nextUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        void signOut(firebaseAuth);
        setUser(null);
        setAuthError("Ten adres email nie ma dostępu do panelu administracyjnego.");
      } else {
        setUser(nextUser);
        setAuthError(null);
      }

      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    return subscribeSiteContent(
      (nextContent) => setContent(nextContent),
      (error) => setStatusMessage(error.message),
      "preview"
    );
  }, [isAuthorized]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        loginEmail.trim(),
        loginPassword
      );

      if (credential.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(firebaseAuth);
        setAuthError("Zalogować może się tylko skonfigurowany adres administratora.");
        return;
      }

      setLoginPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Logowanie nie powiodło się.");
    }
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    setUser(null);
    setSavedAt(null);
  };

  const activeLabel = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.label ?? "Hero",
    [activeTab]
  );

  const updateContent = (recipe: (draft: SiteContent) => void) => {
    setContent((current) => {
      const next = cloneContent(current);
      recipe(next);
      return next;
    });
  };

  const save = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await saveSiteContent(content, "preview");
      setSavedAt(new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się zapisać treści.");
    } finally {
      setIsSaving(false);
    }
  };

  const publishLive = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await saveSiteContent(content, "live");
      setSavedAt(new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się opublikować wersji live.");
    } finally {
      setIsSaving(false);
    }
  };

  const sectionAction = (
    <ToggleField
      label="Sekcja"
      checked={content.sections[activeTab].enabled}
      onChange={(enabled) =>
        updateContent((draft) => {
          draft.sections[activeTab].enabled = enabled;
        })
      }
      description="Wyłączona sekcja pozostaje w panelu, ale znika ze strony publicznej."
      className="w-full sm:w-44"
    />
  );

  if (authLoading) {
    return (
      <motion.main
        className="flex min-h-screen items-center justify-center bg-porcelain px-4 text-ink"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-full max-w-md border border-ink/10 bg-white p-8 shadow-editorial"
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/40">
            Studio treści
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none">Ładowanie panelu</h1>
          <div className="mt-7 h-px overflow-hidden bg-ink/10">
            <motion.span
              className="block h-full w-1/2 bg-ink"
              initial={{ x: "-100%" }}
              animate={{ x: "220%" }}
              transition={{ repeat: Infinity, duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </motion.main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-porcelain px-4 text-ink">
        <motion.form
          onSubmit={handleLogin}
          className="w-full max-w-md border border-ink/10 bg-white p-6 shadow-editorial sm:p-8"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-ink/50 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do strony
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
            Panel Firebase
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-none text-ink">Logowanie</h1>
          <div className="mt-8 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Hasło</Label>
              <Input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
            </div>
            {authError && <p className="text-sm leading-6 text-red-700">{authError}</p>}
            <Button type="submit" className="w-full">
              Zaloguj się
            </Button>
          </div>
        </motion.form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-porcelain/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink"
              aria-label="Wróć do strony"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
                Lokalne studio treści
              </p>
              <h1 className="font-serif text-4xl leading-none text-ink">Panel / {activeLabel}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedAt && (
              <span className="inline-flex items-center rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
                Zapisano {savedAt}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Wyloguj
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/preview">
                <ExternalLink className="h-3.5 w-3.5" />
                Podgląd
              </Link>
            </Button>
            <Button size="sm" onClick={save} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Zapisywanie" : "Zapisz szkic"}
            </Button>
            <Button size="sm" onClick={publishLive} disabled={isSaving}>
              <Rocket className="h-4 w-4" />
              Publikuj live
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:py-10">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <nav className="grid gap-2 border border-ink/10 bg-white p-2" aria-label="Sekcje panelu admina">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-md px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] transition-colors",
                  activeTab === tab.id ? "bg-ink text-white" : "text-ink/55 hover:bg-ink/5 hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          {statusMessage && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {statusMessage}
            </div>
          )}
          {activeTab === "hero" && (
            <HeroEditor
              content={content.hero}
              onUploadError={setStatusMessage}
              sectionAction={sectionAction}
              update={(hero) => updateContent((draft) => void (draft.hero = hero))}
            />
          )}
          {activeTab === "about" && (
            <AboutEditor
              content={content.about}
              onUploadError={setStatusMessage}
              sectionAction={sectionAction}
              update={(about) => updateContent((draft) => void (draft.about = about))}
            />
          )}
          {activeTab === "portfolio" && (
            <PortfolioEditor
              projects={content.portfolio}
              onUploadError={setStatusMessage}
              sectionAction={sectionAction}
              update={(portfolio) => updateContent((draft) => void (draft.portfolio = portfolio))}
            />
          )}
          {activeTab === "showreel" && (
            <ShowreelEditor
              content={content.showreel}
              onUploadError={setStatusMessage}
              sectionAction={sectionAction}
              update={(showreel) => updateContent((draft) => void (draft.showreel = showreel))}
            />
          )}
          {activeTab === "gallery" && (
            <GalleryEditor
              sessions={content.gallery}
              onUploadError={setStatusMessage}
              sectionAction={sectionAction}
              update={(gallery) => updateContent((draft) => void (draft.gallery = gallery))}
            />
          )}
          {activeTab === "press" && (
            <PressEditor
              mentions={content.press}
              sectionAction={sectionAction}
              update={(press) => updateContent((draft) => void (draft.press = press))}
            />
          )}
          {activeTab === "contact" && (
            <ContactEditor
              content={content.contact}
              sectionAction={sectionAction}
              update={(contact) => updateContent((draft) => void (draft.contact = contact))}
            />
          )}
        </div>
      </div>
    </main>
  );
}
