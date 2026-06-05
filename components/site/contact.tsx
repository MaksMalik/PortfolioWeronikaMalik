"use client";

import { FormEvent, useState } from "react";
import { Camera, ExternalLink, Film, Mail, MapPin, MessageCircle, Phone, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Plus } from "lucide-react";
import type { ContactContent, SocialLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { createId, cn } from "@/lib/utils";

function socialIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("instagram")) {
    return <Camera className="h-4 w-4" />;
  }

  if (normalized.includes("filmweb")) {
    return <Film className="h-4 w-4" />;
  }

  return <MessageCircle className="h-4 w-4" />;
}

export function Contact({ content: initialContent }: { content: ContactContent }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.contact : initialContent;

  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  const isSectionEnabled = globalContent.sections.contact.enabled;

  const updateContactField = (field: keyof ContactContent, value: any) => {
    updateContent((draft) => {
      draft.contact = { ...draft.contact, [field]: value };
    });
  };

  // Socials list actions
  const moveSocial = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= content.socials.length) return;
    updateContent((draft) => {
      const list = [...draft.contact.socials];
      const [item] = list.splice(index, 1);
      list.splice(toIndex, 0, item);
      draft.contact.socials = list;
    });
  };

  const toggleSocialEnabled = (index: number) => {
    updateContent((draft) => {
      draft.contact.socials[index].enabled = !draft.contact.socials[index].enabled;
    });
  };

  const deleteSocial = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten link?")) {
      updateContent((draft) => {
        draft.contact.socials = draft.contact.socials.filter((s) => s.id !== id);
      });
    }
  };

  const addSocial = () => {
    const newSocial: SocialLink = {
      id: createId("social"),
      enabled: true,
      label: "Nowy link",
      url: "https://"
    };
    updateContent((draft) => {
      draft.contact.socials.push(newSocial);
    });
  };

  const updateSocialField = (index: number, field: keyof SocialLink, value: any) => {
    updateContent((draft) => {
      draft.contact.socials[index] = { ...draft.contact.socials[index], [field]: value };
    });
  };

  return (
    <SectionReveal
      id="contact"
      className={cn(
        "relative bg-porcelain pb-10 pt-24 transition-opacity duration-300",
        editMode && !isSectionEnabled && "opacity-60 border-2 border-dashed border-ink/15 bg-ink/[0.01]"
      )}
    >
      {/* Section Visibility Toggle for Admin */}
      {editMode && (
        <div className="absolute top-6 right-4 z-20 flex items-center gap-3 bg-white border border-ink/10 px-4 py-2 shadow-sm rounded-full backdrop-blur-md">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/65">
            Sekcja Kontakt (Dane i social media)
          </span>
          <button
            type="button"
            onClick={() =>
              updateContent((draft) => {
                draft.sections.contact.enabled = !draft.sections.contact.enabled;
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
        <div className="grid gap-12 border-t border-ink/10 pt-14 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            {editMode ? (
              <div className="grid gap-4 bg-white/70 p-5 border border-ink/10 rounded-2xl">
                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Eyebrow (nadnagłówek):
                  </span>
                  <input
                    type="text"
                    value={content.eyebrow}
                    onChange={(e) => updateContactField("eyebrow", e.target.value)}
                    className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ink focus:outline-none"
                  />
                </div>

                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Nagłówek sekcji:
                  </span>
                  <input
                    type="text"
                    value={content.heading}
                    onChange={(e) => updateContactField("heading", e.target.value)}
                    className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2 font-serif text-2xl text-ink focus:outline-none"
                  />
                </div>

                <div className="grid gap-1">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                    Wprowadzenie:
                  </span>
                  <textarea
                    value={content.intro}
                    onChange={(e) => updateContactField("intro", e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2 text-sm text-ink focus:outline-none resize-none"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                      Email:
                    </span>
                    <input
                      type="text"
                      value={content.email}
                      onChange={(e) => updateContactField("email", e.target.value)}
                      className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                      Telefon:
                    </span>
                    <input
                      type="text"
                      value={content.phone}
                      onChange={(e) => updateContactField("phone", e.target.value)}
                      className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                      Lokalizacja:
                    </span>
                    <input
                      type="text"
                      value={content.location}
                      onChange={(e) => updateContactField("location", e.target.value)}
                      className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink/30">
                      Reprezentacja (Agent):
                    </span>
                    <input
                      type="text"
                      value={content.representation}
                      onChange={(e) => updateContactField("representation", e.target.value)}
                      className="w-full bg-white border border-ink/10 rounded-full px-4 py-1.5 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <SectionHeading eyebrow={content.eyebrow} title={content.heading} />
                <p className="mt-7 max-w-xl text-lg leading-8 text-graphite/75">
                  {content.intro}
                </p>

                <div className="mt-10 grid gap-4 text-sm text-ink/70">
                  <a className="flex items-center gap-3 hover:text-ink w-fit" href={`mailto:${content.email}`}>
                    <Mail className="h-4 w-4" />
                    {content.email}
                  </a>
                  <a className="flex items-center gap-3 hover:text-ink w-fit" href={`tel:${content.phone}`}>
                    <Phone className="h-4 w-4" />
                    {content.phone}
                  </a>
                  <p className="flex items-center gap-3">
                    <MapPin className="h-4 w-4" />
                    {content.location}
                  </p>
                  <p className="border-l border-ink/15 pl-4 font-serif text-2xl text-ink">
                    {content.representation}
                  </p>
                </div>
              </>
            )}

            {/* Social Links List (CMS or public list) */}
            <div className="mt-10">
              {editMode ? (
                <div className="grid gap-4 bg-white/70 p-5 border border-ink/10 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                      Odnośniki społecznościowe
                    </span>
                    <Button variant="outline" size="sm" onClick={addSocial} className="h-8 rounded-full text-xs">
                      <Plus className="h-3.5 w-3.5" /> Dodaj link
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {content.socials.map((social, index) => (
                      <div
                        key={social.id}
                        className="flex flex-col gap-2 p-3 bg-porcelain border border-ink/5 rounded-2xl md:grid md:grid-cols-[1fr_1.3fr_auto] md:gap-2 md:items-center md:p-2 md:rounded-xl"
                      >
                        <div className="grid gap-1">
                          <input
                            type="text"
                            placeholder="Etykieta (np. Instagram)..."
                            value={social.label}
                            onChange={(e) => updateSocialField(index, "label", e.target.value)}
                            className="bg-white border border-ink/10 rounded-full px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="grid gap-1">
                          <input
                            type="text"
                            placeholder="Adres URL..."
                            value={social.url}
                            onChange={(e) => updateSocialField(index, "url", e.target.value)}
                            className="bg-white border border-ink/10 rounded-full px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-end md:justify-center gap-1 mt-1 md:mt-0">
                          <button
                            type="button"
                            onClick={() => moveSocial(index, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                            title="Przesuń wyżej"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSocial(index, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                            title="Przesuń niżej"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSocialEnabled(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                            title={social.enabled ? "Ukryj" : "Pokaż"}
                          >
                            {social.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSocial(social.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                            title="Usuń"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {content.socials.filter((social) => social.enabled).map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-ink/65 transition-colors hover:border-ink hover:text-ink"
                    >
                      {socialIcon(social.label)}
                      {social.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form className="grid gap-5 bg-white p-5 shadow-[0_20px_70px_rgba(16,16,16,0.06)] sm:p-8 rounded-3xl border border-ink/10" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input id="name" name="name" required className="rounded-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="rounded-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Temat</Label>
              <Input id="subject" name="subject" required className="rounded-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Wiadomość</Label>
              <Textarea id="message" name="message" required className="rounded-2xl" />
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button type="submit" className="min-w-44">
                Wyślij wiadomość
              </Button>
              {sent && (
                <p className="text-sm text-ink/55">
                  Wiadomość została przygotowana lokalnie w wersji demonstracyjnej.
                </p>
              )}
            </div>
          </form>
        </div>

        <footer className="mt-16 border-t border-ink/10 py-8">
          <div className="flex flex-col justify-between gap-5 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink/40 sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} Weronika Malik</span>
            <span className="text-ink/30">Projekt i realizacja</span>
          </div>
        </footer>
      </div>
    </SectionReveal>
  );
}
