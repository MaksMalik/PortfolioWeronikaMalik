"use client";

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ExternalLink, Mail, MapPin, MessageCircle, Phone, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Plus, Edit } from "lucide-react";
import type { ContactContent, SocialLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilmwebMark } from "@/components/site/brand-icons";
import { RevealBlock, SectionHeading, SectionReveal } from "@/components/site/section-reveal";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
import { createId, cn } from "@/lib/utils";
import { AdminDrawer } from "@/components/admin/admin-drawer";


const InstagramIcon = () => (
  <svg
    className="h-4.5 w-4.5 transition-all duration-300 fill-none stroke-[1.5] stroke-ink/65 group-hover:stroke-[url(#insta-grad)] shrink-0"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="insta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg
    className="h-4.5 w-4.5 transition-all duration-300 fill-ink/65 group-hover:fill-[#1877F2] shrink-0"
    viewBox="0 0 24 24"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

function socialIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("instagram")) {
    return <InstagramIcon />;
  }

  if (normalized.includes("filmweb")) {
    return <FilmwebMark className="h-4.5 w-4.5" />;
  }

  if (normalized.includes("facebook")) {
    return <FacebookIcon />;
  }

  return <MessageCircle className="h-4.5 w-4.5 stroke-ink/65 group-hover:stroke-ink transition-colors duration-300 shrink-0" />;
}

const contactEase = [0.22, 1, 0.36, 1] as const;

const contactDetailsContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const contactDetailsItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.66, ease: contactEase }
  }
};

const phoneSwap: Variants = {
  hidden: { opacity: 0, y: 8, clipPath: "inset(0 100% 0 0)" },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 0.48, ease: contactEase }
  },
  exit: {
    opacity: 0,
    y: -6,
    clipPath: "inset(0 0 0 100%)",
    transition: { duration: 0.22, ease: "easeOut" }
  }
};

