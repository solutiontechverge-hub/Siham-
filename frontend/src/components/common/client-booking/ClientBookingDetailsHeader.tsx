"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Badge, Box, Button, Chip, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useSnackbar } from "../AppSnackbar";
import { getMessagingHref, useClientMessagingUnread } from "../messaging";
import { sendBookingEditRequest } from "./bookingEditRequest";
import { useBookingEditRequest } from "./useBookingEditRequest";

type Props = {
  bookingRef: string;
  dateTimeLabel: string;
  statusLabel?: string;
  isCancelled?: boolean;
  onEditServices?: () => void;
  onDeleteBooking?: () => void;
  messagingHref?: string;
};

export default function ClientBookingDetailsHeader({
  bookingRef,
  dateTimeLabel,
  statusLabel = "Confirmed",
  isCancelled = false,
  onEditServices,
  onDeleteBooking,
  messagingHref,
}: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [editAnchor, setEditAnchor] = React.useState<HTMLElement | null>(null);
  const chatHref = messagingHref ?? getMessagingHref("client");
  const unreadFromProfessional = useClientMessagingUnread(bookingRef);
  const editRequest = useBookingEditRequest(bookingRef);

  const chatIcon = (
    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 24, color: alpha(m.navy, 0.42) }} />
  );

  const handleSendEditRequest = () => {
    setEditAnchor(null);
    sendBookingEditRequest(bookingRef);
    editRequest.refresh();
    showSnackbar({
      severity: "success",
      message: "Edit request sent to the professional. You can edit after they approve.",
    });
  };

  const menuItemSx = { fontSize: 12.5, fontWeight: 800 };

  const isWarningStatus =
    statusLabel === "Prepayment required" || statusLabel === "Awaiting approval";

  const statusChipSx = isCancelled
    ? {
        bgcolor: alpha("#E57373", 0.22),
        color: "#C62828",
        border: `1px solid ${alpha("#E57373", 0.35)}`,
      }
    : isWarningStatus
      ? {
          bgcolor: alpha("#FF9800", 0.14),
          color: "#E65100",
          border: `1px solid ${alpha("#FF9800", 0.28)}`,
        }
      : {
          bgcolor: alpha("#4CAF50", 0.14),
          color: "#2E7D32",
          border: `1px solid ${alpha("#4CAF50", 0.25)}`,
        };

  const headerActionBtnSx = {
    borderRadius: "8px",
    textTransform: "none" as const,
    fontWeight: 900,
    fontSize: 12.5,
    height: 34,
    px: 2,
    borderColor: alpha(m.navy, 0.14),
    color: alpha(m.navy, 0.62),
    bgcolor: "#fff",
  };

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "flex-start" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.25, color: alpha(m.navy, 0.88) }}>
              Booking Details{" "}
              <Box component="span" sx={{ color: m.teal }}>
                #{bookingRef}
              </Box>
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.65 }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.45) }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.55) }}>{dateTimeLabel}</Typography>
              <IconButton
                size="small"
                aria-label="Open messaging"
                onClick={() => router.push(chatHref)}
                sx={{ ml: 0.25, p: 0.35 }}
              >
                {unreadFromProfessional > 0 ? (
                  <Badge
                    badgeContent={unreadFromProfessional > 9 ? "9+" : unreadFromProfessional}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": { fontSize: 10, minWidth: 18, height: 18, fontWeight: 900 },
                    }}
                  >
                    {chatIcon}
                  </Badge>
                ) : (
                  chatIcon
                )}
              </IconButton>
            </Stack>
          </Box>

          <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.85}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                disableElevation
                disabled={isCancelled}
                endIcon={isCancelled ? undefined : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => {
                  if (isCancelled) return;
                  setEditAnchor(e.currentTarget);
                }}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 900,
                  fontSize: 12.5,
                  px: 2,
                  height: 34,
                  bgcolor: m.teal,
                  "&:hover": { bgcolor: isCancelled ? m.teal : m.tealDark },
                  ...(isCancelled && {
                    opacity: 0.45,
                    color: "#fff",
                    pointerEvents: "none",
                  }),
                }}
              >
                Edit
              </Button>
              <Button variant="outlined" sx={headerActionBtnSx}>
                Activity
              </Button>
              {isCancelled ? (
                <Button variant="outlined" onClick={onDeleteBooking} sx={headerActionBtnSx}>
                  Delete
                </Button>
              ) : null}
            </Stack>
            <Chip
              label={isCancelled ? "Cancelled" : statusLabel}
              size="small"
              sx={{
                height: 22,
                fontWeight: 900,
                fontSize: 10.5,
                ...statusChipSx,
              }}
            />
          </Stack>
        </Stack>
      </Box>
      <Divider />

      <Menu
        anchorEl={editAnchor}
        open={Boolean(editAnchor)}
        onClose={() => setEditAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { borderRadius: "10px", minWidth: 220, mt: 0.5 } }}
      >
        {editRequest.isApproved ? (
          <>
            <MenuItem
              onClick={() => {
                setEditAnchor(null);
                onEditServices?.();
                router.push("/clients/booking?mode=create");
              }}
              sx={menuItemSx}
            >
              Edit services
            </MenuItem>
            <MenuItem
              onClick={() => {
                setEditAnchor(null);
                router.push("/clients/booking?mode=create");
              }}
              sx={menuItemSx}
            >
              Change date &amp; time
            </MenuItem>
          </>
        ) : editRequest.isPending ? (
          <MenuItem disabled sx={{ ...menuItemSx, whiteSpace: "normal", py: 1.25, opacity: 1 }}>
            Edit request sent — awaiting professional approval
          </MenuItem>
        ) : (
          <MenuItem onClick={handleSendEditRequest} sx={menuItemSx}>
            Send Edit request to professional
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
