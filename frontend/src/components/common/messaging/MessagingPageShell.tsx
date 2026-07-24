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
  marketingShellFooter,
  professionalsMarketingFooter,
} from "../../../data/marketingShell.data";
import MessagingPageView from "./MessagingPageView";
import type { MessagingAudience } from "./messagingRoutes";

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
  const fallbackDisplayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();
  const [userName, setUserName] = React.useState(fallbackDisplayName || "User");
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(
    undefined,
  );

  const resolvedHome =
    homeHref ??
    (audience === "client" ? "/" : "/professionals/fixed-location/calendar");

  const pageBg = m.pageBg;

  React.useEffect(() => {
    if (audience !== "client") return;
    try {
      const raw = window.localStorage.getItem("mollure:client_profile");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        avatar_url?: string | null;
        email?: string;
        first_name?: string;
        last_name?: string;
        display_name?: string;
      };
      const authedEmail = user?.email?.trim().toLowerCase();
      const persistedEmail = data?.email?.trim().toLowerCase();
      if (authedEmail && persistedEmail && authedEmail === persistedEmail) {
        if (typeof data.avatar_url === "string" && data.avatar_url)
          setAvatarUrl(data.avatar_url);
        const persistedName = (data.display_name ?? "").trim();
        const fullName =
          `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        const resolved = persistedName || fullName;
        if (resolved) setUserName(resolved);
      }
    } catch {
      // ignore
    }
  }, [audience, user?.email]);

  React.useEffect(() => {
    const next = fallbackDisplayName.trim();
    if (next) setUserName(next);
  }, [fallbackDisplayName]);

  const footer =
    audience === "client" ? (
      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
      />
    ) : (
      <MarketingSiteFooter
        columns={professionalsMarketingFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={professionalsMarketingFooter.copyright}
        sx={{ mt: 2 }}
      />
    );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg }}>
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

      <Container
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 3 } }}
      >
        <MessagingPageView
          audience={audience}
          currentUserName={userName}
          currentUserAvatarSrc={avatarUrl}
        />
      </Container>

      {footer}
    </Box>
  );
}
