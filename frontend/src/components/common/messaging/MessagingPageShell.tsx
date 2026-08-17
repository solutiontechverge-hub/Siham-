"use client";

import * as React from "react";
import { Box, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "../../../store/hooks";
import {
  MarketingSiteFooter,
  MarketingSiteHeader,
  MollureMarketingHeader,
} from "..";
import {
  stickyFooterAnchorSx,
  stickyFooterGrowSx,
  stickyFooterPageSx,
} from "../StickyFooterPageShell";
import {
  marketingShellFooter,
  professionalsMarketingFooter,
} from "../../../data/marketingShell.data";
import MessagingPageView from "./MessagingPageView";
import type { MessagingAudience } from "./messagingRoutes";
import { useMessagingCurrentUserProfile } from "./useMessagingCurrentUserProfile";

export type MessagingPageShellProps = {
  audience: MessagingAudience;
  homeHref?: string;
};

export default function MessagingPageShell({
  audience,
  homeHref,
}: MessagingPageShellProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const user = useAppSelector((s) => s.auth.user);
  const { userName, avatarUrl } = useMessagingCurrentUserProfile(audience);

  const resolvedHome =
    homeHref ??
    (audience === "client" ? "/" : "/professionals/fixed-location/calendar");

  const pageBg = m.pageBg;

  const footer =
    audience === "client" ? (
      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
        sx={stickyFooterAnchorSx}
      />
    ) : (
      <MarketingSiteFooter
        columns={professionalsMarketingFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={professionalsMarketingFooter.copyright}
        sx={stickyFooterAnchorSx}
      />
    );

  return (
    <Box sx={{ ...stickyFooterPageSx, bgcolor: pageBg }}>
      {audience === "client" ? (
        <MollureMarketingHeader
          navItems={[]}
          isAuthed
          userLabel={user?.email ?? ""}
          userName={userName}
          userAvatarSrc={avatarUrl}
          homeHref={resolvedHome}
        />
      ) : (
        <MarketingSiteHeader
          navItems={[]}
          primaryActionLabel="signup"
          primaryActionHref="/auth/signup"
          professionalLinkLabel=""
          withDivider
        />
      )}

      <Box sx={{ ...stickyFooterGrowSx, flex: 1 }}>
        <Container
          maxWidth="lg"
          sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 3 }, flex: 1 }}
        >
          <MessagingPageView
            audience={audience}
            currentUserName={userName}
            currentUserAvatarSrc={avatarUrl}
          />
        </Container>
      </Box>

      {footer}
    </Box>
  );
}
