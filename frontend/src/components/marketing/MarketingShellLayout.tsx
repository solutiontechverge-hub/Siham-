"use client";

import * as React from "react";
import { Box } from "@mui/material";
import MarketingSiteFooter from "../common/MarketingSiteFooter";
import { stickyFooterAnchorSx, stickyFooterPageSx } from "../common/StickyFooterPageShell";
import MollureMarketingHeader from "../common/MollureMarketingHeader";
import {
  clientsShellHeader,
  marketingShellFooter,
  professionalsMarketingFooter,
  professionalsMarketingHeader,
} from "../../data/marketingShell.data";
import { useAppSelector } from "../../store/hooks";
import { getPersistedAuthSession } from "../../lib/auth-storage";

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
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [persisted] = React.useState(() =>
    typeof window === "undefined" ? null : getPersistedAuthSession(),
  );
  const isAuthed = Boolean(accessToken || persisted?.accessToken);

  const footerData =
    audience === "clients"
      ? marketingShellFooter
      : professionalsMarketingFooter;
  const footer = (
    <MarketingSiteFooter
      columns={footerData.columns.map((col) => ({
        title: col.title,
        items: [...col.items],
      }))}
      copyright={footerData.copyright}
      sx={stickyFooterAnchorSx}
    />
  );

  if (audience === "clients") {
    const h = clientsShellHeader;
    return (
      <Box
        sx={{
          ...stickyFooterPageSx,
          bgcolor: "background.default",
          ...(contentSx ?? {}),
        }}
      >
        <MollureMarketingHeader
          navItems={[...h.navItems]}
          localeLabel={h.localeLabel}
          loginLabel={h.loginLabel}
          homeHref="/"
          isAuthed={isAuthed}
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
    <Box
      sx={{
        ...stickyFooterPageSx,
        bgcolor: "background.default",
        ...(contentSx ?? {}),
      }}
    >
      <MollureMarketingHeader
        navItems={[...h.navItems]}
        localeLabel={h.localeLabel}
        loginLabel={h.loginLabel}
        isAuthed={isAuthed}
        professionalLinkLabel={h.professionalLinkLabel}
        professionalHref={h.professionalHref}
        homeHref="/professionals"
      />
      {children}
      {hideFooter ? null : footer}
    </Box>
  );
}
