import * as React from "react";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { SelectedSlot } from "../calendar.utils";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import type { ProfessionalFixedLocationCalendarProps } from "./useProfessionalFixedLocationCalendar.types";
import { useProfessionalFixedLocationCalendarBookingPersistEr } from "./useProfessionalFixedLocationCalendar.bookingPersist.er";
import { useProfessionalFixedLocationCalendarBookingPersistDiscard } from "./useProfessionalFixedLocationCalendar.bookingPersist.discard";
import { useProfessionalFixedLocationCalendarBookingPersistIncoming } from "./useProfessionalFixedLocationCalendar.bookingPersist.incoming";
import { useProfessionalFixedLocationCalendarBookingPersistCheckout } from "./useProfessionalFixedLocationCalendar.bookingPersist.checkout";

type BookingGuest = {
  id: string;
  name: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  services: BookingServiceLineItem[];
  products: BookingProductLineItem[];
  participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
  planningActivity?: string;
  planningDuration?: string;
  planningStartTime?: string;
  planningEndTime?: string;
  bufferTeamMemberId?: string;
  bufferStartTime?: string;
  bufferEndTime?: string;
};

type PersistEventStatus = (
  eventId: string,
  status: CalendarEvent["status"],
  options?: {
    notification_event?: BookingNotificationEvent;
    notify_incoming_er?: boolean;
    initiated_by?: "client" | "professional";
    notes?: string | null;
    total_price?: number | null;
    booking_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  },
) => Promise<void>;

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

export type UseProfessionalFixedLocationCalendarBookingPersistArgs = {
  editingEventId: string | null;
  viewingBookingEvent: CalendarEvent | null;
  selectedSlot: SelectedSlot | null;
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  bookingGuests: BookingGuest[];
  selectedClient: {
    name: string;
    email: string;
    clientKind?: "individual" | "company";
  } | null;
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  showPrepayment: boolean;
  prepaymentPercent: string;
  prepaymentAmount: number;
  isDrawerPrepaymentPaid: boolean;
  drawerPaymentIsOffline: boolean;
  bookingTotalForSave: number;
  businessResponseWindowInput: {
    hours?: number | null;
    minutes?: number | null;
  };
  // ponytail: RTK mutation triggers — keep loose to avoid coupling extract to generated API types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manageBookingEditRequest: (args: { id: string; action: "accept" | "reject" }) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFinanceTransaction: (args: any) => any;
  onUpdateBookingStatus: ProfessionalFixedLocationCalendarProps["onUpdateBookingStatus"];
  persistEventStatus: PersistEventStatus;
  restoreIncomingActions: () => void;
  showSnackbar: ShowSnackbar;
  setEvents: React.Dispatch<React.SetStateAction<readonly CalendarEvent[]>>;
  setSlotStatus: React.Dispatch<React.SetStateAction<CalendarEvent["status"]>>;
  setIncomingRequestEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditingExisting: React.Dispatch<React.SetStateAction<boolean>>;
  setAllowDrawerTimeSelection: React.Dispatch<React.SetStateAction<boolean>>;
  setOriginalServicesSnapshot: React.Dispatch<
    React.SetStateAction<BookingServiceLineItem[]>
  >;
  setSelectedSlot: React.Dispatch<React.SetStateAction<SelectedSlot | null>>;
};

export function useProfessionalFixedLocationCalendarBookingPersist(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const er = useProfessionalFixedLocationCalendarBookingPersistEr(args);
  const discard = useProfessionalFixedLocationCalendarBookingPersistDiscard(args);
  const incoming =
    useProfessionalFixedLocationCalendarBookingPersistIncoming(args);
  const checkout =
    useProfessionalFixedLocationCalendarBookingPersistCheckout(args);

  return {
    handleAcceptConfirmedEr: er.handleAcceptConfirmedEr,
    handleRejectConfirmedEr: er.handleRejectConfirmedEr,
    handleDiscardBr: discard.handleDiscardBr,
    handleDiscardConfirmedEr: discard.handleDiscardConfirmedEr,
    handleRestartResponseTime: discard.handleRestartResponseTime,
    handleAcceptIncomingRequest: incoming.handleAcceptIncomingRequest,
    handleRejectIncomingRequest: incoming.handleRejectIncomingRequest,
    handleStartIncomingEdit: incoming.handleStartIncomingEdit,
    handleDiscardEbr: discard.handleDiscardEbr,
    handleBookingCheckoutSave: checkout.handleBookingCheckoutSave,
  };
}
