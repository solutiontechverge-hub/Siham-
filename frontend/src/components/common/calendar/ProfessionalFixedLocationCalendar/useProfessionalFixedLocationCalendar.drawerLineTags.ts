import type {
  CalendarBookingGuestItem,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";
import type { ResponseWindowInput } from "../bookingResponseDeadline";
import type { SelectedSlot } from "../calendar.utils";
import { useProfessionalFixedLocationCalendarDrawerLineTagsFlags } from "./useProfessionalFixedLocationCalendar.drawerLineTags.flags";
import { useProfessionalFixedLocationCalendarDrawerLineTagsResolve } from "./useProfessionalFixedLocationCalendar.drawerLineTags.resolve";

export type UseProfessionalFixedLocationCalendarDrawerLineTagsArgs = {
  viewingBookingEvent: CalendarEvent | null;
  isViewingBooking: boolean;
  isEditingExisting: boolean;
  businessResponseWindowInput: ResponseWindowInput;
  selectedSlot: SelectedSlot | null;
  selectedServices: BookingServiceLineItem[];
  bookingGuests: CalendarBookingGuestItem[];
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingUniqueItemLine[];
  showSilentFieldTags: boolean;
};

/** Incoming flags + silent/line-tag resolution (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerLineTags(
  args: UseProfessionalFixedLocationCalendarDrawerLineTagsArgs,
) {
  const flags = useProfessionalFixedLocationCalendarDrawerLineTagsFlags(args);
  const resolve = useProfessionalFixedLocationCalendarDrawerLineTagsResolve({
    ...args,
    awaitingLineApproval: flags.awaitingLineApproval,
    negotiationDetails: flags.negotiationDetails,
    drawerEbrNotes: flags.drawerEbrNotes,
    savedBookingDetails: flags.savedBookingDetails,
  });

  return {
    ...flags,
    ...resolve,
  };
}
