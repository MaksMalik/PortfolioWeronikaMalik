"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import type { PortfolioProject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CinematicImage } from "@/components/site/cinematic-image";
import { ModalPortal } from "@/components/site/modal-portal";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";

export function PortfolioHighlights({ projects }: { projects: PortfolioProject[] }) {
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);

  useEffect(() => {
    if (!activeProject) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveProject(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeProject]);

  return (
    <SectionReveal id="work" className="bg-porcelain py-24">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="portfolio" title="Wybrane role" />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {projects.map((project, index) => (
            <motion.button
              type="button"
              key={project.id}
              className="group border border-ink/10 bg-white text-left transition-shadow duration-500 hover:shadow-editorial"
              onClick={() => setActiveProject(project)}
              aria-label={`Czytaj więcej o roli ${project.title}`}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10 }}
            >
              {project.image.enabled && (
                <CinematicImage
                  src={project.image.src}
                  alt={project.image.alt}
                  className="aspect-[3/4]"
                />
              )}
              <div className="relative overflow-hidden p-6">
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
                  <span className="mt-6 inline-flex border-b border-ink pb-1 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                    Czytaj więcej
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

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
              className="mx-auto max-w-6xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sticky top-0 z-20 mb-8 border-b border-ink/10 bg-porcelain px-4 py-4 shadow-[0_16px_50px_rgba(16,16,16,0.04)] sm:px-6">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
                      {activeProject.type} / {activeProject.role} / {activeProject.year}
                    </p>
                    <h2 className="font-serif text-4xl leading-none sm:text-6xl">
                      {activeProject.title}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setActiveProject(null)}
                    aria-label="Zamknij szczegóły roli"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-8 px-4 pb-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
                {activeProject.image.enabled && (
                  <CinematicImage
                    src={activeProject.image.src}
                    alt={activeProject.image.alt}
                    className="aspect-[4/5] border border-ink/10"
                  />
                )}

                <div>
                  <p className="font-serif text-3xl leading-tight text-graphite sm:text-4xl">
                    {activeProject.description}
                  </p>
                  {activeProject.details && (
                    <p className="mt-7 text-lg leading-8 text-graphite/70">
                      {activeProject.details}
                    </p>
                  )}
                  {activeProject.linkUrl && (
                    <a
                      href={activeProject.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-8 inline-flex items-center gap-2 rounded-full border border-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
                    >
                      {activeProject.linkLabel || "Zobacz więcej"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {(activeProject.images ?? []).filter((image) => image.enabled).length > 0 && (
                <div className="mt-10 grid gap-5 px-4 pb-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                  {(activeProject.images ?? [])
                    .filter((image) => image.enabled)
                    .map((image) => (
                      <figure key={image.id} className="border border-ink/10 bg-white">
                        <CinematicImage
                          src={image.src}
                          alt={image.alt}
                          className={image.aspect === "wide" ? "aspect-video" : image.aspect === "square" ? "aspect-square" : "aspect-[4/5]"}
                        />
                        {(image.title || image.description) && (
                          <figcaption className="p-4">
                            {image.title && (
                              <p className="font-serif text-2xl leading-none">{image.title}</p>
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
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </SectionReveal>
  );
}
