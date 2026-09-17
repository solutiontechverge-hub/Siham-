"use client";

import * as React from "react";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import FaceRetouchingNaturalOutlinedIcon from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { Avatar, Box, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureLabelSx,
} from "../../theme/mollureHierarchy";
import type { SvgIconComponent } from "@mui/icons-material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import AdminSectionCard from "./AdminSectionCard";
import type { ProfessionalCategory } from "./adminMockData";
import { useGetAdminProfessionalsQuery } from "../../store/services/adminApi";
import { ADMIN_CHART_SERIES } from "./adminChartColors";

const CATEGORY_ICONS: Record<string, SvgIconComponent> = {
  "Hair & Beauty": ContentCutOutlinedIcon,
  "Wellness & Spa": SpaOutlinedIcon,
  "Fitness & Training": FitnessCenterOutlinedIcon,
  "Make-up & Skincare": FaceRetouchingNaturalOutlinedIcon,
  Barber: StorefrontOutlinedIcon,
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  "Hair & Beauty": { bg: "rgba(33, 184, 191, 0.12)", fg: "#149CA7" },
  "Wellness & Spa": { bg: "rgba(127, 86, 217, 0.12)", fg: "#6941C6" },
  "Fitness & Training": { bg: "rgba(2, 132, 199, 0.12)", fg: "#0284C7" },
  "Make-up & Skincare": { bg: "rgba(236, 72, 153, 0.12)", fg: "#DB2777" },
  Barber: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803" },
};

const FALLBACK_COLORS = { bg: "rgba(33, 184, 191, 0.12)", fg: "#149CA7" };

function useProfessionalWidgetData() {
  const { data } = useGetAdminProfessionalsQuery();
  const items = data?.data?.items ?? [];
  const summary = data?.data?.summary ?? {
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    inactive: 0,
    growthTrend: 0,
  };

  const verificationOverview = [
    { name: "Verified", value: summary.verified },
    { name: "Pending", value: summary.pending },
    { name: "Rejected", value: summary.rejected },
    { name: "Inactive", value: summary.inactive },
  ];

  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    const key = item.primaryCategory || "Hair & Beauty";
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name: name as ProfessionalCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { items, summary, verificationOverview, topCategories };
}

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SummaryRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  const tokens = useTheme().palette.mollure;
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
    >
      <Typography sx={mollureBodyMutedSx(tokens.navy, { color: tokens.bodyText })}>
        {label}
      </Typography>
      <Stack alignItems="flex-end" spacing={0.15}>
        <Typography sx={mollureBodySx(tokens.navy, { fontWeight: 700, color: tokens.navy })}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        {sub ? (
          <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 10.5, color: tokens.slate })}>
            {sub}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

export function ProfessionalSummaryWidget() {
  const tokens = useTheme().palette.mollure;
  const { summary } = useProfessionalWidgetData();
  const { total, verified, pending, rejected, inactive } = summary;
  const pct = (n: number) =>
    total ? `${((n / total) * 100).toFixed(1)}% of total` : "0% of total";

  return (
    <AdminSectionCard title="Professional Summary" compact>
      <Stack spacing={1.5}>
        <SummaryRow label="Total Professionals" value={total} />
        <SummaryRow label="Verified" value={verified} sub={pct(verified)} />
        <SummaryRow
          label="Pending Verification"
          value={pending}
          sub={pct(pending)}
        />
        <SummaryRow label="Rejected" value={rejected} sub={pct(rejected)} />
        <SummaryRow label="Inactive" value={inactive} sub={pct(inactive)} />
      </Stack>
      <Box
        sx={{
          mt: 2,
          p: 1.25,
          borderRadius: 2,
          bgcolor: alpha(tokens.teal, 0.05),
          border: `1px solid ${alpha(tokens.teal, 0.12)}`,
        }}
      >
        <Typography
          sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.bodyText, lineHeight: 1.45 })}
        >
          Platform-wide professional metrics. Filter the table to drill into
          specific segments.
        </Typography>
      </Box>
    </AdminSectionCard>
  );
}

export function VerificationOverviewWidget() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const [ready, setReady] = React.useState(false);
  const { verificationOverview } = useProfessionalWidgetData();
  const total = verificationOverview.reduce((sum, d) => sum + d.value, 0) || 1;

  React.useEffect(() => setReady(true), []);

  return (
    <AdminSectionCard title="Verification Overview" compact>
      <Box sx={{ width: "100%", height: 200, position: "relative" }}>
        {ready ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationOverview}
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="72%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {verificationOverview.map((_, i) => (
                    <Cell
                      key={i}
                      fill={ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${tokens.cardBorder}`,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <Typography
                sx={{ fontSize: 18, fontWeight: 700, color: tokens.navy }}
              >
                {total.toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: 10, color: tokens.slate }}>
                Total
              </Typography>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: 2,
              bgcolor: tokens.surface,
            }}
          />
        )}
      </Box>
      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {verificationOverview.map((item, i) => (
          <Stack
            key={item.name}
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length],
                flexShrink: 0,
              }}
            />
            <Typography
              sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11.5, color: tokens.bodyText, flex: 1 })}
            >
              {item.name}
            </Typography>
            <Typography
              sx={mollureLabelSx(tokens.navy, { fontSize: 11.5, fontWeight: 600, color: tokens.navy })}
            >
              {((item.value / total) * 100).toFixed(1)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </AdminSectionCard>
  );
}

export function TopCategoriesWidget() {
  const tokens = useTheme().palette.mollure;
  const { topCategories } = useProfessionalWidgetData();
  const maxCount = topCategories[0]?.count ?? 1;

  return (
    <AdminSectionCard title="Top Categories" compact>
      <Stack spacing={1.75}>
        {topCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.name] || StorefrontOutlinedIcon;
          const colors = CATEGORY_COLORS[cat.name] || FALLBACK_COLORS;
          return (
            <Box key={cat.name}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.75 }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: colors.bg,
                    color: colors.fg,
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 16 }} />
                </Box>
                <Typography
                  sx={mollureBodySx(tokens.navy, {
                    fontWeight: 500,
                    color: tokens.navy,
                    flex: 1,
                  })}
                >
                  {cat.name}
                </Typography>
                <Typography
                  sx={mollureBodySx(tokens.navy, { fontWeight: 700, color: tokens.navy })}
                >
                  {cat.count.toLocaleString()}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(cat.count / maxCount) * 100}
                sx={{
                  height: 5,
                  borderRadius: 3,
                  bgcolor: alpha(tokens.teal, 0.08),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    bgcolor: colors.fg,
                  },
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </AdminSectionCard>
  );
}

export function RecentlyJoinedWidget() {
  const tokens = useTheme().palette.mollure;
  const { items } = useProfessionalWidgetData();
  const recent = [...items]
    .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate))
    .slice(0, 3);

  return (
    <AdminSectionCard title="Recently Joined Professionals" compact>
      <Stack spacing={1.75}>
        {recent.map((pro) => {
          const colors = CATEGORY_COLORS[pro.primaryCategory] || FALLBACK_COLORS;
          return (
            <Stack
              key={pro.id}
              direction="row"
              spacing={1.25}
              alignItems="center"
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: colors.bg,
                  color: colors.fg,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {getInitials(pro.brandName)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={mollureLabelSx(tokens.navy, {
                    fontWeight: 600,
                    color: tokens.navy,
                  })}
                  noWrap
                >
                  {pro.brandName}
                </Typography>
                <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.bodyText })}>
                  Joined {formatDisplayDate(pro.registrationDate)}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </AdminSectionCard>
  );
}
