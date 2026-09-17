"use client";

import AppButton from "../AppButton";
import * as React from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Typography } from "../../ui/typography";
import { mollureBodyMutedSx } from "../../../theme/mollureHierarchy";
import type { ClientNotificationItem } from "../../../data/clientNotifications.data";
import AppDrawer from "../AppDrawer";

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
      return (
        <AutorenewRoundedIcon
          sx={{ fontSize: 16, color: alpha(m.slate, 0.9) }}
        />
      );
    case "pending":
    default:
      return (
        <AutorenewRoundedIcon
          sx={{ fontSize: 16, color: alpha(m.slate, 0.9) }}
        />
      );
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
  const hasUnread = items.some((item) => !item.read);
  const itemsClickable = Boolean(onItemClick);

  const handleItemClick = (item: ClientNotificationItem) => {
    onItemClick?.(item);
  };

  const markAllReadAction =
    onMarkAllRead && hasUnread ? (
      <AppButton
        size="small"
        onClick={onMarkAllRead}
        sx={{
          textTransform: "none",
          fontWeight: 800,
          fontSize: 12,
          minWidth: 0,
          px: 1,
        }}
      >
        Mark all read
      </AppButton>
    ) : null;

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title={title}
      headerActions={markAllReadAction}
      contentSx={{ px: 0, py: 0 }}
    >
      <Box sx={{ bgcolor: "#fff" }}>
        {items.length === 0 ? (
          <Box sx={{ px: 3, py: 4 }}>
            <Typography
              sx={{ color: alpha(m.slate, 0.7), fontSize: 14, fontWeight: 700 }}
            >
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          items.map((n, idx) => (
            <Box key={n.id}>
              <Box
                role={itemsClickable ? "button" : undefined}
                tabIndex={itemsClickable ? 0 : undefined}
                onKeyDown={
                  itemsClickable
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleItemClick(n);
                        }
                      }
                    : undefined
                }
                sx={{
                  px: 3,
                  py: 2.25,
                  cursor: itemsClickable ? "pointer" : "default",
                  bgcolor: n.read ? "transparent" : alpha(m.teal, 0.04),
                  "&:hover": itemsClickable
                    ? { bgcolor: alpha(m.teal, 0.06) }
                    : undefined,
                }}
                onClick={() => handleItemClick(n)}
              >
                <Typography
                  sx={{ fontWeight: 800, color: m.navy, fontSize: 14 }}
                >
                  {n.actorName ?? n.professionalName}
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ mt: 0.5 }}
                >
                  <Typography sx={{ color: m.slate, fontSize: 13 }}>
                    {n.statusLabel}
                  </Typography>
                  <StatusIcon type={n.statusType} />
                </Stack>

                <Typography sx={{ color: m.slate, fontSize: 13, mt: 0.5 }}>
                  {n.bookingIdLabel}
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ mt: 0.75 }}
                >
                  <AccessTimeRoundedIcon
                    sx={{ fontSize: 16, color: alpha(m.slate, 0.65) }}
                  />
                  <Typography
                    sx={mollureBodyMutedSx(m.navy, {
                      color: alpha(m.slate, 0.8),
                    })}
                  >
                    {n.timeLabel}
                  </Typography>
                </Stack>
              </Box>
              {idx < items.length - 1 ? (
                <Divider sx={{ borderColor: alpha(m.border, 0.8) }} />
              ) : null}
            </Box>
          ))
        )}
      </Box>
    </AppDrawer>
  );
}