export function Contact({ content: initialContent, bgClass }: { content: ContactContent; bgClass?: string }) {
  const { editMode, updateContent, content: globalContent } = useAdminEdit();
  const content = editMode ? globalContent.contact : initialContent;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const isSectionEnabled = globalContent.sections.contact.enabled;

  const updateContactField = <K extends keyof ContactContent>(field: K, value: ContactContent[K]) => {
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

  const updateSocialField = <K extends keyof SocialLink>(index: number, field: K, value: SocialLink[K]) => {
    updateContent((draft) => {
      draft.contact.socials[index] = { ...draft.contact.socials[index], [field]: value };
    });
  };

  return (
    <SectionReveal
      id="contact"
      className={cn(
        "relative pt-20 pb-10 transition-all duration-300 group/section sm:pt-24 sm:pb-12",
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
              Sekcja Kontakt
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
        <div className="grid gap-10 border-t border-ink/10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-16">
          <div className="flex flex-col justify-between">
            <div>
              <SectionHeading eyebrow={content.eyebrow} title={content.heading} />
              <RevealBlock delay={0.12}>
                <p className="mt-7 max-w-xl whitespace-pre-wrap text-base leading-8 text-graphite/75 sm:text-lg">
                  {content.intro}
                </p>
              </RevealBlock>
            </div>

            {/* Social Links List */}
            <div className="mt-12 space-y-4 lg:max-w-md">
              {content.socials.filter((social) => social.enabled).map((social, index) => (
                <motion.a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between border-b border-ink/10 pb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-ink/65 transition-colors hover:text-ink"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35, margin: "0px 0px -10% 0px" }}
                  transition={{ delay: 0.14 + index * 0.06, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="flex items-center gap-3">
                    {socialIcon(social.label)}
                    {social.label}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center lg:border-l lg:border-ink/10 lg:pl-16">
            <motion.div
              className="divide-y divide-ink/10 border-y border-ink/10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -12% 0px" }}
              variants={contactDetailsContainer}
            >
              {content.email && (
                <motion.div variants={contactDetailsItem} className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group/item">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink/45">
                    Napisz bezpośrednio
                  </span>
                  <a
                    href={`mailto:${content.email}`}
                    className="inline-flex items-center gap-2.5 break-all font-serif text-lg text-ink transition-colors hover:text-ink/60 sm:text-xl"
                  >
                    {content.email}
                    <Mail className="h-4 w-4 text-ink/45 group-hover/item:translate-x-1 transition-transform duration-300" />
                  </a>
                </motion.div>
              )}

              {content.phone && (
                <motion.div variants={contactDetailsItem} className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group/item">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink/45">
                    Zadzwoń
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    {showPhone || editMode ? (
                      <motion.a
                        key="phone-visible"
                        href={`tel:${content.phone.replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-2.5 font-serif text-lg text-ink transition-colors hover:text-ink/60 sm:text-xl"
                        variants={phoneSwap}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {content.phone}
                        <Phone className="h-4 w-4 text-ink/45 group-hover/item:translate-x-1 transition-transform duration-300" />
                      </motion.a>
                    ) : (
                      <motion.button
                        key="phone-hidden"
                        type="button"
                        onClick={() => setShowPhone(true)}
                        className="inline-flex items-center gap-3 font-serif text-lg text-ink transition-colors hover:text-ink/60 sm:text-xl cursor-pointer text-left focus:outline-none"
                        aria-label="Pokaż numer telefonu"
                        aria-expanded={showPhone}
                        variants={phoneSwap}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <span className="select-none tracking-wide text-ink/65">
                          {content.phone.substring(0, 4)}
                          <span className="ml-2 font-sans text-sm tracking-[0.24em] text-ink/28">
                            ••• ••• •••
                          </span>
                        </span>
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/55 shadow-[0_10px_26px_rgba(16,16,16,0.04)] transition-all duration-300 group-hover/item:border-ink/18 group-hover/item:text-ink group-hover/item:shadow-[0_14px_34px_rgba(16,16,16,0.07)]">
                          <Eye className="h-4 w-4" />
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {content.location && (
                <motion.div variants={contactDetailsItem} className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink/45">
                    Baza / Lokalizacja
                  </span>
                  <p className="inline-flex items-center gap-2.5 font-serif text-lg text-ink sm:text-xl">
                    {content.location}
                    <MapPin className="h-4 w-4 text-ink/45" />
                  </p>
                </motion.div>
              )}

              {content.representation && (
                <motion.div variants={contactDetailsItem} className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink/45">
                    Reprezentacja / Agent
                  </span>
                  <h4 className="font-serif text-lg font-medium text-ink sm:text-xl">
                    {content.representation}
                  </h4>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        <footer className="mt-12 border-t border-ink/10 py-8">
          <div className="flex flex-col justify-between gap-5 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink/40 sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} {content.footerCopyrightName ?? "Weronika Malik"}</span>
            <span className="text-ink/30">{content.footerDesignerTag ?? "Projekt i realizacja"}</span>
          </div>
        </footer>
      </div>

      {/* Edit Drawer */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Sekcja Kontakt i Stopka"
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <Label htmlFor="contact-menu-label">Nazwa w menu</Label>
            <Input
              id="contact-menu-label"
              value={globalContent.sections.contact.label ?? "Kontakt"}
              onChange={(e) =>
                updateContent((draft) => {
                  draft.sections.contact.label = e.target.value;
                })
              }
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="contact-eyebrow">Eyebrow (nadnagłówek)</Label>
            <Input
              id="contact-eyebrow"
              value={content.eyebrow}
              onChange={(e) => updateContactField("eyebrow", e.target.value)}
              className="rounded-full"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="contact-heading">Nagłówek główny</Label>
            <Input
              id="contact-heading"
              value={content.heading}
              onChange={(e) => updateContactField("heading", e.target.value)}
              className="rounded-xl font-serif text-lg"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="contact-intro">Wstęp</Label>
            <Textarea
              id="contact-intro"
              value={content.intro}
              onChange={(e) => updateContactField("intro", e.target.value)}
              rows={3}
              className="rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                value={content.email}
                onChange={(e) => updateContactField("email", e.target.value)}
                className="rounded-full text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="contact-phone">Telefon</Label>
              <Input
                id="contact-phone"
                value={content.phone}
                onChange={(e) => updateContactField("phone", e.target.value)}
                className="rounded-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="contact-location">Lokalizacja</Label>
              <Input
                id="contact-location"
                value={content.location}
                onChange={(e) => updateContactField("location", e.target.value)}
                className="rounded-full text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="contact-agency">Agencja (reprezentacja)</Label>
              <Input
                id="contact-agency"
                value={content.representation}
                onChange={(e) => updateContactField("representation", e.target.value)}
                className="rounded-full text-xs"
              />
            </div>
          </div>



          {/* Footer Copyright Customization */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <Label className="text-xs font-bold uppercase tracking-[0.15em] text-ink/40 block mb-3">
              Ustawienia stopki
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <span className="text-[0.55rem] font-bold text-ink/30 uppercase">Nazwa copyright:</span>
                <Input
                  value={content.footerCopyrightName ?? "Weronika Malik"}
                  onChange={(e) => updateContactField("footerCopyrightName", e.target.value)}
                  className="rounded-full text-xs"
                />
              </div>
              <div className="grid gap-1">
                <span className="text-[0.55rem] font-bold text-ink/30 uppercase">Podpis twórców:</span>
                <Input
                  value={content.footerDesignerTag ?? "Projekt i realizacja"}
                  onChange={(e) => updateContactField("footerDesignerTag", e.target.value)}
                  className="rounded-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* Social Links List Customization */}
          <div className="border-t border-ink/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                Odnośniki społecznościowe ({content.socials.length})
              </Label>
              <Button variant="outline" size="sm" onClick={addSocial} className="h-8 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" /> Dodaj link
              </Button>
            </div>
            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {content.socials.map((social, index) => (
                <motion.div
                  layout
                  key={social.id}
                  className="grid grid-cols-[1fr_1.3fr_auto] items-center gap-2 rounded-xl border border-ink/10 bg-white p-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <Input
                    placeholder="Etykieta..."
                    value={social.label}
                    onChange={(e) => updateSocialField(index, "label", e.target.value)}
                    className="text-xs rounded-full h-8"
                  />
                  <Input
                    placeholder="URL..."
                    value={social.url}
                    onChange={(e) => updateSocialField(index, "url", e.target.value)}
                    className="text-xs rounded-full h-8"
                  />
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveSocial(index, -1)}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSocial(index, 1)}
                      disabled={index === content.socials.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSocialEnabled(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5 text-ink/50"
                    >
                      {social.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSocial(social.id)}
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
    </SectionReveal>
  );
}
