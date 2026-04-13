"use client";

import * as React from "react";
import { Box, Card, CardContent } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import { BodyText, CardTitle } from "../ui/typography";

export type MarketingFeatureCardIconKey =
  | "locations"
  | "business"
  | "chat"
  | "flow";

export type MarketingFeatureCardProps = {
  iconKey: MarketingFeatureCardIconKey;
  title: string;
  description: string;
};

export function getMarketingFeatureIcon(iconKey: MarketingFeatureCardIconKey) {
  const sx = { fontSize: 18 };
  switch (iconKey) {
    case "locations":
      return <PlaceRoundedIcon sx={sx} />;
    case "business":
      return <BusinessRoundedIcon sx={sx} />;
    case "chat":
      return <ChatBubbleRoundedIcon sx={sx} />;
    case "flow":
      return <SyncAltRoundedIcon sx={sx} />;
    default:
      return <PlaceRoundedIcon sx={sx} />;
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
        border: `1px solid ${alpha(m.navy, 0.10)}`,
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
              bgcolor: alpha(m.teal, 0.10),
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

