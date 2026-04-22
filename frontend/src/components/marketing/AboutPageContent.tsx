"use client";

import {
  AboutFaqAccordion,
  AboutHero,
  AboutSplitSection,
} from "../about";
import { aboutPageData } from "../../app/about/about.data";

export function AboutPageContent() {
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
        paragraphs={aboutPageData.split.paragraphs}
      />

      <AboutFaqAccordion title={aboutPageData.faq.title} items={aboutPageData.faq.items} />
    </>
  );
}
