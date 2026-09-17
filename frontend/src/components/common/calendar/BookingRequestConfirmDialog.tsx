"use client";

import type { CalendarBookingScenario } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import ModalActionConfirmDialog from "../ModalActionConfirmDialog";

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
  if (!action) return null;
  const copy = copyFor(action, scenario);

  return (
    <ModalActionConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
      headerTone={action === "reject" ? "danger" : "default"}
      showWarning={copy.showWarning}
      awaitConfirm
    />
  );
}
