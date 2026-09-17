"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Bullet,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function NotificationsCard() {
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
            Notifications
          </Typography>
        </Box>

        <Typography
          sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Never Miss An Important Update.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={tokens.teal}>
            In-app notifications and emails are sent for important booking
            actions
          </Bullet>
          <Bullet color={tokens.teal}>
            This includes booking requests, edits, confirmations, cancellations,
            and payment-related updates
          </Bullet>
          <Bullet color={tokens.teal}>
            All notifications include direct access to the booking for quick
            review and action
          </Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}
