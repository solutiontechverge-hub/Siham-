import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { calendarEventCanChat } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { bookingOverlapsAnyBlock, extractBookingId } from "../calendar.utils";
import {
  useBookingHasExistingConversation,
  useProfessionalMessagingUnread,
} from "../../messaging/useProfessionalMessagingUnread";
import { useBookingPaymentDueMeta } from "../resolveBookingPaymentDueMeta";
import {
  bookingEventLiveKey,
  buildDraftSalesActivityContext,
} from "./useProfessionalFixedLocationCalendar.bookingDrawerMappers";
import {
  useProfessionalFixedLocationCalendarSalesActivity,
  type UseProfessionalFixedLocationCalendarSalesActivityArgs,
} from "./useProfessionalFixedLocationCalendar.salesActivity";

type DraftSalesInput = Parameters<typeof buildDraftSalesActivityContext>[0];

export function useProfessionalFixedLocationCalendarViewingBooking(input: {
  editingEventId: string | null;
  events: readonly CalendarEvent[];
  blocks: Parameters<typeof bookingOverlapsAnyBlock>[1];
  slotLocation: CalendarEvent["location"];
  setShowKilometerAllowance: (v: boolean) => void;
  setKilometerAllowanceDraft: (v: { eurPerKm: string; totalKilometer: string }) => void;
  selectedSlot: DraftSalesInput["selectedSlot"];
  selectedServices: DraftSalesInput["selectedServices"];
  selectedProducts: DraftSalesInput["selectedProducts"];
  bookingUniqueItems: DraftSalesInput["bookingUniqueItems"];
  slotStatus: CalendarEvent["status"];
  slotBookingType: NonNullable<CalendarEvent["bookingType"]>;
  selectedClient: DraftSalesInput["selectedClient"];
  guestDraft: DraftSalesInput["guestDraft"];
  nonMollureDraft: DraftSalesInput["nonMollureDraft"];
  addClientSource: DraftSalesInput["addClientSource"];
  snapshot: DraftSalesInput["snapshot"];
  slotDrawerOpen: boolean;
  slotDrawerTab: UseProfessionalFixedLocationCalendarSalesActivityArgs["slotDrawerTab"];
  resources: UseProfessionalFixedLocationCalendarSalesActivityArgs["resources"];
  setSlotDrawerTab: UseProfessionalFixedLocationCalendarSalesActivityArgs["setSlotDrawerTab"];
  setActivityDetailItem: UseProfessionalFixedLocationCalendarSalesActivityArgs["setActivityDetailItem"];
}) {
  const {
    editingEventId,
    events,
    blocks,
    slotLocation,
    setShowKilometerAllowance,
    setKilometerAllowanceDraft,
    selectedSlot,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    slotStatus,
    slotBookingType,
    selectedClient,
    guestDraft,
    nonMollureDraft,
    addClientSource,
    snapshot,
    slotDrawerOpen,
    slotDrawerTab,
    resources,
    setSlotDrawerTab,
    setActivityDetailItem,
  } = input;

  const isViewingBooking = Boolean(editingEventId);

  const viewingBookingEvent = React.useMemo(
    () =>
      editingEventId
        ? (events.find((event) => event.id === editingEventId) ?? null)
        : null,
    [editingEventId, events],
  );

  React.useEffect(() => {
    if (slotLocation === "DL") return;
    if (viewingBookingEvent?.location === "DL") return;
    setShowKilometerAllowance(false);
    setKilometerAllowanceDraft({ eurPerKm: "", totalKilometer: "" });
  }, [
    slotLocation,
    viewingBookingEvent?.location,
    setShowKilometerAllowance,
    setKilometerAllowanceDraft,
  ]);

  const viewingBookingOverlapsBlockTime = React.useMemo(
    () =>
      viewingBookingEvent
        ? bookingOverlapsAnyBlock(viewingBookingEvent, blocks)
        : false,
    [blocks, viewingBookingEvent],
  );

  const viewingBookingChatRef =
    viewingBookingEvent?.bookingCode ??
    (viewingBookingEvent ? extractBookingId(viewingBookingEvent.id) : undefined);
  const viewingBookingUnread = useProfessionalMessagingUnread(viewingBookingChatRef);
  const viewingHasExistingConversation = useBookingHasExistingConversation({
    bookingRef: viewingBookingChatRef,
    peerName: viewingBookingEvent?.showClientName,
    peerEmail: viewingBookingEvent?.details?.clientEmail,
    peerProfileId: viewingBookingEvent?.details?.customerId ?? undefined,
  });
  const showIncomingSuggestChange =
    calendarEventCanChat(viewingBookingEvent) && viewingHasExistingConversation;

  const viewingBookingPaymentDue = useBookingPaymentDueMeta(viewingBookingEvent);

  const drawerSalesActivityContext = React.useMemo<CalendarEvent | null>(
    () =>
      buildDraftSalesActivityContext({
        viewingBookingEvent,
        selectedSlot,
        editingEventId,
        selectedServices,
        selectedProducts,
        bookingUniqueItems,
        slotStatus,
        slotLocation,
        slotBookingType,
        selectedClient,
        guestDraft,
        nonMollureDraft,
        addClientSource,
        snapshot,
      }),
    [
      viewingBookingEvent,
      selectedSlot,
      editingEventId,
      selectedServices,
      selectedProducts,
      bookingUniqueItems,
      slotStatus,
      slotLocation,
      slotBookingType,
      selectedClient,
      guestDraft.firstName,
      guestDraft.lastName,
      nonMollureDraft.firstName,
      nonMollureDraft.lastName,
      addClientSource,
      snapshot,
    ],
  );

  const {
    activityBookingCode,
    activityBookingId,
    activityTimelineItems,
    bookingActivityResponse,
    clientActivityIdentity,
    clientBookingsForActivity,
    myBookingsResponse,
    openActivityComparison,
  } = useProfessionalFixedLocationCalendarSalesActivity({
    slotDrawerOpen,
    slotDrawerTab,
    drawerSalesActivityContext,
    selectedClient,
    guestDraft,
    nonMollureDraft,
    resources,
    setSlotDrawerTab,
    setActivityDetailItem,
  });

  const drawerLineTagComparisonMode = React.useMemo((): "ebr" | "er" => {
    if (viewingBookingEvent?.bookingScenario === "EBR") return "ebr";
    return "er";
  }, [viewingBookingEvent?.bookingScenario]);

  const openDrawerLineTagComparison = React.useCallback(() => {
    openActivityComparison(drawerLineTagComparisonMode);
  }, [drawerLineTagComparisonMode, openActivityComparison]);

  return {
    isViewingBooking,
    viewingBookingEvent,
    viewingBookingOverlapsBlockTime,
    viewingBookingChatRef,
    viewingBookingUnread,
    viewingHasExistingConversation,
    showIncomingSuggestChange,
    viewingBookingPaymentDue,
    drawerSalesActivityContext,
    activityBookingCode,
    activityBookingId,
    activityTimelineItems,
    bookingActivityResponse,
    clientActivityIdentity,
    clientBookingsForActivity,
    myBookingsResponse,
    openActivityComparison,
    drawerLineTagComparisonMode,
    openDrawerLineTagComparison,
    bookingEventLiveKey,
  };
}
