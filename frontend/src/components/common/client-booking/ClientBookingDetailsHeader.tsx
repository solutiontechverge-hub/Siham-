"use client";

import AppButton from "../AppButton";
import * as React from "react";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSnackbar } from "../AppSnackbar";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  getMessagingHref,
  useClientMessagingUnread,
  useMessagingWidgetOptional,
} from "../messaging";
import { useOpenMessagingForBookingMutation } from "../../../store/services/messagingApi";
import type {
  BookingRequestDirection,
  ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import BookingRequestStatusRow, {
  type BookingRequestRowMode,
} from "./BookingRequestStatusRow";
import EditRequestNoteDialog from "./EditRequestNoteDialog";
import {
  professionalRejectEditRequest,
  professionalSuggestBookingChanges,
} from "./bookingEditRequest";
import { useBookingEditRequest } from "./useBookingEditRequest";

type Props = {
  bookingRef: string;
  bookedDateLabel?: string;
  bookedTimeLabel?: string;
  bookingStatus?: ClientBookingStatus;
  bookingRequestSent?: boolean;
  bookingRequestDirection?: BookingRequestDirection;
  locationMode?: "fixed" | "desired";
  isCancelled?: boolean;
  requiresPrepayment?: boolean;
  /** True when required prepayment has already been paid. */
  prepaymentPaid?: boolean;
  /** Past booking still awaiting settlement. */
  paymentDue?: boolean;
  onEditDateTime?: () => void;
  onEditBookingDetails?: () => void;
  onEditProject?: () => void;
  onSendBookingRequest?: () => void | Promise<void>;
  onDeleteBooking?: () => void;
  onDiscardBookingRequest?: () => void;
  onDispatchBookingNotification?: (
    event:
      | "edit_request_outgoing"
      | "booking_date_changed"
      | "time_changed"
      | "service_edited"
      | "unique_item_edited",
  ) => void | Promise<void>;
  /** Persist Confirmed ER note to API (client → professional). */
  onSendConfirmedEditRequest?: (note: string) => void | Promise<void>;
  /** Show Updated next to Confirmed after post-accept edits. */
  showUpdated?: boolean;
  messagingHref?: string;
};

export default function ClientBookingDetailsHeader({
  bookingRef,
  bookedDateLabel = "",
  bookedTimeLabel = "",
  bookingStatus = "confirmed",
  bookingRequestSent = false,
  bookingRequestDirection,
  locationMode = "fixed",
  isCancelled = false,
  requiresPrepayment = false,
  prepaymentPaid = false,
  paymentDue = false,
  onEditDateTime,
  onEditBookingDetails,
  onEditProject,
  onSendBookingRequest,
  onDeleteBooking,
  onDiscardBookingRequest,
  onDispatchBookingNotification,
  onSendConfirmedEditRequest,
  showUpdated = false,
  messagingHref,
}: Props) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const messagingWidget = useMessagingWidgetOptional();
  const [openMessagingForBooking] = useOpenMessagingForBookingMutation();
  const [editAnchor, setEditAnchor] = React.useState<HTMLElement | null>(null);
  const [activityAnchor, setActivityAnchor] =
    React.useState<HTMLElement | null>(null);
  const unreadFromProfessional = useClientMessagingUnread(bookingRef);
  const editRequest = useBookingEditRequest(bookingRef);

  const openBookingChat = React.useCallback(async () => {
    if (!bookingRef) return;
    try {
      const result = await openMessagingForBooking({ bookingRef }).unwrap();
      messagingWidget?.openMessaging({
        threadId: result.threadId,
        bookingRef: result.bookingRef,
        businessSetupId: result.businessSetupId,
        searchPrefill: result.thread?.name || undefined,
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to open chat for this booking.",
        ),
      });
    }
  }, [bookingRef, messagingWidget, openMessagingForBooking, showSnackbar]);

  const chatIcon = (
    <ChatBubbleOutlineRoundedIcon
      sx={{ fontSize: 24, color: alpha(m.navy, 0.42) }}
    />
  );

  const handleSendEditRequest = () => {
    setEditAnchor(null);
    if (bookingStatus === "confirmed" && !editRequest.isEditGrantActive) {
      setErNoteOpen(true);
      return;
    }
    void onDispatchBookingNotification?.("edit_request_outgoing");
    showSnackbar({
      severity: "info",
      message: "Use Request to edit on a confirmed booking.",
    });
  };

  const handleConfirmErNote = (note: string) => {
    void (async () => {
      try {
        await onSendConfirmedEditRequest?.(note);
        editRequest.refresh();
        showSnackbar({
          severity: "success",
          message:
            "Edit request sent to the professional. You can edit after they approve.",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to send edit request."),
        });
      }
    })();
  };

  const handleSendBookingRequestFromEdit = () => {
    setEditAnchor(null);
    void onSendBookingRequest?.();
  };

  const menuItemSx = {
    fontSize: 12.5,
    fontWeight: 800,
    color: alpha(m.navy, 0.62),
    py: "10px",
    px: 1.5,
  };

  const displayStatus: ClientBookingStatus = isCancelled
    ? "cancelled"
    : bookingStatus;

  const requestRowMode: BookingRequestRowMode = editRequest.isSuggested
    ? "professional_suggested"
    : editRequest.isRejected
      ? "professional_rejected"
      : "default";

  const isOutgoingBookingRequest =
    bookingStatus === "requested" &&
    bookingRequestDirection === "outgoing" &&
    locationMode === "desired";
  const isCompleted = bookingStatus === "completed";
  const isConfirmed = bookingStatus === "confirmed";
  const isInvalid = bookingStatus === "invalid";
  const isNoShow = bookingStatus === "no_show";
  const canDelete =
    isCancelled || isCompleted || isInvalid || isNoShow;
  const waitingForPayment =
    requiresPrepayment && !prepaymentPaid && !isCompleted && !isCancelled && !isInvalid;
  /** Edit only on Confirmed (guideline). Prepay wait may still allow edits. */
  const showEdit =
    !isCancelled &&
    !isCompleted &&
    !isInvalid &&
    !isNoShow &&
    !isOutgoingBookingRequest &&
    bookingStatus !== "in_progress" &&
    !bookingRequestSent &&
    (isConfirmed || waitingForPayment);
  const editActionsDisabled = !showEdit;
  /** Confirmed edits require an accepted ER grant — no direct FL/DL edit. */
  const showConfirmedEditMenu =
    isConfirmed &&
    editRequest.isEditGrantActive &&
    Boolean(onEditDateTime || onEditBookingDetails || onEditProject);
  const [erNoteOpen, setErNoteOpen] = React.useState(false);

  const headerActionBtnSx = {
    borderRadius: "8px",
    fontSize: 12.5,
    height: 34,
    px: 2,
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
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 20,
                lineHeight: 1.25,
                color: alpha(m.navy, 0.88),
              }}
            >
              Booking Details{" "}
              <Box component="span" sx={{ color: m.teal }}>
                #{bookingRef}
              </Box>
            </Typography>
            {bookedDateLabel ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ mt: 0.65 }}
              >
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                  }}
                >
                  Booked on{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 900, color: alpha(m.navy, 0.88) }}
                  >
                    {bookedDateLabel}
                  </Box>
                  {bookedTimeLabel ? (
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, color: alpha(m.navy, 0.55) }}
                    >
                      {" "}
                      ({bookedTimeLabel})
                    </Box>
                  ) : null}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Open messaging"
                  onClick={() => void openBookingChat()}
                  sx={{ ml: 0.25, p: 0.35 }}
                >
                  {unreadFromProfessional > 0 ? (
                    <Badge
                      badgeContent={
                        unreadFromProfessional > 9
                          ? "9+"
                          : unreadFromProfessional
                      }
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          minWidth: 18,
                          height: 18,
                          fontWeight: 900,
                        },
                      }}
                    >
                      {chatIcon}
                    </Badge>
                  ) : (
                    chatIcon
                  )}
                </IconButton>
              </Stack>
            ) : null}
          </Box>

          <Stack
            alignItems={{ xs: "flex-start", md: "flex-end" }}
            spacing={0.85}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
            >
              {showEdit ? (
                <AppButton
                  tone="primary"
                  disabled={editActionsDisabled}
                  endIcon={
                    <KeyboardArrowDownRoundedIcon
                      sx={{ fontSize: 18, color: "#fff" }}
                    />
                  }
                  onClick={(e) => setEditAnchor(e.currentTarget)}
                  sx={{
                    borderRadius: "8px",
                    fontSize: 12.5,
                    px: 2,
                    height: 34,
                  }}
                >
                  Edit
                </AppButton>
              ) : null}
              <AppButton
                tone="secondary"
                sx={headerActionBtnSx}
                disabled={isCancelled}
                onClick={(e) => setActivityAnchor(e.currentTarget)}
              >
                Activity
              </AppButton>
              {isOutgoingBookingRequest && onDiscardBookingRequest ? (
                <AppButton
                  tone="secondary"
                  onClick={onDiscardBookingRequest}
                  sx={headerActionBtnSx}
                >
                  Discard
                </AppButton>
              ) : null}
              {canDelete ? (
                <AppButton
                  tone="secondary"
                  onClick={onDeleteBooking}
                  sx={headerActionBtnSx}
                >
                  Delete
                </AppButton>
              ) : null}
            </Stack>
            <BookingRequestStatusRow
              bookingStatus={displayStatus}
              bookingRequestSent={bookingRequestSent}
              editRequestPending={editRequest.isPending}
              requiresPrepayment={
                requiresPrepayment && requestRowMode === "default"
              }
              prepaymentPaid={prepaymentPaid}
              paymentDue={paymentDue}
              bookingRequestDirection={
                editRequest.isPending
                  ? editRequest.initiatedBy === "professional"
                    ? "incoming"
                    : "outgoing"
                  : bookingRequestDirection
              }
              rowMode={requestRowMode}
              showUpdated={showUpdated}
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
            showSnackbar({
              severity: "info",
              message: "Professional suggested changes (demo).",
            });
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
            showSnackbar({
              severity: "info",
              message: "Professional rejected edit request (demo).",
            });
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
        PaperProps={{
          sx: { borderRadius: "10px", minWidth: 200, mt: 0.5, py: 0.5 },
        }}
      >
        {showConfirmedEditMenu ? (
          <>
            {onEditDateTime ? (
              <MenuItem
                onClick={() => {
                  setEditAnchor(null);
                  onEditDateTime();
                }}
                sx={menuItemSx}
              >
                Date &amp; Time
              </MenuItem>
            ) : null}
            {onEditDateTime && onEditBookingDetails ? (
              <Divider sx={{ my: 0 }} />
            ) : null}
            {onEditBookingDetails ? (
              <MenuItem
                onClick={() => {
                  setEditAnchor(null);
                  onEditBookingDetails();
                }}
                sx={menuItemSx}
              >
                Booking Details
              </MenuItem>
            ) : null}
            {locationMode === "desired" && onEditProject ? (
              <>
                <Divider sx={{ my: 0 }} />
                <MenuItem
                  onClick={() => {
                    setEditAnchor(null);
                    onEditProject();
                  }}
                  sx={menuItemSx}
                >
                  Project
                </MenuItem>
              </>
            ) : null}
          </>
        ) : bookingRequestSent ? (
          <MenuItem
            disabled
            sx={{ ...menuItemSx, whiteSpace: "normal", opacity: 1 }}
          >
            {bookingRequestDirection === "incoming"
              ? "Booking request received — respond with Accept, Reject, or Suggest Changes"
              : "Booking request sent — awaiting professional approval"}
          </MenuItem>
        ) : editRequest.isPending ? (
          <MenuItem
            disabled
            sx={{ ...menuItemSx, whiteSpace: "normal", opacity: 1 }}
          >
            {editRequest.initiatedBy === "professional"
              ? "Edit request received — respond with Accept, Reject, or Suggest Change"
              : "Edit request sent — awaiting approval"}
          </MenuItem>
        ) : isConfirmed ? (
          <MenuItem onClick={handleSendEditRequest} sx={menuItemSx}>
            Request to edit booking
          </MenuItem>
        ) : onSendBookingRequest ? (
          <MenuItem onClick={handleSendBookingRequestFromEdit} sx={menuItemSx}>
            Send booking request to professional
          </MenuItem>
        ) : (
          <MenuItem onClick={handleSendEditRequest} sx={menuItemSx}>
            Send edit request to professional
          </MenuItem>
        )}
      </Menu>
      <EditRequestNoteDialog
        open={erNoteOpen}
        onClose={() => setErNoteOpen(false)}
        onConfirm={handleConfirmErNote}
      />
    </>
  );
}
