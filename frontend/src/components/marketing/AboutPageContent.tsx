"use client";

import { AboutFaqAccordion, AboutHero, AboutSplitSection } from "../about";
import { aboutPageData } from "../../app/about/about.data";
import type { MarketingAudience } from "./MarketingShellLayout";

export function AboutPageContent({
  audience = "clients",
}: {
  audience?: MarketingAudience;
}) {
  const isProfessionals = audience === "professionals";
  const faqItems = isProfessionals
    ? aboutPageData.faq.professionalItems
    : aboutPageData.faq.clientItems;
  const splitParagraphs = isProfessionals
    ? aboutPageData.split.professionalParagraphs
    : aboutPageData.split.clientParagraphs;

  return (
    <>
      <AboutHero
        title={aboutPageData.hero.title}
        subtitle={aboutPageData.hero.subtitle}
        imageSrc={aboutPageData.hero.imageSrc}
        imageAlt={aboutPageData.hero.imageAlt}
      />

      <AboutSplitSection
        imageSrc={aboutPageData.split.imageSrc}
        imageAlt={aboutPageData.split.imageAlt}
        panelTitle={aboutPageData.split.panelTitle}
        paragraphs={[...splitParagraphs]}
      />

      <AboutFaqAccordion
        title={aboutPageData.faq.title}
        items={faqItems}
      />
    </>
  );
}
