"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import AppModal from "../AppModal";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import ModalConfirmBody from "../ModalConfirmBody";
import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";

export type CancelBookingPayload = {
  reasons: string[];
  details: string;
};

export type CalendarCancelBookingModalVariant = "cancel" | "reject";

type CalendarCancelBookingModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: CancelBookingPayload) => void;
  /** Incoming BR reject uses the same shell with Reject copy. */
  variant?: CalendarCancelBookingModalVariant;
};

export const BOOKING_REJECT_REASON_OPTIONS = [
  { label: "No availability / Fully booked", value: "no_availability" },
  {
    label: "Service not available on selected date/time",
    value: "service_unavailable",
  },
  { label: "Invalid booking details", value: "invalid_details" },
  { label: "Other reason", value: "other" },
] as const;

export function formatBookingRejectReasonNote(
  payload: CancelBookingPayload,
): string {
  const labels = BOOKING_REJECT_REASON_OPTIONS.filter((o) =>
    payload.reasons.includes(o.value),
  ).map((o) => o.label);
  const head = labels.join("; ");
  const details = payload.details.trim();
  if (head && details) return `${head} — ${details}`;
  return details || head;
}

export default function CalendarCancelBookingModal({
  open,
  onClose,
  onConfirm,
  variant = "cancel",
}: CalendarCancelBookingModalProps) {
  const isReject = variant === "reject";
  const [reasons, setReasons] = React.useState<string[]>([]);
  const [details, setDetails] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReasons(BOOKING_REJECT_REASON_OPTIONS.map((o) => o.value));
      setDetails("");
    }
  }, [open]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isReject ? "Reject Booking" : "Cancel Booking"}
      maxWidth="sm"
      fullWidth
      headerTone="danger"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={() => onConfirm({ reasons, details: details.trim() })}
          primaryLabel={isReject ? "Yes, Reject" : "Yes, Reject"}
          primaryTone={isReject ? "primary" : "danger"}
          justifyContent="center"
          buttonSx={{ height: 40, minWidth: 120 }}
        />
      }
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <ModalConfirmBody
          showWarning
          icon={
            <WarningRoundedIcon sx={{ fontSize: 52, color: "#E85D5D" }} />
          }
          iconColor="#E85D5D"
          iconSize={52}
          py={0}
          px={0}
          body={
            isReject
              ? "Are you sure you want to Reject this booking?"
              : "Are you sure you want to Cancel this booking?"
          }
          bodySx={{ fontSize: 16, lineHeight: 1.4 }}
        />

        <Stack spacing={1.75} sx={{ mt: 2 }}>
          <AppDropdown
            label="Reason"
            value={reasons}
            multiple
            placeholder="Select Reason"
            renderValue={(selected) => {
              const ids = selected as readonly string[];
              if (!ids.length) return "Select Reason";
              if (ids.length === BOOKING_REJECT_REASON_OPTIONS.length)
                return "All Reasons";
              return BOOKING_REJECT_REASON_OPTIONS.filter((o) =>
                ids.includes(o.value),
              )
                .map((o) => o.label)
                .join(", ");
            }}
            onChange={(val) => setReasons(val as string[])}
            options={[...BOOKING_REJECT_REASON_OPTIONS]}
            fullWidth
          />

          <AppTextField
            label="Additional Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Write a note…"
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </Box>
    </AppModal>
  );
}
