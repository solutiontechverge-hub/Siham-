"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Bullet,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function ClientManagementInsightsCard() {
  const tokens = useTheme().palette.mollure;


  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: alpha(tokens.teal, 0.06),
        boxShadow: MARKETING_CARD_SHADOW,
      }}
    >
      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: MARKETING_CARD_SHADOW_INNER,
          }}
        >
          <Typography
            sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}
          >
            Client Management &amp; Insights
          </Typography>
        </Box>

        <Typography
          sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Understand Your Clients And Build Stronger Relationships.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={tokens.teal}>Overview of all clients in one place</Bullet>
          <Bullet color={tokens.teal}>
            Includes both registered Mollure clients and client profiles you
            created
          </Bullet>
          <Bullet color={tokens.teal}>Access client details and client-level insights</Bullet>
          <Bullet color={tokens.teal}>Add internal notes to track preferences and context</Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}
