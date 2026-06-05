"use client";

import type { PressMention } from "@/lib/types";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { createId, cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";

export function PressMentions({ mentions: initialMentions }: { mentions: PressMention[] }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const mentions = editMode ? globalContent.press : initialMentions;

  const isSectionEnabled = globalContent.sections.press.enabled;

  const updateMentionField = (index: number, field: keyof PressMention, value: any) => {
    updateContent((draft) => {
      draft.press[index] = { ...draft.press[index], [field]: value };
    });
  };

  const addMention = () => {
    const newMention: PressMention = {
      id: createId("press"),
      enabled: true,
      quote: "Nowa recenzja lub cytat z prasy.",
      outlet: "Nazwa Gazety / Portalu",
      author: "Autor recenzji"
    };
    updateContent((draft) => {
      draft.press.push(newMention);
    });
  };

  const deleteMention = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten cytat prasowy?")) {
      updateContent((draft) => {
        draft.press = draft.press.filter((m) => m.id !== id);
      });
    }
  };

  return (
    <SectionReveal
      id="press"
      className={cn(
        "relative bg-white py-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-3 bg-porcelain border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/65">
            Sekcja Prasa (W mediach)
          </span>
          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.sections.press.enabled = !draft.sections.press.enabled;
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
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end w-full mb-10">
          {editMode ? (
            <div className="grid gap-4 bg-porcelain p-4 border border-ink/10 rounded-2xl w-full">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Prasa Eyebrow (nadnagłówek):
                  </span>
                  <input
                    type="text"
                    value={globalContent.sections.press.eyebrow ?? "prasa"}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.sections.press.eyebrow = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ink focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Prasa Tytuł:
                  </span>
                  <input
                    type="text"
                    value={globalContent.sections.press.title ?? "W mediach"}
                    onChange={(e) =>
                      updateContent((draft) => {
                        draft.sections.press.title = e.target.value;
                      })
                    }
                    className="w-full bg-white border border-ink/10 rounded-xl px-4 py-1.5 font-serif text-lg text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <SectionHeading
              eyebrow={globalContent.sections.press.eyebrow ?? "prasa"}
              title={globalContent.sections.press.title ?? "W mediach"}
              align="center"
              className="w-full"
            />
          )}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {mentions.map((mention, index) => (
            <figure
              key={mention.id}
              className="relative border-y border-ink/10 px-4 py-10 text-center flex flex-col justify-between group"
            >
              {editMode && (
                <button
                  type="button"
                  onClick={() => deleteMention(mention.id)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Usuń cytat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold text-left text-ink/30 uppercase">Cytat:</span>
                    <textarea
                      value={mention.quote}
                      onChange={(e) => updateMentionField(index, "quote", e.target.value)}
                      rows={3}
                      className="w-full bg-porcelain border border-ink/10 rounded-xl px-3 py-2 text-center text-sm font-serif text-ink focus:outline-none focus:border-ink resize-none"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold text-left text-ink/30 uppercase">Medium (Outlet):</span>
                    <input
                      type="text"
                      value={mention.outlet}
                      onChange={(e) => updateMentionField(index, "outlet", e.target.value)}
                      className="w-full bg-porcelain border border-ink/10 rounded-full px-3 py-1 text-center text-xs font-bold uppercase tracking-[0.22em] text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold text-left text-ink/30 uppercase">Autor:</span>
                    <input
                      type="text"
                      value={mention.author}
                      onChange={(e) => updateMentionField(index, "author", e.target.value)}
                      className="w-full bg-porcelain border border-ink/10 rounded-full px-3 py-1 text-center text-[0.62rem] font-medium tracking-[0.16em] text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <blockquote className="font-serif text-3xl leading-tight text-ink">
                    &quot;{mention.quote}&quot;
                  </blockquote>
                  <figcaption className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-ink/55">
                    {mention.outlet}
                    <span className="mt-2 block font-medium tracking-[0.16em] text-ink/35">
                      {mention.author}
                    </span>
                  </figcaption>
                </>
              )}
            </figure>
          ))}

          {/* Add Mention Button in edit mode */}
          {editMode && (
            <button
              type="button"
              onClick={addMention}
              className="group border border-dashed border-ink/20 hover:border-ink/40 bg-ink/[0.01] hover:bg-ink/[0.03] transition-all duration-300 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer min-h-[220px]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-ink/10 text-ink/50 group-hover:scale-110 group-hover:text-ink transition-all duration-500">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-3 block font-serif text-xl text-ink/70 group-hover:text-ink transition-colors">
                Dodaj cytat prasowy
              </span>
            </button>
          )}
        </div>
      </div>
    </SectionReveal>
  );
}
