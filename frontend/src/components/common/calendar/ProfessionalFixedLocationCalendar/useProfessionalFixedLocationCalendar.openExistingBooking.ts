import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  emptyDesiredLocation,
  hydrateBookingDrawerFromEvent,
} from "../bookingEventDetails";
import { resolveOriginalServices } from "../bookingRequestNegotiation";
import {
  calendarEventIsGuest,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  resolveParentCalendarEventId,
} from "../../../../data/bookingChronologicalBlocks";
import { createEmptyProductSelectionDraft } from "../../../../data/bookingProductCatalog.data";
import { emptyBookingUniqueItemDraft } from "../../../../data/bookingUniqueItem.data";
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import { extractBookingId } from "../calendar.utils";
import {
  markBookingUpdateSeen,
  shouldShowSilentUpdatedTag,
} from "../bookingUpdateSeen";
import { bookingEventLiveKey } from "./useProfessionalFixedLocationCalendar.bookingDrawerMappers";
import {
  resolveDrawerAddClientSource,
  resolveOpenExistingBookingGuests,
  resolveOpenExistingProjectDetails,
} from "./useProfessionalFixedLocationCalendar.helpers";
import { useProfessionalFixedLocationCalendarOpenExistingBookingFocus } from "./useProfessionalFixedLocationCalendar.openExistingBooking.focus";

