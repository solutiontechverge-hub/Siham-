"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { AppSearchField } from "../common";
import AdminDateRangeSelector from "./AdminDateRangeSelector";
import type { AdminDashboardRangeValue } from "./dashboardRangeUtils";

type AdminDashboardHeaderProps = {
  range: AdminDashboardRangeValue;
  onRangeChange: (range: AdminDashboardRangeValue) => void;
};

export default function AdminDashboardHeader({ range, onRangeChange }: AdminDashboardHeaderProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const [search, setSearch] = React.useState("");

  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", lg: "center" }}
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <Typography variant="mainHeading" sx={{ fontSize: { xs: 26, md: 30 }, whiteSpace: "nowrap" }}>
          Dashboard
        </Typography>
        <Box sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <AdminDateRangeSelector value={range} onChange={onRangeChange} />
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
        <AppSearchField
          placeholder="Search anything..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 260 }, display: { xs: "none", md: "block" } }}
        />
        <IconButton
          sx={{
            border: `1px solid ${tokens.cardBorder}`,
            bgcolor: tokens.white,
            borderRadius: 2,
          }}
          aria-label="Notifications"
        >
          <Badge badgeContent={3} color="error">
            <NotificationsNoneOutlinedIcon sx={{ color: tokens.navy }} />
          </Badge>
        </IconButton>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            border: `1px solid ${tokens.cardBorder}`,
            bgcolor: tokens.white,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(tokens.teal, 0.15),
              color: tokens.tealDark,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            AU
          </Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy, lineHeight: 1.2 }}>
              Admin User
            </Typography>
            <Typography sx={{ fontSize: 11, color: tokens.slate }}>Super Admin</Typography>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}

export function AdminDashboardFooter() {
  const tokens = useTheme().palette.mollure;

  return (
    <Typography
      sx={{
        textAlign: "center",
        fontSize: 11,
        color: tokens.slate,
        mt: 1.5,
        pt: 1,
        borderTop: `1px solid ${tokens.cardBorder}`,
      }}
    >
      © 2025 Molur. All rights reserved.
    </Typography>
  );
}

export function AdminSectionLink({ href, label }: { href: string; label: string }) {
  const tokens = useTheme().palette.mollure;

  return (
    <Typography
      component={Link}
      href={href}
      sx={{
        fontSize: 12,
        fontWeight: 600,
        color: tokens.teal,
        textDecoration: "none",
        "&:hover": { textDecoration: "underline" },
      }}
    >
      {label}
    </Typography>
  );
}
