import * as React from "react";
import type { CalendarBookingAction } from "../CalendarBookingActionConfirmDialog";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";

export type UseProfessionalFixedLocationCalendarIncomingUiStateArgs = {
  editingEventId: string | null;
};

/** Incoming/request discard + action UI state (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarIncomingUiState({
  editingEventId,
}: UseProfessionalFixedLocationCalendarIncomingUiStateArgs) {
  const [discardBrOpen, setDiscardBrOpen] = React.useState(false);
  const [discardEbrOpen, setDiscardEbrOpen] = React.useState(false);
  const [discardErOpen, setDiscardErOpen] = React.useState(false);
  const [erNoteDialogOpen, setErNoteDialogOpen] = React.useState(false);
  const [incomingConfirmAction, setIncomingConfirmAction] = React.useState<
    "accept" | "suggest" | "reject" | null
  >(null);
  const [responseActionsDismissed, setResponseActionsDismissed] =
    React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const restoreIncomingActions = React.useCallback(() => {
    setResponseActionsDismissed(false);
    setActionFeedback(null);
  }, []);
  React.useEffect(() => {
    setResponseActionsDismissed(false);
    setActionFeedback(null);
  }, [editingEventId]);
  const [incomingRequestEditMode, setIncomingRequestEditMode] =
    React.useState(false);
  const [originalServicesSnapshot, setOriginalServicesSnapshot] =
    React.useState<BookingServiceLineItem[]>([]);
  const [noShowModalOpen, setNoShowModalOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [pendingBookingAction, setPendingBookingAction] =
    React.useState<CalendarBookingAction | null>(null);

  return {
    discardBrOpen,
    setDiscardBrOpen,
    discardEbrOpen,
    setDiscardEbrOpen,
    discardErOpen,
    setDiscardErOpen,
    erNoteDialogOpen,
    setErNoteDialogOpen,
    incomingConfirmAction,
    setIncomingConfirmAction,
    responseActionsDismissed,
    setResponseActionsDismissed,
    actionFeedback,
    setActionFeedback,
    restoreIncomingActions,
    incomingRequestEditMode,
    setIncomingRequestEditMode,
    originalServicesSnapshot,
    setOriginalServicesSnapshot,
    noShowModalOpen,
    setNoShowModalOpen,
    cancelModalOpen,
    setCancelModalOpen,
    pendingBookingAction,
    setPendingBookingAction,
  };
}
