"use client";

import * as React from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { Typography } from "../ui/typography";
import type { ClientNotificationItem } from "../../data/clientNotifications.data";
import { MOLLURE_DRAWER_WIDTH } from "./MollureDrawer";

export type ClientNotificationsDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  items: readonly ClientNotificationItem[];
  onMarkAllRead?: () => void;
  onItemClick?: (item: ClientNotificationItem) => void;
};

function StatusIcon({ type }: { type: ClientNotificationItem["statusType"] }) {
  const m = useTheme().palette.mollure;
  switch (type) {
    case "accepted":
      return <CheckCircleRoundedIcon sx={{ fontSize: 16, color: m.teal }} />;
    case "rejected":
      return <CancelRoundedIcon sx={{ fontSize: 16, color: "#EE4B4B" }} />;
    case "updated":
      return <AutorenewRoundedIcon sx={{ fontSize: 16, color: alpha(m.slate, 0.9) }} />;
    case "pending":
    default:
      return <AutorenewRoundedIcon sx={{ fontSize: 16, color: alpha(m.slate, 0.9) }} />;
  }
}

export default function ClientNotificationsDrawer({
  open,
  onClose,
  title = "Notifications",
  items,
  onMarkAllRead,
  onItemClick,
}: ClientNotificationsDrawerProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();

  const handleItemClick = (item: ClientNotificationItem) => {
    onItemClick?.(item);
    if (item.href) {
      router.push(item.href);
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: MOLLURE_DRAWER_WIDTH,
          maxWidth: "100vw",
          bgcolor: "#fff",
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
          boxShadow: "0 22px 70px rgba(16, 24, 40, 0.22)",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontWeight: 900, color: m.navy, fontSize: 22 }}>
            {title}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {onMarkAllRead && items.some((item) => !item.read) ? (
              <Button
                size="small"
                onClick={onMarkAllRead}
                sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, minWidth: 0, px: 1 }}
              >
                Mark all read
              </Button>
            ) : null}
            <IconButton
            onClick={onClose}
            sx={{
              width: 42,
              height: 42,
              bgcolor: "rgba(52, 74, 102, 0.06)",
              color: m.slate,
              "&:hover": { bgcolor: "rgba(33, 184, 191, 0.12)", color: m.teal },
            }}
            aria-label="Close notifications"
          >
            <CloseRoundedIcon />
          </IconButton>
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: alpha(m.border, 0.9) }} />

      <Box sx={{ bgcolor: "#fff" }}>
        {items.length === 0 ? (
          <Box sx={{ px: 3, py: 4 }}>
            <Typography sx={{ color: alpha(m.slate, 0.7), fontSize: 14, fontWeight: 700 }}>
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          items.map((n, idx) => (
          <Box key={n.id}>
            <Box
              sx={{
                px: 3,
                py: 2.25,
                cursor: n.href ? "pointer" : "default",
                bgcolor: n.read ? "transparent" : alpha(m.teal, 0.04),
                "&:hover": n.href ? { bgcolor: alpha(m.teal, 0.06) } : undefined,
              }}
              onClick={() => handleItemClick(n)}
            >
              <Typography sx={{ fontWeight: 800, color: m.navy, fontSize: 14 }}>
                {n.actorName ?? n.professionalName}
              </Typography>

              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography sx={{ color: m.slate, fontSize: 13 }}>{n.statusLabel}</Typography>
                <StatusIcon type={n.statusType} />
              </Stack>

              <Typography sx={{ color: m.slate, fontSize: 13, mt: 0.5 }}>
                {n.bookingIdLabel}
              </Typography>

              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 16, color: alpha(m.slate, 0.65) }} />
                <Typography sx={{ color: alpha(m.slate, 0.8), fontSize: 12.5 }}>{n.timeLabel}</Typography>
              </Stack>
            </Box>
            {idx < items.length - 1 ? <Divider sx={{ borderColor: alpha(m.border, 0.8) }} /> : null}
          </Box>
          ))
        )}
      </Box>
    </Drawer>
  );
}

