"use client";

import * as React from "react";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AdminSectionCard from "./AdminSectionCard";
import {
  ACTION_STYLES,
  activitySummaryCounts,
  recentActivityAlerts,
  topActivityUsers,
} from "./activityLogData";

export function ActivitySummaryWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard title="Activity Summary" description="This Week" compact>
      <Stack spacing={1.25}>
        {activitySummaryCounts.map((item) => {
          const style = ACTION_STYLES[item.action];
          return (
            <Stack
              key={item.action}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: style.color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}
                >
                  {style.label}
                </Typography>
              </Stack>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: tokens.navy }}
              >
                {item.count.toLocaleString()}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </AdminSectionCard>
  );
}

export function TopActivityUsersWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard title="Top Users" compact>
      <Stack spacing={1.25}>
        {topActivityUsers.map((user) => (
          <Stack
            key={user.id}
            direction="row"
            alignItems="center"
            spacing={1.25}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: alpha(tokens.teal, 0.12),
                color: tokens.tealDark,
              }}
            >
              {user.initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
                noWrap
              >
                {user.name}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: tokens.slate }} noWrap>
                {user.email}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: tokens.teal,
                flexShrink: 0,
              }}
            >
              {user.count.toLocaleString()}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </AdminSectionCard>
  );
}

const ALERT_ICONS = {
  error: ErrorOutlineRoundedIcon,
  warning: WarningAmberRoundedIcon,
  info: InfoOutlinedIcon,
} as const;

const ALERT_COLORS = {
  error: "#D92D20",
  warning: "#DC6803",
  info: "#2563EB",
} as const;

export function RecentActivityAlertsWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard title="Recent Alerts" compact>
      <Stack spacing={1.25}>
        {recentActivityAlerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.severity];
          const color = ALERT_COLORS[alert.severity];
          return (
            <Stack
              key={alert.id}
              direction="row"
              spacing={1.25}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(color, 0.1),
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 16, color }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
                    noWrap
                  >
                    {alert.title}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 10.5, color: tokens.slate, flexShrink: 0 }}
                  >
                    {alert.time}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: tokens.bodyText,
                    mt: 0.25,
                    lineHeight: 1.4,
                  }}
                >
                  {alert.description}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </AdminSectionCard>
  );
}

export default function AdminActivityLogWidgets() {
  return (
    <Stack spacing={1.5}>
      <ActivitySummaryWidget />
      <TopActivityUsersWidget />
      <RecentActivityAlertsWidget />
    </Stack>
  );
}
