"use client";

import AppButton from "../AppButton";
import { alpha, useTheme } from "@mui/material/styles";
import { Paper, Stack, Typography } from "@mui/material";

export function BusinessPublicProfileBookBanner(props: {
  selectionSummary: {
    count: number;
    durationLabel: string;
    totalPrice: number;
  };
  onBookNow: () => void;
}) {
  const { selectionSummary, onBookNow } = props;
  const m = useTheme().palette.mollure;
  if (selectionSummary.count <= 0) return null;

  return (

        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            left: { xs: 12, sm: 16, md: "50%" },
            right: { xs: 12, sm: 16, md: "auto" },
            bottom: { xs: 12, sm: 16 },
            zIndex: 1300,
            width: {
              md: "min(960px, calc(100% - 48px))",
            },
            transform: { md: "translateX(-50%)" },
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            boxShadow: "0 8px 28px rgba(16,35,63,0.14)",
            px: { xs: 2, sm: 2.5 },
            py: 1.35,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography
              sx={{
                fontSize: { xs: 12, sm: 13 },
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                lineHeight: 1.35,
              }}
            >
              {`${selectionSummary.count} service${selectionSummary.count > 1 ? "s" : ""} selected - Total: ${selectionSummary.durationLabel} for ${selectionSummary.totalPrice} EUR`}
            </Typography>
            <AppButton
              tone="primary"
              onClick={onBookNow}
              sx={{
                minWidth: 132,
                height: 40,
                px: 2.5,
                flexShrink: 0,
                boxShadow: "none",
              }}
            >
              Book Now
            </AppButton>
          </Stack>
        </Paper>
      
  );
}
