"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAdminEdit } from "@/components/admin/admin-edit-context";
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
import { AdminBar } from "@/components/admin/admin-bar";

export function ActressPortfolio() {
  const { content, isAdmin, editMode } = useAdminEdit();

  useEffect(() => {
    void startFirebaseAnalytics();
  }, []);

  const sectionsConfig = [
    {
      id: "hero",
      enabled: content.sections.hero.enabled,
      render: (bgClass: string) => <Hero key="hero" content={content.hero} />
    },
    {
      id: "about",
      enabled: content.sections.about.enabled,
      render: (bgClass: string) => <About key="about" content={content.about} bgClass={bgClass} />
    },
    {
      id: "portfolio",
      enabled: content.sections.portfolio.enabled,
      render: (bgClass: string) => (
        <PortfolioHighlights
          key="portfolio"
          projects={editMode ? content.portfolio : content.portfolio.filter((project) => project.enabled)}
          bgClass={bgClass}
        />
      )
    },
    {
      id: "showreel",
      enabled: content.sections.showreel.enabled,
      render: (bgClass: string) => <Showreel key="showreel" content={content.showreel} bgClass={bgClass} />
    },
    {
      id: "gallery",
      enabled: content.sections.gallery.enabled,
      render: (bgClass: string) => (
        <Gallery
          key="gallery"
          sessions={editMode ? content.gallery : content.gallery.filter((session) => session.enabled)}
          bgClass={bgClass}
        />
      )
    },
    {
      id: "press",
      enabled: content.sections.press.enabled,
      render: (bgClass: string) => (
        <PressMentions
          key="press"
          mentions={editMode ? content.press : content.press.filter((mention) => mention.enabled)}
          bgClass={bgClass}
        />
      )
    },
    {
      id: "contact",
      enabled: content.sections.contact.enabled,
      render: (bgClass: string) => <Contact key="contact" content={content.contact} bgClass={bgClass} />
    }
  ];

  const renderedSections = sectionsConfig.filter((sec) => editMode || sec.enabled);

  let nonHeroIndex = 0;

  return (
    <motion.main
      className="relative"
      style={{ paddingBottom: isAdmin ? "5.75rem" : "0px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <ScrollProgress />
      <CustomCursor />
      <AdminBar />
      <Header monogram={content.hero.monogram} />

      {renderedSections.map((sec) => {
        let bgClass = "bg-white";
        
        if (sec.id !== "hero") {
          bgClass = nonHeroIndex % 2 === 0 ? "bg-porcelain" : "bg-white";
          nonHeroIndex++;
        }
        
        return sec.render(bgClass);
      })}
    </motion.main>
  );
}
