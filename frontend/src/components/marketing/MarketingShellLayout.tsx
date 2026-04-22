"use client";

import * as React from "react";
import { Box } from "@mui/material";
import MarketingSiteFooter from "../common/MarketingSiteFooter";
import MollureMarketingHeader from "../common/MollureMarketingHeader";
import {
  clientsShellHeader,
  marketingShellFooter,
  professionalsMarketingFooter,
  professionalsMarketingHeader,
} from "../../data/marketingShell.data";

export type MarketingAudience = "clients" | "professionals";

type MarketingShellLayoutProps = {
  audience: MarketingAudience;
  children: React.ReactNode;
  /** Override default shell background (e.g. how-it-works uses its own inner bg) */
  contentSx?: object;
  /** Hide the marketing footer for special pages (e.g. contact-us). */
  hideFooter?: boolean;
};

export function MarketingShellLayout({
  audience,
  children,
  contentSx,
  hideFooter,
}: MarketingShellLayoutProps) {
  const footerData = audience === "clients" ? marketingShellFooter : professionalsMarketingFooter;
  const footer = (
    <MarketingSiteFooter
      columns={footerData.columns.map((col) => ({
        title: col.title,
        items: [...col.items],
      }))}
      copyright={footerData.copyright}
    />
  );

  if (audience === "clients") {
    const h = clientsShellHeader;
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", ...(contentSx ?? {}) }}>
        <MollureMarketingHeader
          navItems={[...h.navItems]}
          localeLabel={h.localeLabel}
          loginLabel={h.loginLabel}
          homeHref="/clients"
          professionalLinkLabel={h.professionalLinkLabel}
          professionalHref={h.professionalHref}
        />
        {children}
        {hideFooter ? null : footer}
      </Box>
    );
  }

  const h = professionalsMarketingHeader;
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", ...(contentSx ?? {}) }}>
      <MollureMarketingHeader
        navItems={[...h.navItems]}
        localeLabel={h.localeLabel}
        loginLabel={h.loginLabel}
        professionalLinkLabel={h.professionalLinkLabel}
        professionalHref={h.professionalHref}
        homeHref="/professionals"
      />
      {children}
      {hideFooter ? null : footer}
    </Box>
  );
}
