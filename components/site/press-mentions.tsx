"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PressMention } from "@/lib/types";
import { RevealBlock, SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { createId, cn } from "@/lib/utils";
import { Trash2, Plus, ArrowUp, ArrowDown, Eye, EyeOff, Edit } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function PressMentions({ mentions: initialMentions }: { mentions: PressMention[] }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const mentions = editMode ? globalContent.press : initialMentions;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSectionEnabled = globalContent.sections.press.enabled;

  const updateMentionField = <K extends keyof PressMention>(index: number, field: K, value: PressMention[K]) => {
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

  const toggleMentionEnabled = (index: number) => {
    updateContent((draft) => {
      draft.press[index].enabled = !draft.press[index].enabled;
    });
  };

  const moveMention = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= mentions.length) return;
    updateContent((draft) => {
      const list = [...draft.press];
      const [item] = list.splice(index, 1);
      list.splice(toIndex, 0, item);
      draft.press = list;
    });
  };

  return (
    <SectionReveal
      id="press"
      className={cn(
        "relative bg-white py-24 transition-all duration-300 group/section",
        editMode && "hover:ring-1 hover:ring-ink/20",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Control overlay for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-2">
          {/* Section Visibility Toggle */}
          <div className="flex items-center gap-3 bg-porcelain/90 border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
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
      )}

      <div className="section-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end w-full mb-10">
          <SectionHeading
            eyebrow={globalContent.sections.press.eyebrow ?? "prasa"}
            title={globalContent.sections.press.title ?? "W mediach"}
            align="center"
            className="w-full"
          />
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {mentions.filter(m => editMode || m.enabled).map((mention, index) => (
            <RevealBlock key={mention.id} delay={index * 0.08} y={34} className="h-full">
              <figure
                className={cn(
                  "relative flex h-full flex-col justify-between border-y border-ink/10 px-4 py-10 text-center group/figure",
                  !mention.enabled && "opacity-45 border-dashed"
                )}
              >
                <blockquote className="font-serif text-3xl leading-tight text-ink">
                  &quot;{mention.quote}&quot;
                </blockquote>
                <figcaption className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-ink/55">
                  {mention.outlet}
                  <span className="mt-2 block font-medium tracking-[0.16em] text-ink/35">
                    {mention.author}
                  </span>
                  {!mention.enabled && (
                    <span className="mt-2 inline-block rounded bg-ink/5 px-2 py-0.5 text-[0.55rem] font-bold text-ink/40 tracking-wider">
                      Ukryty
                    </span>
                  )}
                </figcaption>
              </figure>
            </RevealBlock>
          ))}
        </div>
      </div>

      {/* Edit Drawer */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Sekcja Prasa (W mediach)"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="press-menu-label">Nazwa w menu</Label>
            <Input
              id="press-menu-label"
              value={globalContent.sections.press.label ?? "Prasa"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.press.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="press-eyebrow">Eyebrow (nadnagłówek)</Label>
            <Input
              id="press-eyebrow"
              value={globalContent.sections.press.eyebrow ?? "prasa"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.press.eyebrow = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="press-title">Tytuł sekcji</Label>
            <Input
              id="press-title"
              value={globalContent.sections.press.title ?? "W mediach"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.press.title = e.target.value;
                })
              }
              className="rounded-xl font-serif text-lg"
            />
          </div>

          {/* List of Quotes inside the drawer */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Lista cytatów prasowych ({mentions.length})
              </Label>
              <Button variant="outline" size="sm" onClick={addMention} className="h-8 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" /> Dodaj cytat
              </Button>
            </div>

            <div className="grid gap-4">
              <AnimatePresence initial={false}>
                {mentions.map((mention, idx) => (
                <motion.div
                  layout
                  key={mention.id}
                  className="relative grid gap-2.5 rounded-2xl border border-ink/10 bg-white p-3 group/item"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold text-ink/30 uppercase">Cytat:</span>
                    <Textarea
                      value={mention.quote}
                      onChange={(e) => updateMentionField(idx, "quote", e.target.value)}
                      rows={2}
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <span className="text-[0.55rem] font-bold text-ink/30 uppercase">Medium:</span>
                      <Input
                        value={mention.outlet}
                        onChange={(e) => updateMentionField(idx, "outlet", e.target.value)}
                        className="text-xs rounded-full"
                      />
                    </div>
                    <div className="grid gap-1">
                      <span className="text-[0.55rem] font-bold text-ink/30 uppercase">Autor:</span>
                      <Input
                        value={mention.author}
                        onChange={(e) => updateMentionField(idx, "author", e.target.value)}
                        className="text-xs rounded-full"
                      />
                    </div>
                  </div>

                  {/* Move, toggle, delete controls */}
                  <div className="flex items-center justify-end gap-1 mt-1 border-t border-ink/5 pt-2">
                    <button
                      type="button"
                      onClick={() => moveMention(idx, -1)}
                      disabled={idx === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      title="Przesuń wyżej"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMention(idx, 1)}
                      disabled={idx === mentions.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                      title="Przesuń niżej"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMentionEnabled(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                      title={mention.enabled ? "Ukryj" : "Pokaż"}
                    >
                      {mention.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMention(mention.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                      title="Usuń"
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
    </SectionReveal>
  );
}
