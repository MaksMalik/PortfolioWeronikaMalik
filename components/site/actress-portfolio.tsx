"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { IntroLoader } from "@/components/site/intro-loader";

export function ActressPortfolio() {
  const { content, isAdmin, editMode } = useAdminEdit();
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    void startFirebaseAnalytics();
  }, []);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("has-seen-intro");
    if (hasSeenIntro === "true") {
      setShowLoader(false);
      setIsLoaderComplete(true);
    }
  }, []);

  const handleLoaderComplete = () => {
    sessionStorage.setItem("has-seen-intro", "true");
    setIsLoaderComplete(true);
  };

  const shouldShowLoader = showLoader && !isLoaderComplete && !editMode;

  const sectionsConfig = [
    {
      id: "hero",
      enabled: content.sections.hero.enabled,
      render: () => <Hero key="hero" content={content.hero} isLoaded={isLoaderComplete} />
    },
    {
      id: "about",
      enabled: content.sections.about.enabled,
      render: (bgClass: string, reverseParallax?: boolean) => (
        <About key="about" content={content.about} bgClass={bgClass} reverseParallax={reverseParallax} />
      )
    },
    {
      id: "portfolio",
      enabled: content.sections.portfolio.enabled,
      render: (bgClass: string, reverseParallax?: boolean) => (
        <PortfolioHighlights
          key="portfolio"
          projects={editMode ? content.portfolio : content.portfolio.filter((project) => project.enabled)}
          bgClass={bgClass}
          reverseParallax={reverseParallax}
        />
      )
    },
    {
      id: "showreel",
      enabled: content.sections.showreel.enabled,
      render: (bgClass: string, reverseParallax?: boolean) => (
        <Showreel key="showreel" content={content.showreel} bgClass={bgClass} reverseParallax={reverseParallax} />
      )
    },
    {
      id: "gallery",
      enabled: content.sections.gallery.enabled,
      render: (bgClass: string, reverseParallax?: boolean) => (
        <Gallery
          key="gallery"
          sessions={editMode ? content.gallery : content.gallery.filter((session) => session.enabled)}
          bgClass={bgClass}
          reverseParallax={reverseParallax}
        />
      )
    },
    {
      id: "press",
      enabled: content.sections.press.enabled,
      render: (bgClass: string, reverseParallax?: boolean) => (
        <PressMentions
          key="press"
          mentions={editMode ? content.press : content.press.filter((mention) => mention.enabled)}
          bgClass={bgClass}
          reverseParallax={reverseParallax}
        />
      )
    },
    {
      id: "contact",
      enabled: content.sections.contact.enabled,
      render: (bgClass: string, reverseParallax?: boolean) => (
        <Contact key="contact" content={content.contact} bgClass={bgClass} reverseParallax={reverseParallax} />
      )
    }
  ];

  const defaultOrder = ["hero", "about", "portfolio", "showreel", "gallery", "press", "contact"];
  const order = content.sectionsOrder ?? defaultOrder;
  const orderMap = new Map(order.map((id, idx) => [id, idx]));

  const sortedSections = [...sectionsConfig].sort((a, b) => {
    const aIndex = orderMap.has(a.id) ? orderMap.get(a.id)! : defaultOrder.indexOf(a.id);
    const bIndex = orderMap.has(b.id) ? orderMap.get(b.id)! : defaultOrder.indexOf(b.id);
    return aIndex - bIndex;
  });

  const renderedSections = sortedSections.filter((sec) => editMode || sec.enabled);

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
        let reverseParallax = false;
        
        if (sec.id !== "hero") {
          bgClass = nonHeroIndex % 2 === 0 ? "bg-porcelain" : "bg-white";
          reverseParallax = nonHeroIndex % 2 !== 0;
          nonHeroIndex++;
        }
        
        return sec.render(bgClass, reverseParallax);
      })}

      <AnimatePresence>
        {shouldShowLoader && (
          <IntroLoader monogram={content.hero.monogram} onComplete={handleLoaderComplete} />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
