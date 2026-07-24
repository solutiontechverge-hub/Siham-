"use client";

import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import type { SvgIconComponent } from "@mui/icons-material";
import AppCard from "../common/AppCard";
import { ADMIN_CARD_PADDING as pad } from "./adminCardPadding";

type AdminKpiCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: number;
  trendLabel?: string;
  icon?: SvgIconComponent;
  iconColor?: string;
  iconBg?: string;
  /** When true, a positive trend is shown as negative (e.g. reported users). */
  invertTrend?: boolean;
  compact?: boolean;
};

export default function AdminKpiCard({
  label,
  value,
  sublabel,
  trend,
  trendLabel = "vs prior period",
  icon: Icon,
  iconColor,
  iconBg,
  invertTrend = false,
  compact = false,
}: AdminKpiCardProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const trendUp = trend !== undefined && (invertTrend ? trend < 0 : trend >= 0);

  return (
    <AppCard
      sx={{
        p: compact ? pad.kpiCompact : pad.kpi,
        borderRadius: 3,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "0 8px 24px rgba(16, 35, 63, 0.06)",
        bgcolor: tokens.white,
        height: "100%",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: compact ? 12 : 13,
              fontWeight: 500,
              color: tokens.slate,
              lineHeight: 1.3,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? 20 : 28,
              fontWeight: 700,
              color: tokens.navy,
              lineHeight: 1.1,
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
          {sublabel ? (
            <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
              {sublabel}
            </Typography>
          ) : null}
          {trend !== undefined ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mt: 0.5 }}
            >
              {trendUp ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: tokens.teal }} />
              ) : (
                <TrendingDownIcon
                  sx={{ fontSize: 16, color: tokens.requestAccent }}
                />
              )}
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: trendUp ? tokens.teal : tokens.requestAccent,
                }}
              >
                {trendUp ? "+" : ""}
                {trend}% {trendLabel}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
        {Icon ? (
          <Box
            sx={{
              width: compact ? 38 : 44,
              height: compact ? 38 : 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: iconBg ?? alpha(tokens.teal, 0.12),
              color: iconColor ?? tokens.teal,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: compact ? 20 : 22 }} />
          </Box>
        ) : null}
      </Stack>
    </AppCard>
  );
}
