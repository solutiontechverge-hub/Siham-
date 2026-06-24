"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Badge, Box, Button, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useSnackbar } from "../AppSnackbar";
import { getMessagingHref, useClientMessagingUnread, useMessagingWidgetOptional } from "../messaging";
import type { BookingRequestDirection, ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import BookingRequestStatusRow, { type BookingRequestRowMode } from "./BookingRequestStatusRow";
import {
  professionalRejectEditRequest,
  professionalSuggestBookingChanges,
  sendBookingEditRequest,
} from "./bookingEditRequest";
import { useBookingEditRequest } from "./useBookingEditRequest";

type Props = {
  bookingRef: string;
  dateTimeLabel: string;
  bookingStatus?: ClientBookingStatus;
  bookingRequestDirection?: BookingRequestDirection;
  locationMode?: "fixed" | "desired";
  isCancelled?: boolean;
  requiresPrepayment?: boolean;
  onEditServices?: () => void;
  onDeleteBooking?: () => void;
  onDiscardBookingRequest?: () => void;
  messagingHref?: string;
};

export default function ClientBookingDetailsHeader({
  bookingRef,
  dateTimeLabel,
  bookingStatus = "confirmed",
  bookingRequestDirection,
  locationMode = "fixed",
  isCancelled = false,
  requiresPrepayment = false,
  onEditServices,
  onDeleteBooking,
  onDiscardBookingRequest,
  messagingHref,
}: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const messagingWidget = useMessagingWidgetOptional();
  const [editAnchor, setEditAnchor] = React.useState<HTMLElement | null>(null);
  const [activityAnchor, setActivityAnchor] = React.useState<HTMLElement | null>(null);
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

  const displayStatus: ClientBookingStatus = isCancelled ? "cancelled" : bookingStatus;

  const requestRowMode: BookingRequestRowMode = editRequest.isSuggested
    ? "professional_suggested"
    : editRequest.isRejected
      ? "professional_rejected"
      : "default";

  const isOutgoingBookingRequest =
    bookingStatus === "requested" &&
    bookingRequestDirection === "outgoing" &&
    locationMode === "desired";
  const editActionsDisabled = isCancelled || isOutgoingBookingRequest;

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
                onClick={() => messagingWidget?.openMessaging({ bookingRef })}
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
                disabled={editActionsDisabled}
                endIcon={editActionsDisabled ? undefined : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => {
                  if (editActionsDisabled) return;
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
                  "&:hover": { bgcolor: editActionsDisabled ? m.teal : m.tealDark },
                  ...(editActionsDisabled && {
                    opacity: 0.45,
                    color: "#fff",
                    pointerEvents: "none",
                  }),
                }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                sx={headerActionBtnSx}
                disabled={isCancelled}
                onClick={(e) => setActivityAnchor(e.currentTarget)}
              >
                Activity
              </Button>
              {isOutgoingBookingRequest && onDiscardBookingRequest ? (
                <Button variant="outlined" onClick={onDiscardBookingRequest} sx={headerActionBtnSx}>
                  Discard
                </Button>
              ) : null}
              {isCancelled ? (
                <Button variant="outlined" onClick={onDeleteBooking} sx={headerActionBtnSx}>
                  Delete
                </Button>
              ) : null}
            </Stack>
            <BookingRequestStatusRow
              bookingStatus={displayStatus}
              requiresPrepayment={requiresPrepayment && requestRowMode === "default"}
              bookingRequestDirection={bookingRequestDirection}
              rowMode={requestRowMode}
            />
          </Stack>
        </Stack>
      </Box>
      <Divider />

      <Menu
        anchorEl={activityAnchor}
        open={Boolean(activityAnchor)}
        onClose={() => setActivityAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { borderRadius: "10px", minWidth: 240, mt: 0.5 } }}
      >
        <MenuItem
          onClick={() => {
            setActivityAnchor(null);
            professionalSuggestBookingChanges(bookingRef);
            editRequest.refresh();
            showSnackbar({ severity: "info", message: "Professional suggested changes (demo)." });
          }}
          sx={menuItemSx}
        >
          Professional suggests changes
        </MenuItem>
        <MenuItem
          onClick={() => {
            setActivityAnchor(null);
            professionalRejectEditRequest(bookingRef);
            editRequest.refresh();
            showSnackbar({ severity: "info", message: "Professional rejected edit request (demo)." });
          }}
          sx={menuItemSx}
        >
          Professional rejects edit
        </MenuItem>
      </Menu>

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
            Send edit request to professional
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
