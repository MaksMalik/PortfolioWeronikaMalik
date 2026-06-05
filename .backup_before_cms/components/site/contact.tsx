"use client";

import { FormEvent, useState } from "react";
import { Camera, ExternalLink, Film, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ContactContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";

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

export function Contact({ content }: { content: ContactContent }) {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return (
    <SectionReveal id="contact" className="bg-porcelain pb-10 pt-24">
      <div className="section-shell">
        <div className="grid gap-12 border-t border-ink/10 pt-14 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <SectionHeading eyebrow={content.eyebrow} title={content.heading} />
            <p className="mt-7 max-w-xl text-lg leading-8 text-graphite/75">
              {content.intro}
            </p>

            <div className="mt-10 grid gap-4 text-sm text-ink/70">
              <a className="flex items-center gap-3 hover:text-ink" href={`mailto:${content.email}`}>
                <Mail className="h-4 w-4" />
                {content.email}
              </a>
              <a className="flex items-center gap-3 hover:text-ink" href={`tel:${content.phone}`}>
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

            <div className="mt-10 flex flex-wrap gap-3">
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
          </div>

          <form className="grid gap-5 bg-white p-5 shadow-[0_20px_70px_rgba(16,16,16,0.06)] sm:p-8" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Temat</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Wiadomość</Label>
              <Textarea id="message" name="message" required />
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

        <footer className="mt-16 border-t border-ink/10 py-6">
          <div className="flex flex-col justify-between gap-5 text-xs uppercase tracking-[0.18em] text-ink/35 sm:flex-row sm:items-center">
            <span>(c) 2026 Weronika Malik</span>
            <div className="flex flex-wrap gap-3">
              {content.socials.filter((social) => social.enabled).map((social) => (
                <a
                  key={`footer-${social.id}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:bg-ink hover:text-white"
                  aria-label={social.label}
                >
                  {socialIcon(social.label)}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </SectionReveal>
  );
}
