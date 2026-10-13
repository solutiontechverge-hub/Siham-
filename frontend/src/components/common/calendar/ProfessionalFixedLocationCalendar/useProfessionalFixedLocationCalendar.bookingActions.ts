import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarBookingAction } from "../CalendarBookingActionConfirmDialog";
import type { ProfessionalFixedLocationCalendarProps } from "./useProfessionalFixedLocationCalendar.types";
import { useProfessionalFixedLocationCalendarBookingActionsPersist } from "./useProfessionalFixedLocationCalendar.bookingActions.persist";
import { useProfessionalFixedLocationCalendarBookingActionsSelect } from "./useProfessionalFixedLocationCalendar.bookingActions.select";
import { useProfessionalFixedLocationCalendarBookingActionsConfirm } from "./useProfessionalFixedLocationCalendar.bookingActions.confirm";

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

export type UseProfessionalFixedLocationCalendarBookingActionsArgs = {
  events: readonly CalendarEvent[];
  viewingBookingEvent: CalendarEvent | null;
  editingEventId: string | null;
  pendingBookingAction: CalendarBookingAction | null;
  showLateCancellation: boolean;
  lateCancellationFeeAmount: number;
  showNoShowFee: boolean;
  noShowFeeAmount: number;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  lateCancellationFeePercentDefault?: string;
  noShowFeePercentDefault?: string;
  cancellationBeforeHours?: number | null;
  cancellationBeforeMinutes?: number | null;
  cancellationFeeAt: string | undefined;
  exceededCancellationWindow: boolean | undefined;
  setShowLateCancellation: (v: boolean) => void;
  setLateCancellationFeePercent: (v: string) => void;
  setLateCancellationFeePercentCeiling: (v: string) => void;
  setShowNoShowFee: (v: boolean) => void;
  setNoShowFeePercent: (v: string) => void;
  setNoShowFeePercentCeiling: (v: string) => void;
  setExceededCancellationWindow: (v: boolean | undefined) => void;
  beginExistingBookingEdit: () => void;
  onUpdateBookingStatus: ProfessionalFixedLocationCalendarProps["onUpdateBookingStatus"];
  onUpdateCalendarEntryStatus: ProfessionalFixedLocationCalendarProps["onUpdateCalendarEntryStatus"];
  onDispatchBookingNotification: ProfessionalFixedLocationCalendarProps["onDispatchBookingNotification"];
  showSnackbar: ShowSnackbar;
  setBookingActionAnchor: React.Dispatch<
    React.SetStateAction<HTMLElement | null>
  >;
  setDiscardErOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDiscardEbrOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDiscardBrOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNoShowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCancelModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEvents: React.Dispatch<React.SetStateAction<readonly CalendarEvent[]>>;
  setCancellationFeeAt: React.Dispatch<React.SetStateAction<string | undefined>>;
  setSlotDrawerTab: React.Dispatch<
    React.SetStateAction<"booking" | "sales" | "activity">
  >;
  setBookingCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSlotStatus: React.Dispatch<React.SetStateAction<CalendarEvent["status"]>>;
  setEditingEventId: React.Dispatch<React.SetStateAction<string | null>>;
  setSlotDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditingExisting: React.Dispatch<React.SetStateAction<boolean>>;
  setAllowDrawerTimeSelection: React.Dispatch<React.SetStateAction<boolean>>;
  setSlotCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSlotCalendarTouched: React.Dispatch<React.SetStateAction<boolean>>;
  setSlotClientAdded: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingBookingAction: React.Dispatch<
    React.SetStateAction<CalendarBookingAction | null>
  >;
};

/** Booking status persist + action menu / confirm handlers (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarBookingActions(
  args: UseProfessionalFixedLocationCalendarBookingActionsArgs,
) {
  const persist =
    useProfessionalFixedLocationCalendarBookingActionsPersist(args);
  const select = useProfessionalFixedLocationCalendarBookingActionsSelect({
    ...args,
    persistEventStatus: persist.persistEventStatus,
  });
  const confirm = useProfessionalFixedLocationCalendarBookingActionsConfirm({
    ...args,
    persistEventStatus: persist.persistEventStatus,
  });

  return {
    persistEventStatus: persist.persistEventStatus,
    dispatchBookingEventIfApi: persist.dispatchBookingEventIfApi,
    handleBookingActionSelect: select.handleBookingActionSelect,
    handleConfirmCancel: confirm.handleConfirmCancel,
    handleConfirmBookingAction: confirm.handleConfirmBookingAction,
    handleConfirmNoShow: confirm.handleConfirmNoShow,
  };
}
