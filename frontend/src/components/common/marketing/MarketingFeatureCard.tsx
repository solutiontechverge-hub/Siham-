"use client";

import * as React from "react";
import { Box, Card, CardContent, SvgIcon } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MoveToInboxRoundedIcon from "@mui/icons-material/MoveToInboxRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import WifiTetheringRoundedIcon from "@mui/icons-material/WifiTetheringRounded";
import { BodyText, CardTitle } from "../../ui/typography";

export type MarketingFeatureCardIconKey =
  "locations" | "business" | "chat" | "flow";

export type MarketingFeatureCardProps = {
  iconKey: MarketingFeatureCardIconKey;
  title: string;
  description: string;
};

function LocationsNetworkIcon({ sx }: { sx?: { fontSize?: number } }) {
  return (
    <SvgIcon sx={sx} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 3.2a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7zm6.4 4.65a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7zM18.4 14.9a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7zM5.6 7.85a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7zM5.6 14.9a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M12 5.7 17.2 9.1M17.2 10.7v3.9M16.9 16.4 13.1 18.6M10.9 18.6 7.1 16.4M6.8 14.6V10.7M6.8 9.1 12 5.7"
      />
      <circle cx="12" cy="19.15" r="1.35" fill="currentColor" />
    </SvgIcon>
  );
}

export function getMarketingFeatureIcon(iconKey: MarketingFeatureCardIconKey) {
  const sx = { fontSize: 18 };
  switch (iconKey) {
    case "locations":
      return <LocationsNetworkIcon sx={sx} />;
    case "business":
      return <MoveToInboxRoundedIcon sx={sx} />;
    case "chat":
      return <WifiTetheringRoundedIcon sx={sx} />;
    case "flow":
      return <SyncAltRoundedIcon sx={sx} />;
    default:
      return <LocationsNetworkIcon sx={sx} />;
  }
}

export default function MarketingFeatureCard({
  iconKey,
  title,
  description,
}: MarketingFeatureCardProps) {
  const m = useTheme().palette.mollure;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "12px",
        bgcolor: "rgba(255,255,255,0.96)",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        boxShadow: "0 14px 26px rgba(16, 35, 63, 0.12)",
        overflow: "hidden",
        position: "relative",
        "&:before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: m.teal,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              bgcolor: alpha(m.teal, 0.1),
              color: m.teal,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {getMarketingFeatureIcon(iconKey)}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <CardTitle
              sx={{
                fontSize: { xs: 14.5, md: 15.5 },
                lineHeight: 1.22,
              }}
            >
              {title}
            </CardTitle>
            <BodyText
              sx={{
                mt: 0.65,
                color: alpha(m.navy, 0.55),
                fontSize: { xs: 11.25, md: 11.75 },
                lineHeight: 1.55,
              }}
            >
              {description}
            </BodyText>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
