"use client";

import * as React from "react";
import type { CalendarBookingScenario } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

export type BookingRequestConfirmAction = "accept" | "suggest" | "reject";

type Props = {
  open: boolean;
  action: BookingRequestConfirmAction | null;
  scenario?: CalendarBookingScenario | null;
  onClose: () => void;
  /** Awaited — success snackbar is shown by the caller after the API succeeds. */
  onConfirm: () => void | Promise<void>;
};

function copyFor(
  action: BookingRequestConfirmAction,
  scenario?: CalendarBookingScenario | null,
): {
  title: string;
  body: string;
  confirmLabel: string;
  showWarning?: boolean;
} {
  const isFirstBr = !scenario || scenario === "BR";
  const isEr = scenario === "ER";
  if (action === "accept") {
    return {
      title: isEr
        ? "Accept edit request"
        : isFirstBr
          ? "Accept booking request"
          : "Accept edited request",
      body: isFirstBr
        ? "By accepting, this booking request will be confirmed."
        : isEr
          ? "By accepting, the requested changes will be applied to this confirmed booking."
          : "By accepting, the edited booking request will be applied.",
      confirmLabel: "Accept",
    };
  }
  if (action === "suggest") {
    return {
      title: "Suggest changes",
      body: "By choosing “Suggest changes”, you can communicate through the messaging tool.",
      confirmLabel: "Suggest changes",
    };
  }
  return {
    title: isEr
      ? "Reject edit request"
      : isFirstBr
        ? "Reject booking request"
        : "Decline edited request",
    body: isFirstBr
      ? "By rejecting, this booking request will be marked Invalid."
      : isEr
        ? "By rejecting, the requested changes will not be applied. The booking stays confirmed."
        : "These edited changes will not be applied. The booking stays confirmed.",
    confirmLabel: isFirstBr || isEr ? "Reject" : "Decline",
    showWarning: true,
  };
}

export default function BookingRequestConfirmDialog({
  open,
  action,
  scenario,
  onClose,
  onConfirm,
}: Props) {
  const m = useTheme().palette.mollure;
  const [submitting, setSubmitting] = React.useState(false);
  if (!action) return null;

  const copy = copyFor(action, scenario);

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={copy.title}
      onClose={submitting ? () => undefined : onClose}
      maxWidth="sm"
      headerTone={action === "reject" ? "danger" : "default"}
      footer={
        <>
          <MessagingModalCancelButton
            onClick={onClose}
            disabled={submitting}
          />
          <MessagingModalPrimaryButton
            label={copy.confirmLabel}
            disabled={submitting}
            onClick={() => {
              void (async () => {
                setSubmitting(true);
                try {
                  await onConfirm();
                  onClose();
                } catch {
                  // Caller shows the error snackbar.
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 2.5, textAlign: "center" }}>
        {copy.showWarning ? (
          <WarningAmberRoundedIcon
            sx={{ fontSize: 52, color: "#E85D5D", mb: 1.5 }}
          />
        ) : null}
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 14,
            color: alpha(m.navy, 0.88),
            lineHeight: 1.55,
            px: 1,
          }}
        >
          {copy.body}
        </Typography>
      </Box>
    </AppModal>
  );
}