export type UseProfessionalFixedLocationCalendarOpenExistingBookingArgs = {
  events: readonly CalendarEvent[];
  clientOptions: readonly {
    name: string;
    email: string;
    clientKind?: "individual" | "company";
  }[];
  kilometerAllowanceEurPerKmDefault?: string;
  clearBookingDrawerNotListedHint: () => void;
  viewingBookingEvent: CalendarEvent | null;
  slotDrawerOpen: boolean;
  isEditingExisting: boolean;
  incomingRequestEditMode: boolean;
  isViewingExisting: boolean;
  activeDateIso: string;
  setActiveDateIso: React.Dispatch<React.SetStateAction<string>>;
  // Drawer setters — intentional deps bag (ponytail: keep apply colocated).
  apply: {
    setSelectedSlot: (v: {
      resourceId: string;
      date: string;
      start: string;
      end: string;
      freeStart: string;
      freeEnd: string;
    }) => void;
    setSlotDrawerTab: (v: "booking" | "sales" | "activity") => void;
    setSlotBookingScreen: (v: "new-booking") => void;
    setSlotLocation: (v: CalendarEvent["location"]) => void;
    setSlotBookingType: (v: NonNullable<CalendarEvent["bookingType"]>) => void;
    setSlotClientAdded: (v: boolean) => void;
    setAllowDrawerTimeSelection: (v: boolean) => void;
    setSlotCalendarOpen: (v: boolean) => void;
    setSlotCalendarTouched: (v: boolean) => void;
    setSelectedClient: (v: {
      name: string;
      email: string;
      mollureUserId?: string | null;
      clientKind?: "individual" | "company";
      isGuest?: boolean;
      isMollure?: boolean;
    }) => void;
    setAddClientSource: (
      v: "" | "client-list" | "mollure-platform" | "non-mollure" | "guest",
    ) => void;
    setSelectedServices: (v: ReturnType<typeof hydrateBookingDrawerFromEvent>["services"]) => void;
    setSelectedProducts: (v: ReturnType<typeof hydrateBookingDrawerFromEvent>["products"]) => void;
    setBookingUniqueItems: (v: ReturnType<typeof hydrateBookingDrawerFromEvent>["products"]) => void;
    setServiceSelectionDraft: (v: string[]) => void;
    setProductSelectionDraft: (v: ReturnType<typeof createEmptyProductSelectionDraft>) => void;
    setUniqueItemSelectionDraft: (v: ReturnType<typeof createEmptyProductSelectionDraft>) => void;
    setUniqueItemDraft: (v: ReturnType<typeof emptyBookingUniqueItemDraft>) => void;
    setUniqueItemOrigin: (v: "unique") => void;
    setEditingCatalogProductId: (v: null) => void;
    setCustomBookingProducts: (v: []) => void;
    setEditingBookingLine: (v: null) => void;
    setBookingGuests: (v: ReturnType<typeof resolveOpenExistingBookingGuests>) => void;
    setShowInlineGuestField: (v: boolean) => void;
    setBookingProjectEnabled: (v: boolean) => void;
    setBookingProjectDescription: (v: string) => void;
    setBookingProjectUploads: (v: ReturnType<typeof resolveOpenExistingProjectDetails>["uploads"]) => void;
    setBookingPhoneDraft: (v: { phoneCode: string; phoneNumber: string }) => void;
    setDesiredLocationDraft: (v: ReturnType<typeof emptyDesiredLocation> | ReturnType<typeof hydrateBookingDrawerFromEvent>["desiredLocation"]) => void;
    setShowPrepayment: (v: boolean) => void;
    setPrepaymentPercent: (v: string) => void;
    setPaymentMethod: (v: "online" | "offline") => void;
    clearDrawerPrepaymentPaidOverride?: () => void;
    setShowLateCancellation: (v: boolean) => void;
    setLateCancellationFeePercent: (v: string) => void;
    setLateCancellationFeePercentCeiling: (v: string) => void;
    setShowLateRescheduling: (v: boolean) => void;
    setLateRescheduleFeePercent: (v: string) => void;
    setLateRescheduleFeePercentCeiling: (v: string) => void;
    setShowNoShowFee: (v: boolean) => void;
    setNoShowFeePercent: (v: string) => void;
    setNoShowFeePercentCeiling: (v: string) => void;
    setCancellationFeeAt: (v: string | undefined) => void;
    setExceededCancellationWindow: (v: boolean | undefined) => void;
    setShowInternalNote: (v: boolean) => void;
    setBookingInternalNote: (v: string) => void;
    setBookingTotalDiscount: (v: ReturnType<typeof hydrateBookingDrawerFromEvent>["totalDiscount"]) => void;
    setBookingDiscountModalOpen: (v: boolean) => void;
    setShowKilometerAllowance: (v: boolean) => void;
    setKilometerAllowanceDraft: (v: {
      eurPerKm: string;
      totalKilometer: string;
    }) => void;
    setEditingEventId: (v: string) => void;
    setSlotStatus: (v: CalendarEvent["status"]) => void;
    setIsEditingExisting: (v: boolean) => void;
    setIncomingRequestEditMode: (v: boolean) => void;
    setOriginalServicesSnapshot: (v: ReturnType<typeof hydrateBookingDrawerFromEvent>["services"]) => void;
    setSlotSaveAttempted: (v: boolean) => void;
    setAddMenuTarget: (v: "client") => void;
    setSelectionTarget: (v: "client") => void;
    setSlotAddMenuAnchor: (v: null) => void;
    setBookingMoreAnchor: (v: null) => void;
    setSlotDrawerOpen: (v: boolean) => void;
    setBookingCheckoutOpen: (v: boolean) => void;
    setShowSilentFieldTags: (v: boolean) => void;
    silentEditBaselineRef: React.MutableRefObject<unknown>;
    bookingCheckoutOpenRef: React.MutableRefObject<boolean>;
    editingEventIdRef: React.MutableRefObject<string | null>;
  };
};

