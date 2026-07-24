"use client";

import * as React from "react";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AdminSectionCard from "./AdminSectionCard";
import { ADMIN_CARD_PADDING as pad } from "./adminCardPadding";
import { AdminSectionLink } from "./AdminDashboardHeader";
import { ADMIN_QUICK_LINKS } from "./dashboardData";
import type {
  AdminDashboardActivityItem,
  AdminDashboardSummaryRow,
  AdminDashboardSystemStatus,
  AdminDashboardTopProfessional,
} from "../../store/services/adminApi";

export function TopProfessionalsWidget({
  professionals,
}: {
  professionals: AdminDashboardTopProfessional[];
}) {
  const tokens = useTheme().palette.mollure;
  const rows = professionals.slice(0, 4);

  return (
    <AdminSectionCard
      title="Top Professionals"
      description="By online bookings"
      actions={
        <AdminSectionLink href="/admin/professionals" label="View All" />
      }
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={0.75}>
        {rows.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: tokens.bodyText, py: 1 }}>
            No online bookings in this range.
          </Typography>
        ) : null}
        {rows.map((pro, index) => (
          <Stack
            key={pro.id}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: index === 0 ? tokens.mintSoft : "transparent",
              border:
                index === 0
                  ? `1px solid ${alpha(tokens.teal, 0.2)}`
                  : "1px solid transparent",
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 700,
                bgcolor: alpha(tokens.teal, 0.12),
                color: tokens.tealDark,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
                noWrap
              >
                {pro.name}
              </Typography>
              <Typography sx={{ fontSize: 10, color: tokens.bodyText }} noWrap>
                {pro.city}, {pro.province}
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
              {pro.bookings}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </AdminSectionCard>
  );
}

export function ActivityLogWidget({
  items,
}: {
  items: AdminDashboardActivityItem[];
}) {
  const tokens = useTheme().palette.mollure;
  const rows = items.slice(0, 3);

  const dotColor = (color: AdminDashboardActivityItem["color"]) => {
    switch (color) {
      case "teal":
        return tokens.teal;
      case "warning":
        return tokens.requestAccent;
      case "mint":
        return tokens.logoPrimary;
      default:
        return tokens.navy;
    }
  };

  return (
    <AdminSectionCard
      title="Activity Log"
      description="Latest actions"
      actions={<AdminSectionLink href="/admin/activity-log" label="View All" />}
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={0}>
        {rows.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: tokens.bodyText, py: 1 }}>
            No recent activity.
          </Typography>
        ) : null}
        {rows.map((item, index) => (
          <Stack key={item.id} direction="row" spacing={1} sx={{ py: 0.85 }}>
            <Stack alignItems="center" sx={{ width: 16, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: dotColor(item.color),
                  mt: 0.5,
                }}
              />
              {index < rows.length - 1 ? (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    bgcolor: tokens.cardBorder,
                    minHeight: 24,
                    mt: 0.5,
                  }}
                />
              ) : null}
            </Stack>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: tokens.navy }}
              >
                {item.admin}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: tokens.bodyText,
                  mt: 0.15,
                  lineHeight: 1.35,
                }}
              >
                {item.action}{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: tokens.navy }}
                >
                  {item.detail}
                </Box>
              </Typography>
              <Typography sx={{ fontSize: 10, color: tokens.slate, mt: 0.35 }}>
                {item.timestamp}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </AdminSectionCard>
  );
}

export function SummaryOverviewWidget({
  rows,
}: {
  rows: AdminDashboardSummaryRow[];
}) {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard
      title="Summary Overview"
      noPadding
      compact
      sx={{ height: "100%" }}
    >
      <Table size="small">
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.label}
              sx={{
                "&:last-child td": { borderBottom: 0 },
                "&:hover": { bgcolor: tokens.surface },
              }}
            >
              <TableCell
                sx={{
                  py: pad.tableCellY,
                  px: pad.tableCellX,
                  borderColor: tokens.cardBorder,
                  width: "32%",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: tokens.navy,
                    lineHeight: 1.3,
                  }}
                >
                  {row.label}
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  py: pad.tableCellY,
                  px: 1.5,
                  borderColor: tokens.cardBorder,
                  width: "16%",
                  whiteSpace: "nowrap",
                }}
              >
                <Typography
                  sx={{ fontSize: 15, fontWeight: 700, color: tokens.tealDark }}
                >
                  {row.value}
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  py: pad.tableCellY,
                  px: pad.tableCellX,
                  borderColor: tokens.cardBorder,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: tokens.bodyText,
                    lineHeight: 1.35,
                  }}
                >
                  {row.breakdown}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminSectionCard>
  );
}

export function SystemStatusWidget({
  items,
}: {
  items: AdminDashboardSystemStatus[];
}) {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard title="System Status" compact sx={{ height: "100%" }}>
      <Stack spacing={0.75}>
        {items.map((item) => {
          const ok = item.status.toLowerCase() === "operational";
          return (
            <Stack
              key={item.label}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                bgcolor: tokens.surface,
              }}
            >
              <Typography
                sx={{ fontSize: 12, fontWeight: 500, color: tokens.navy }}
              >
                {item.label}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.4}>
                {ok ? (
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 14, color: tokens.teal }}
                  />
                ) : (
                  <ErrorOutlineIcon
                    sx={{ fontSize: 14, color: tokens.requestAccent }}
                  />
                )}
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: ok ? tokens.teal : tokens.requestAccent,
                  }}
                >
                  {item.status}
                </Typography>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </AdminSectionCard>
  );
}

export function QuickLinksWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard title="Quick Links" compact sx={{ height: "100%" }}>
      <Stack spacing={1}>
        {ADMIN_QUICK_LINKS.map((link) => (
          <Box
            key={link.href}
            component="a"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              p: 1.25,
              borderRadius: 1.5,
              border: `1px solid ${tokens.cardBorder}`,
              textDecoration: "none",
              transition: "border-color 160ms ease, box-shadow 160ms ease",
              "&:hover": {
                borderColor: alpha(tokens.teal, 0.35),
                boxShadow: `0 4px 16px ${alpha(tokens.teal, 0.08)}`,
              },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: link.logoBg,
                color: link.logoColor,
                fontSize: link.logoLabel.length > 1 ? 9 : 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {link.logoLabel}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.navy,
                  lineHeight: 1.2,
                }}
              >
                {link.title}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.35}>
                <Typography sx={{ fontSize: 10, color: tokens.teal }}>
                  Open in new tab
                </Typography>
                <OpenInNewOutlinedIcon
                  sx={{ fontSize: 11, color: tokens.teal }}
                />
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>
    </AdminSectionCard>
  );
}
