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
import {
  mollureLabelSx,
  mollureBodyMutedSx,
} from "../../theme/mollureHierarchy";
import AdminDateRangeSelector from "./AdminDateRangeSelector";
import type { AdminDashboardRangeValue } from "./dashboardRangeUtils";

type AdminDashboardHeaderProps = {
  range: AdminDashboardRangeValue;
  onRangeChange: (range: AdminDashboardRangeValue) => void;
};

export default function AdminDashboardHeader({
  range,
  onRangeChange,
}: AdminDashboardHeaderProps) {
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
      >
        <Typography
          variant="mainHeading"
          sx={{ fontSize: 20, whiteSpace: "nowrap" }}
        >
          Dashboard
        </Typography>
        <Box sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <AdminDateRangeSelector value={range} onChange={onRangeChange} />
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        justifyContent="flex-end"
      >
        <AppSearchField
          placeholder="Search anything..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            width: { xs: "100%", sm: 260 },
            display: { xs: "none", md: "block" },
          }}
        />
        <IconButton
          sx={{
            width: 40,
            height: 40,
            border: `1px solid ${tokens.cardBorder}`,
            bgcolor: tokens.white,
            borderRadius: 999,
            "&:hover": { bgcolor: alpha(tokens.navy, 0.04) },
          }}
          aria-label="Notifications"
        >
          <Badge
            badgeContent={3}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: 10,
                fontWeight: 700,
                minWidth: 16,
                height: 16,
                px: 0.5,
              },
            }}
          >
            <NotificationsNoneOutlinedIcon
              sx={{ fontSize: 20, color: tokens.navy }}
            />
          </Badge>
        </IconButton>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            height: 40,
            pl: 0.5,
            pr: 1.25,
            borderRadius: 999,
            border: `1px solid ${tokens.cardBorder}`,
            bgcolor: tokens.white,
            maxWidth: { sm: 200 },
          }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: alpha(tokens.teal, 0.16),
              color: tokens.tealDark,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            AU
          </Avatar>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <Typography
              sx={mollureLabelSx(tokens.navy, {
                fontWeight: 600,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              Admin User
            </Typography>
            <Typography
              sx={mollureBodyMutedSx(tokens.navy, {
                fontSize: 11,
                color: tokens.slate,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              })}
            >
              Super Admin
            </Typography>
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
      sx={mollureBodyMutedSx(tokens.navy, {
        textAlign: "center",
        fontSize: 11,
        color: tokens.slate,
        mt: 1.5,
        pt: 1,
        borderTop: `1px solid ${tokens.cardBorder}`,
      })}
    >
      © 2025 Molur. All rights reserved.
    </Typography>
  );
}

export function AdminSectionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const tokens = useTheme().palette.mollure;

  return (
    <Typography
      component={Link}
      href={href}
      sx={mollureLabelSx(tokens.navy, {
        fontWeight: 600,
        color: tokens.teal,
        textDecoration: "none",
        "&:hover": { textDecoration: "underline" },
      })}
    >
      {label}
    </Typography>
  );
}
