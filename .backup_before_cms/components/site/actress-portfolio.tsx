"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSiteContent } from "@/lib/content-store";
import type { ContentTarget } from "@/lib/firebase/content";
import { startFirebaseAnalytics } from "@/lib/firebase/client";
import { About } from "@/components/site/about";
import { Contact } from "@/components/site/contact";
import { CustomCursor } from "@/components/site/custom-cursor";
import { Gallery } from "@/components/site/gallery";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { PortfolioHighlights } from "@/components/site/portfolio-highlights";
import { PressMentions } from "@/components/site/press-mentions";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { Showreel } from "@/components/site/showreel";

export function ActressPortfolio({ source = "live" }: { source?: ContentTarget }) {
  const content = useSiteContent(source);

  useEffect(() => {
    void startFirebaseAnalytics();
  }, []);

  return (
    <motion.main
      className="min-h-screen overflow-hidden bg-porcelain text-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <ScrollProgress />
      <CustomCursor />
      <Header monogram={content.hero.monogram} />
      {content.sections.hero.enabled && <Hero content={content.hero} />}
      {content.sections.about.enabled && <About content={content.about} />}
      {content.sections.portfolio.enabled && (
        <PortfolioHighlights projects={content.portfolio.filter((project) => project.enabled)} />
      )}
      {content.sections.showreel.enabled && <Showreel content={content.showreel} />}
      {content.sections.gallery.enabled && (
        <Gallery sessions={content.gallery.filter((session) => session.enabled)} />
      )}
      {content.sections.press.enabled && (
        <PressMentions mentions={content.press.filter((mention) => mention.enabled)} />
      )}
      {content.sections.contact.enabled && <Contact content={content.contact} />}
    </motion.main>
  );
}
