"use client";

import { Box } from "@mui/material";
import {
  MarketingSiteFooter,
  MarketingSiteHeader,
} from "../../components/common";
import {
  AboutFaqAccordion,
  AboutHero,
  AboutSplitSection,
} from "../../components/about";
import {
  marketingShellFooter,
  marketingShellHeader,
} from "../../data/marketingShell.data";
import { aboutPageData } from "./about.data";

export default function AboutPage() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <MarketingSiteHeader
        navItems={[...marketingShellHeader.navItems]}
        localeLabel={marketingShellHeader.localeLabel}
        loginLabel={marketingShellHeader.loginLabel}
        professionalLinkLabel={marketingShellHeader.professionalLinkLabel}
        professionalHref={marketingShellHeader.professionalHref}
      />

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

      <AboutFaqAccordion
        title={aboutPageData.faq.title}
        items={aboutPageData.faq.items}
      />

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
      />
    </Box>
  );
}
