import * as React from "react";
import type {
  CalendarBookingGuestItem,
  CalendarBookingLocation,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";
import type { ShowSnackbarOptions } from "../../AppSnackbar";
import type { SelectedSlot } from "../calendar.utils";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";
import { useProfessionalFixedLocationCalendarDrawerGuestsInline } from "./useProfessionalFixedLocationCalendar.drawerGuests.inline";
import { useProfessionalFixedLocationCalendarDrawerGuestsBuffer } from "./useProfessionalFixedLocationCalendar.drawerGuests.buffer";
import { useProfessionalFixedLocationCalendarDrawerGuestsServices } from "./useProfessionalFixedLocationCalendar.drawerGuests.services";

type InlineGuestDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
};

type BufferDraft = {
  title: string;
  teamMemberIds: string[];
  durationMins: string;
  startTime: string;
  endTime: string;
};

export type UseProfessionalFixedLocationCalendarDrawerGuestsArgs = {
  inlineGuestDraft: InlineGuestDraft;
  setInlineGuestDraft: React.Dispatch<React.SetStateAction<InlineGuestDraft>>;
  emptyInlineGuestDraft: InlineGuestDraft;
  editingInlineGuestId: string | null;
  setEditingInlineGuestId: React.Dispatch<React.SetStateAction<string | null>>;
  inlineGuestParticipantType: "guest" | "model";
  setInlineGuestParticipantType: React.Dispatch<
    React.SetStateAction<"guest" | "model">
  >;
  setShowInlineGuestField: React.Dispatch<React.SetStateAction<boolean>>;
  bookingGuests: CalendarBookingGuestItem[];
  setBookingGuests: React.Dispatch<
    React.SetStateAction<CalendarBookingGuestItem[]>
  >;
  selectedServices: BookingServiceLineItem[];
  setSelectedServices: React.Dispatch<
    React.SetStateAction<BookingServiceLineItem[]>
  >;
  setSelectedProducts: React.Dispatch<
    React.SetStateAction<BookingProductLineItem[]>
  >;
  setBookingUniqueItems: React.Dispatch<
    React.SetStateAction<BookingUniqueItemLine[]>
  >;
  setServiceSelectionDraft: React.Dispatch<React.SetStateAction<string[]>>;
  setServiceOverridesDraft: React.Dispatch<
    React.SetStateAction<Record<string, Partial<BookingServiceLineItem>>>
  >;
  selectedSlot: SelectedSlot | null;
  setSelectedSlot: React.Dispatch<React.SetStateAction<SelectedSlot | null>>;
  setSlotCalendarTouched: React.Dispatch<React.SetStateAction<boolean>>;
  setSlotBookingScreen: React.Dispatch<
    React.SetStateAction<SlotBookingScreen>
  >;
  setSlotSaveAttempted: React.Dispatch<React.SetStateAction<boolean>>;
  bufferDraft: BufferDraft;
  setBufferDraft: React.Dispatch<React.SetStateAction<BufferDraft>>;
  editingBufferId: string | null;
  setEditingBufferId: React.Dispatch<React.SetStateAction<string | null>>;
  slotLocation: CalendarBookingLocation;
  resources: readonly { id: string; name?: string }[];
  resourceNameById?: ReadonlyMap<string, string>;
  focusBookingDrawerSection: (sectionId: string) => void;
  isDrawerPlanningGuest: (guest: CalendarBookingGuestItem) => boolean;
  showSnackbar: (options: ShowSnackbarOptions) => void;
};

/** Drawer guest/participant + service reorder handlers (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerGuests(
  args: UseProfessionalFixedLocationCalendarDrawerGuestsArgs,
) {
  const inline = useProfessionalFixedLocationCalendarDrawerGuestsInline(args);
  const buffer = useProfessionalFixedLocationCalendarDrawerGuestsBuffer(args);
  const services =
    useProfessionalFixedLocationCalendarDrawerGuestsServices(args);

  return {
    addDlParticipant: buffer.addDlParticipant,
    addInlineGuest: inline.addInlineGuest,
    applyBufferDraft: buffer.applyBufferDraft,
    assignServiceStaff: services.assignServiceStaff,
    beginEditBuffer: buffer.beginEditBuffer,
    beginEditInlineGuest: inline.beginEditInlineGuest,
    bumpSlotFromServices: services.bumpSlotFromServices,
    cancelInlineGuestForm: inline.cancelInlineGuestForm,
    patchServiceTimeOverrides: services.patchServiceTimeOverrides,
    removeClientService: services.removeClientService,
    removeGuestService: services.removeGuestService,
    reorderClientServices: services.reorderClientServices,
    reorderDrawerPlanning: services.reorderDrawerPlanning,
    reorderGuestServices: services.reorderGuestServices,
  };
}
