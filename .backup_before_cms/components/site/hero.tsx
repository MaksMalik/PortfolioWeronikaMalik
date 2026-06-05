"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { HeroContent } from "@/lib/types";
import { CinematicImage } from "@/components/site/cinematic-image";
import { MagneticButton } from "@/components/site/magnetic-button";

export function Hero({ content }: { content: HeroContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "11%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const nameWords = content.name.split(" ");

  return (
    <section
      id="home"
      ref={ref}
      className="relative flex min-h-[80svh] items-end overflow-hidden pt-24"
    >
      <div className="absolute inset-x-0 top-20 h-px bg-ink/10" />
      <div className="section-shell grid min-h-[calc(80svh-6rem)] items-center gap-10 pb-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        {content.image.enabled && (
          <motion.div
            style={{ y: imageY }}
            className="h-[54svh] min-h-[380px] lg:h-[64svh]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <CinematicImage
              src={content.image.src}
              alt={content.image.alt}
              className="h-full rounded-t-full border border-ink/10 shadow-editorial"
            />
          </motion.div>
        )}

        <motion.div style={{ y: textY }} className="pb-6">
          <motion.div
            className="mb-9 flex items-center gap-4 text-[0.66rem] font-bold uppercase tracking-[0.24em] text-ink/45"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="h-px w-16 bg-silver" />
            <span>film / teatr / głos</span>
          </motion.div>

          <h1 className="max-w-[760px] font-serif text-[clamp(3.2rem,7.1vw,7.2rem)] font-medium uppercase leading-[0.88] text-ink">
            {nameWords.map((word, wordIndex) => (
              <span key={word} className="block whitespace-nowrap">
                {word.split("").map((letter, letterIndex) => {
                  const index = wordIndex * 9 + letterIndex;

                  return (
                    <motion.span
                      key={`${word}-${letter}-${letterIndex}`}
                      className="inline-block"
                      initial={{ opacity: 0, y: 54, rotateX: -18 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{
                        delay: 0.1 + index * 0.035,
                        duration: 0.72,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                    >
                      {letter}
                    </motion.span>
                  );
                })}
              </span>
            ))}
          </h1>

          <motion.div
            className="mt-8 max-w-xl space-y-7"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-ink/55">
              {content.tagline}
            </p>
            <p className="font-serif text-3xl leading-tight text-graphite sm:text-4xl">
              {content.quote}
            </p>
            <MagneticButton href="#work">{content.buttonText}</MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
