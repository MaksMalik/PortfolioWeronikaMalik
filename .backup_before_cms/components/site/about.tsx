"use client";

import type { AboutContent } from "@/lib/types";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";
import { SectionHeading, SectionReveal } from "@/components/site/section-reveal";

export function About({ content }: { content: AboutContent }) {
  return (
    <SectionReveal id="about" className="border-y border-ink/10 bg-white py-24">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
        {content.image.enabled && (
          <div className="ornament-line pl-5 pt-5">
            <CinematicImage
              src={content.image.src}
              alt={content.image.alt}
              className="aspect-[4/5] max-h-[640px] border border-ink/10"
            />
          </div>
        )}

        <div className="max-w-2xl">
          <SectionHeading eyebrow={content.eyebrow} title={content.title} />
          <p className="mt-8 text-lg leading-8 text-graphite/80 sm:text-xl sm:leading-9">
            {content.body}
          </p>
          <div className="mt-10">
            <MagneticButton href="#contact" variant="outline">
              {content.buttonText}
            </MagneticButton>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
