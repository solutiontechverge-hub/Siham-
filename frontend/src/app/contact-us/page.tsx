"use client";

import { Box } from "@mui/material";
import { MarketingSiteFooter, MarketingSiteHeader } from "../../components/common";
import ContactUs from "../../components/common/ContactUs";
import { marketingShellFooter, marketingShellHeader } from "../../data/marketingShell.data";

export default function ContactUsPage() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <MarketingSiteHeader
        navItems={[...marketingShellHeader.navItems]}
        localeLabel={marketingShellHeader.localeLabel}
        loginLabel={marketingShellHeader.loginLabel}
        professionalLinkLabel={marketingShellHeader.professionalLinkLabel}
        professionalHref={marketingShellHeader.professionalHref}
      />

      <ContactUs illustrationSrc="/about/about-gears-photo.png" />

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

