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
      
      {/* Sections rendered if enabled OR in edit mode */}
      {(editMode || content.sections.hero.enabled) && (
        <Hero content={content.hero} />
      )}
      
      {(editMode || content.sections.about.enabled) && (
        <About content={content.about} />
      )}
      
      {(editMode || content.sections.portfolio.enabled) && (
        <PortfolioHighlights 
          projects={editMode ? content.portfolio : content.portfolio.filter((project) => project.enabled)} 
        />
      )}
      
      {(editMode || content.sections.showreel.enabled) && (
        <Showreel content={content.showreel} />
      )}
      
      {(editMode || content.sections.gallery.enabled) && (
        <Gallery 
          sessions={editMode ? content.gallery : content.gallery.filter((session) => session.enabled)} 
        />
      )}
      
      {(editMode || content.sections.press.enabled) && (
        <PressMentions 
          mentions={editMode ? content.press : content.press.filter((mention) => mention.enabled)} 
        />
      )}
      
      {(editMode || content.sections.contact.enabled) && (
        <Contact content={content.contact} />
      )}
    </motion.main>
  );
}
