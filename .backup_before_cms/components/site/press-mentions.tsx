"use client";

import type { PressMention } from "@/lib/types";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";

export function PressMentions({ mentions }: { mentions: PressMention[] }) {
  return (
    <SectionReveal id="press" className="bg-white py-24">
      <div className="section-shell">
        <SectionHeading eyebrow="prasa" title="W mediach" align="center" />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {mentions.map((mention) => (
            <figure
              key={mention.id}
              className="border-y border-ink/10 px-2 py-10 text-center"
            >
              <blockquote className="font-serif text-3xl leading-tight text-ink">
                &quot;{mention.quote}&quot;
              </blockquote>
              <figcaption className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-ink/55">
                {mention.outlet}
                <span className="mt-2 block font-medium tracking-[0.16em] text-ink/35">
                  {mention.author}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
