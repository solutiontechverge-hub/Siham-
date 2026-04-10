"use client";

import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import { Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";

export default function FixedLocationAnalyticsPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <FixedLocationPageScaffold activeTopTab="Analytics" topTabs={fixedLocationTopTabs}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          bgcolor: "#fff",
          px: 2.25,
          py: 2.1,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }}>Analytics</Typography>
        <Typography sx={{ mt: 0.75, color: theme.palette.text.secondary, fontSize: 13 }}>
          This page is ready — add your analytics content here.
        </Typography>
      </Paper>
    </FixedLocationPageScaffold>
  );
}