export function useProfessionalFixedLocationCalendarOpenExistingBooking({
  events,
  clientOptions,
  kilometerAllowanceEurPerKmDefault,
  clearBookingDrawerNotListedHint,
  viewingBookingEvent,
  slotDrawerOpen,
  isEditingExisting,
  incomingRequestEditMode,
  isViewingExisting,
  activeDateIso,
  setActiveDateIso,
  apply,
}: UseProfessionalFixedLocationCalendarOpenExistingBookingArgs) {
  const lastLiveHydratedEventKeyRef = React.useRef("");
  const applyRef = React.useRef(apply);
  applyRef.current = apply;

  const openExistingBooking = React.useCallback(
    (ev: CalendarEvent) => {
      const a = applyRef.current;
      clearBookingDrawerNotListedHint();
      const parentId = resolveParentCalendarEventId(ev.id);
      const resolved =
        events.find((item) => item.id === parentId) ??
        (parentId !== ev.id ? { ...ev, id: parentId } : ev);
      const hydration = hydrateBookingDrawerFromEvent(resolved);

      a.setSelectedSlot({
        resourceId: resolved.resourceId,
        date: resolved.date,
        start: resolved.start,
        end: resolved.end,
        freeStart: resolved.start,
        freeEnd: resolved.end,
      });
      a.setSlotDrawerTab("booking");
      a.setSlotBookingScreen("new-booking");
      a.setSlotLocation(ev.location);
      a.setSlotBookingType(ev.bookingType ?? "Online");
      a.setSlotClientAdded(true);
      a.setAllowDrawerTimeSelection(false);
      a.setSlotCalendarOpen(false);
      a.setSlotCalendarTouched(true);

      const hydratedEmail = String(hydration.clientEmail ?? "")
        .trim()
        .toLowerCase();
      const isGuest = calendarEventIsGuest(ev);
      a.setSelectedClient({
        name: ev.showClientName ?? "Client",
        email: hydration.clientEmail,
        mollureUserId: isGuest ? null : (ev.details?.customerId ?? null),
        clientKind: isGuest
          ? undefined
          : (ev.clientKind ??
            ev.details?.clientKind ??
            (hydratedEmail
              ? clientOptions.find(
                  (c) => c.email.trim().toLowerCase() === hydratedEmail,
                )?.clientKind
              : undefined)),
        isGuest,
        isMollure: !isGuest && Boolean(ev.details?.customerId),
      });
      a.setAddClientSource(resolveDrawerAddClientSource(ev, isGuest));

      a.setSelectedServices(hydration.services);
      a.setSelectedProducts(
        stampProductsToEarliestBlock(
          hydration.products.filter(
            (product) => !String(product.id).startsWith("unique-"),
          ),
          hydration.services,
          null,
        ),
      );
      a.setBookingUniqueItems(
        stampProductsToEarliestBlock(
          hydration.products.filter((product) =>
            String(product.id).startsWith("unique-"),
          ),
          hydration.services,
          null,
        ),
      );
      a.setServiceSelectionDraft(hydration.services.map((service) => service.id));
      a.setProductSelectionDraft(createEmptyProductSelectionDraft());
      a.setUniqueItemSelectionDraft(createEmptyProductSelectionDraft());
      a.setUniqueItemDraft(emptyBookingUniqueItemDraft());
      a.setUniqueItemOrigin("unique");
      a.setEditingCatalogProductId(null);
      a.setCustomBookingProducts([]);
      a.setEditingBookingLine(null);
      a.setBookingGuests(resolveOpenExistingBookingGuests(hydration, resolved));
      a.setShowInlineGuestField(false);

      const project = resolveOpenExistingProjectDetails(
        resolved.details?.clientSnapshot,
      );
      a.setBookingProjectEnabled(project.enabled);
      a.setBookingProjectDescription(project.description);
      a.setBookingProjectUploads(project.uploads);

      a.setBookingPhoneDraft({
        phoneCode: hydration.phoneCode,
        phoneNumber: hydration.phoneNumber,
      });
      a.setDesiredLocationDraft(hydration.desiredLocation);
      a.setShowPrepayment(hydration.showPrepayment);
      a.setPrepaymentPercent(hydration.prepaymentPercent);
      a.setPaymentMethod(hydration.paymentMethod);
      a.clearDrawerPrepaymentPaidOverride?.();
      a.setShowLateCancellation(hydration.showLateCancellation);
      a.setLateCancellationFeePercent(hydration.lateCancellationFeePercent);
      a.setLateCancellationFeePercentCeiling(
        hydration.lateCancellationFeePercentCeiling,
      );
      a.setShowLateRescheduling(hydration.showLateRescheduling);
      a.setLateRescheduleFeePercent(hydration.lateRescheduleFeePercent);
      a.setLateRescheduleFeePercentCeiling(
        hydration.lateRescheduleFeePercentCeiling,
      );
      a.setShowNoShowFee(hydration.showNoShowFee);
      a.setNoShowFeePercent(hydration.noShowFeePercent);
      a.setNoShowFeePercentCeiling(hydration.noShowFeePercentCeiling);
      a.setCancellationFeeAt(resolved.details?.cancellationFeeAt);
      a.setExceededCancellationWindow(
        resolved.details?.exceededCancellationWindow,
      );
      a.setShowInternalNote(hydration.showInternalNote);
      a.setBookingInternalNote(hydration.internalNote);
      a.setBookingTotalDiscount(hydration.totalDiscount);
      a.setBookingDiscountModalOpen(false);
      a.setShowKilometerAllowance(
        resolved.location === "DL" ? true : hydration.showKilometerAllowance,
      );
      a.setKilometerAllowanceDraft(
        resolved.location === "DL"
          ? {
              eurPerKm:
                hydration.kilometerAllowance.eurPerKm.trim() ||
                String(kilometerAllowanceEurPerKmDefault ?? "").trim(),
              totalKilometer: hydration.kilometerAllowance.totalKilometer,
            }
          : hydration.kilometerAllowance,
      );
      a.setEditingEventId(resolved.id);
      a.setSlotStatus(resolved.status);
      a.setIsEditingExisting(false);
      a.setIncomingRequestEditMode(false);
      a.setOriginalServicesSnapshot([
        ...resolveOriginalServices(resolved, hydration.services),
        ...hydration.guests.flatMap((guest) => guest.services),
      ]);
      a.setSlotSaveAttempted(false);
      a.setAddMenuTarget("client");
      a.setSelectionTarget("client");
      a.setSlotAddMenuAnchor(null);
      a.setBookingMoreAnchor(null);
      a.setSlotDrawerOpen(true);
      a.silentEditBaselineRef.current = null;
      lastLiveHydratedEventKeyRef.current = bookingEventLiveKey(resolved);
      if (
        !(
          a.bookingCheckoutOpenRef.current &&
          ev.id === a.editingEventIdRef.current
        )
      ) {
        a.setBookingCheckoutOpen(false);
      }
      a.setShowSilentFieldTags(
        shouldShowSilentUpdatedTag({
          silentUpdated: resolved.details?.silentUpdated,
          viewer: "professional",
          bookingRef: resolved.bookingCode ?? extractBookingId(resolved.id),
          updatedAt: resolved.updatedAt,
          lastEditedBy: resolved.details?.lastEditedBy ?? null,
        }),
      );
      markBookingUpdateSeen(
        "professional",
        resolved.bookingCode ?? extractBookingId(resolved.id),
        resolved.updatedAt,
      );
    },
    [
      clearBookingDrawerNotListedHint,
      clientOptions,
      events,
      kilometerAllowanceEurPerKmDefault,
    ],
  );

  React.useEffect(() => {
    if (!slotDrawerOpen) {
      lastLiveHydratedEventKeyRef.current = "";
      applyRef.current.setShowSilentFieldTags(false);
      return;
    }
    if (isEditingExisting || incomingRequestEditMode || !viewingBookingEvent) {
      return;
    }
    const liveKey = bookingEventLiveKey(viewingBookingEvent);
    if (lastLiveHydratedEventKeyRef.current === liveKey) return;
    lastLiveHydratedEventKeyRef.current = liveKey;
    openExistingBooking(viewingBookingEvent);
  }, [
    incomingRequestEditMode,
    isEditingExisting,
    openExistingBooking,
    slotDrawerOpen,
    viewingBookingEvent,
  ]);

  React.useEffect(() => {
    if (!isViewingExisting || !viewingBookingEvent) return;
    markBookingUpdateSeen(
      "professional",
      viewingBookingEvent.bookingCode ??
        extractBookingId(viewingBookingEvent.id),
      viewingBookingEvent.updatedAt,
    );
  }, [
    isViewingExisting,
    viewingBookingEvent?.bookingCode,
    viewingBookingEvent?.id,
    viewingBookingEvent?.updatedAt,
  ]);

  const { focusBookingHandledRef } =
    useProfessionalFixedLocationCalendarOpenExistingBookingFocus({
      events,
      activeDateIso,
      setActiveDateIso,
      openExistingBooking,
    });

  return { openExistingBooking, focusBookingHandledRef, lastLiveHydratedEventKeyRef };
}
