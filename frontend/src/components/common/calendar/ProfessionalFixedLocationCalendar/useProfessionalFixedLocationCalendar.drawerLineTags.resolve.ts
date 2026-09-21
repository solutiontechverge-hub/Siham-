import * as React from "react";
import { parseStoredEbrFromNotes } from "../bookingEventDetails";
import {
  allowComputedServiceAddCancelTags,
  detectServiceLineChanges,
  detectSilentUpdatedFields,
  flattenBookingServices,
  isSilentSafeBookingChange,
  hasServiceReorderOnly,
  resolveLineChangeTags,
  cancelledOriginalServicesForDisplay,
} from "../bookingRequestNegotiation";
import { formatMdyDate } from "../calendar.utils";
import { clockHm } from "./useProfessionalFixedLocationCalendar.helpers";
import type { UseProfessionalFixedLocationCalendarDrawerLineTagsArgs } from "./useProfessionalFixedLocationCalendar.drawerLineTags";
import type { DrawerLineTagsFlags } from "./useProfessionalFixedLocationCalendar.drawerLineTags.flags";

/** Silent-edit + line-change-tag resolution (ponytail: subdomain of drawerLineTags). */
export function useProfessionalFixedLocationCalendarDrawerLineTagsResolve(
  args: UseProfessionalFixedLocationCalendarDrawerLineTagsArgs &
    Pick<
      DrawerLineTagsFlags,
      | "awaitingLineApproval"
      | "negotiationDetails"
      | "drawerEbrNotes"
      | "savedBookingDetails"
    >,
) {
  const {
    viewingBookingEvent,
    isEditingExisting,
    selectedSlot,
    selectedServices,
    bookingGuests,
    bookingPhoneDraft,
    selectedProducts,
    bookingUniqueItems,
    showSilentFieldTags,
    awaitingLineApproval,
    negotiationDetails,
    drawerEbrNotes,
    savedBookingDetails,
  } = args;

  const drawerScheduleChangedForSilent = React.useMemo(() => {
    if (!viewingBookingEvent || !selectedSlot) return false;
    const dateChanged = viewingBookingEvent.date !== selectedSlot.date;
    const timeWindowChanged =
      clockHm(viewingBookingEvent.start) !== clockHm(selectedSlot.start) ||
      clockHm(viewingBookingEvent.end) !== clockHm(selectedSlot.end);
    if (!dateChanged && !timeWindowChanged) return false;
    const servicesReordered = hasServiceReorderOnly({
      previousServices: (savedBookingDetails?.services ?? []).filter(
        (service) => !String(service.guestId ?? "").trim(),
      ),
      currentServices: selectedServices,
      previousGuests: savedBookingDetails?.guests,
      currentGuests: bookingGuests,
    });
    return dateChanged || (timeWindowChanged && !servicesReordered);
  }, [
    bookingGuests,
    savedBookingDetails?.guests,
    savedBookingDetails?.services,
    selectedServices,
    selectedSlot,
    viewingBookingEvent,
  ]);
  /** Live Confirmed edit that is only phone / guest name / reorder → Updated, not Edited. */
  const silentSafeDrawerEdit = React.useMemo(() => {
    if (awaitingLineApproval) return false;
    if (viewingBookingEvent?.status !== "Confirmed") return false;
    if (!isEditingExisting && !savedBookingDetails?.silentUpdated) return false;
    return isSilentSafeBookingChange({
      previousServices: (savedBookingDetails?.services ?? []).filter(
        (service) => !String(service.guestId ?? "").trim(),
      ),
      currentServices: selectedServices,
      previousGuests: savedBookingDetails?.guests,
      currentGuests: bookingGuests,
      previousPeople: savedBookingDetails?.clientSnapshot?.people,
      currentPeople: savedBookingDetails?.clientSnapshot?.people,
      previousPhoneCode: savedBookingDetails?.phoneCode,
      currentPhoneCode: bookingPhoneDraft.phoneCode,
      previousPhoneNumber: savedBookingDetails?.phoneNumber,
      currentPhoneNumber: bookingPhoneDraft.phoneNumber,
      previousProducts: savedBookingDetails?.products ?? [],
      currentProducts: [...selectedProducts, ...bookingUniqueItems],
      scheduleChanged: drawerScheduleChangedForSilent,
    });
  }, [
    awaitingLineApproval,
    bookingGuests,
    bookingPhoneDraft.phoneCode,
    bookingPhoneDraft.phoneNumber,
    bookingUniqueItems,
    drawerScheduleChangedForSilent,
    isEditingExisting,
    savedBookingDetails?.clientSnapshot?.people,
    savedBookingDetails?.guests,
    savedBookingDetails?.phoneCode,
    savedBookingDetails?.phoneNumber,
    savedBookingDetails?.products,
    savedBookingDetails?.services,
    savedBookingDetails?.silentUpdated,
    selectedProducts,
    selectedServices,
    viewingBookingEvent?.status,
  ]);
  const silentFieldUpdates = React.useMemo(() => {
    // Other-party silent update only — never show Updated for the viewer's own save.
    if (!showSilentFieldTags || awaitingLineApproval) {
      return {
        phoneUpdated: false,
        guestIds: [] as string[],
        serviceIds: [] as string[],
      };
    }
    return detectSilentUpdatedFields({
      snapshot: savedBookingDetails?.silentUpdateSnapshot,
      currentPhoneCode: bookingPhoneDraft.phoneCode,
      currentPhoneNumber: bookingPhoneDraft.phoneNumber,
      currentGuests: bookingGuests,
      currentPeople: savedBookingDetails?.clientSnapshot?.people,
      currentServices: selectedServices,
    });
  }, [
    awaitingLineApproval,
    bookingGuests,
    bookingPhoneDraft.phoneCode,
    bookingPhoneDraft.phoneNumber,
    savedBookingDetails?.clientSnapshot?.people,
    savedBookingDetails?.silentUpdateSnapshot,
    selectedServices,
    showSilentFieldTags,
  ]);
  const drawerLineChangeSets = React.useMemo(() => {
    const ebr = parseStoredEbrFromNotes(drawerEbrNotes);
    const original = flattenBookingServices({
      services:
        negotiationDetails?.originalServices ??
        viewingBookingEvent?.details?.originalServices ??
        [],
      guests:
        negotiationDetails?.originalGuests ??
        viewingBookingEvent?.details?.originalGuests ??
        savedBookingDetails?.originalGuests ??
        // Create-era bookings omit originalGuests; last-saved guests are baseline.
        viewingBookingEvent?.details?.guests ??
        savedBookingDetails?.guests,
    });
    const current = [
      ...selectedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMins: service.durationMins,
        startTime: service.startTime,
        endTime: service.endTime,
        staffResourceId:
          service.staffResourceId ?? service.teamMemberId ?? undefined,
        teamMemberId:
          service.teamMemberId ?? service.staffResourceId ?? undefined,
        guestId: service.guestId,
      })),
      ...bookingGuests.flatMap((guest) =>
        guest.services.map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMins: service.durationMins,
          startTime: service.startTime,
          endTime: service.endTime,
          staffResourceId:
            service.staffResourceId ?? service.teamMemberId ?? undefined,
          teamMemberId:
            service.teamMemberId ?? service.staffResourceId ?? undefined,
          guestId: guest.id,
        })),
      ),
    ];
    const computed =
      original.length > 0
        ? detectServiceLineChanges(original, current)
        : { added: [] as string[], edited: [] as string[], cancelled: [] as string[] };
    // Suppress false Edited from reorder clocks / silent-only diffs.
    // Never drop stored Edited/Added/Cancelled — those persist until next ER.
    const suppressComputedErLineTags =
      !awaitingLineApproval &&
      (showSilentFieldTags ||
        silentSafeDrawerEdit ||
        Boolean(savedBookingDetails?.silentUpdated));
    // Create / view-after-create: no computed Added (empty or client-only
    // original would otherwise tag every guest line). Persisted ids still win.
    const allowComputedAddedCancelled = allowComputedServiceAddCancelTags({
      hasExistingBooking: Boolean(viewingBookingEvent),
      isEditingExisting,
      awaitingLineApproval,
    });
    const added =
      negotiationDetails?.addedServiceIds?.length
        ? negotiationDetails.addedServiceIds
        : ebr?.addedServiceIds?.length
          ? ebr.addedServiceIds
          : savedBookingDetails?.addedServiceIds?.length
            ? savedBookingDetails.addedServiceIds
            : !allowComputedAddedCancelled || suppressComputedErLineTags
              ? []
              : computed.added;
    const cancelled =
      negotiationDetails?.cancelledServiceIds?.length
        ? negotiationDetails.cancelledServiceIds
        : ebr?.cancelledServiceIds?.length
          ? ebr.cancelledServiceIds
          : savedBookingDetails?.cancelledServiceIds?.length
            ? savedBookingDetails.cancelledServiceIds
            : !allowComputedAddedCancelled || suppressComputedErLineTags
              ? []
              : computed.cancelled;
    const addedSet = new Set(added);
    const cancelledSet = new Set(cancelled);
    const storedEdited = [
      ...(negotiationDetails?.editedServiceIds ?? []),
      ...(negotiationDetails?.clientEditedServiceIds ?? []),
      ...(ebr?.editedServiceIds ?? []),
      ...(ebr?.clientEditedServiceIds ?? []),
      ...(savedBookingDetails?.editedServiceIds ?? []),
    ];
    const reorderOnly = hasServiceReorderOnly({
      previousServices: (savedBookingDetails?.services ?? original).filter(
        (service) => !String(service.guestId ?? "").trim(),
      ),
      currentServices: selectedServices,
      previousGuests:
        savedBookingDetails?.guests ??
        negotiationDetails?.originalGuests ??
        savedBookingDetails?.originalGuests,
      currentGuests: bookingGuests,
    });
    const hasExplicitOriginalBaseline = Boolean(
      negotiationDetails?.originalServices?.length ||
        viewingBookingEvent?.details?.originalServices?.length,
    );
    const editedSource = (() => {
      if (reorderOnly || suppressComputedErLineTags) return [] as string[];
      // Live ER: trust persisted negotiation tags until the client responds.
      if (awaitingLineApproval && storedEdited.length) return storedEdited;
      // View-after-create: no originalServices → do not invent Edited from
      // guests-only fallback baselines. Live edit still recomputes.
      if (
        !isEditingExisting &&
        !awaitingLineApproval &&
        !hasExplicitOriginalBaseline
      ) {
        return storedEdited;
      }
      // Recompute when we have a baseline so stale notes.editedServiceIds
      // (e.g. false multi-guest id collisions) do not sticky-badge on view.
      if (original.length > 0) return computed.edited;
      return storedEdited;
    })();
    return {
      added,
      cancelled,
      edited: editedSource.filter(
        (id) => !addedSet.has(id) && !cancelledSet.has(id),
      ),
    };
  }, [
    awaitingLineApproval,
    bookingGuests,
    drawerEbrNotes,
    isEditingExisting,
    negotiationDetails?.addedServiceIds,
    negotiationDetails?.cancelledServiceIds,
    negotiationDetails?.clientEditedServiceIds,
    negotiationDetails?.editedServiceIds,
    negotiationDetails?.originalGuests,
    negotiationDetails?.originalServices,
    savedBookingDetails?.addedServiceIds,
    savedBookingDetails?.cancelledServiceIds,
    savedBookingDetails?.editedServiceIds,
    savedBookingDetails?.guests,
    savedBookingDetails?.originalGuests,
    savedBookingDetails?.services,
    savedBookingDetails?.silentUpdated,
    selectedServices,
    showSilentFieldTags,
    silentSafeDrawerEdit,
    viewingBookingEvent,
    viewingBookingEvent?.details?.guests,
    viewingBookingEvent?.details?.originalGuests,
    viewingBookingEvent?.details?.originalServices,
  ]);
  /** Per-item Edited / Added / Cancelled, plus Pending while client approval is outstanding. */
  const resolveServiceEditTag = React.useCallback(
    (serviceId: string) => {
      // Persisted Edited/Added/Cancelled always win over ephemeral Updated.
      const erTags = resolveLineChangeTags(serviceId, {
        editedIds: drawerLineChangeSets.edited,
        addedIds: drawerLineChangeSets.added,
        cancelledIds: drawerLineChangeSets.cancelled,
        awaitingApproval: awaitingLineApproval,
      });
      if (erTags.length) return erTags;
      return silentFieldUpdates.serviceIds.includes(serviceId)
        ? (["updated"] as const)
        : [];
    },
    [
      awaitingLineApproval,
      drawerLineChangeSets,
      silentFieldUpdates.serviceIds,
    ],
  );

  const cancelledServicesForDrawer = React.useMemo(() => {
    const cancelledIds = drawerLineChangeSets.cancelled;
    const currentIds = new Set([
      ...selectedServices.map((service) => service.id),
      ...bookingGuests.flatMap((guest) =>
        guest.services.map((service) => service.id),
      ),
    ]);
    return cancelledOriginalServicesForDisplay(
      negotiationDetails?.originalServices ??
        viewingBookingEvent?.details?.originalServices,
      currentIds,
      cancelledIds,
    ).map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMins: service.durationMins,
      startTime: service.startTime,
      endTime: service.endTime,
      staffResourceId: service.staffResourceId,
      guestId: service.guestId,
    }));
  }, [
    bookingGuests,
    drawerLineChangeSets.cancelled,
    negotiationDetails?.originalServices,
    selectedServices,
    viewingBookingEvent,
  ]);
  const mainCancelledServices = cancelledServicesForDrawer.filter(
    (service) =>
      !service.guestId ||
      !bookingGuests.some((guest) => guest.id === service.guestId),
  );

  const resolveProductEditTag = React.useCallback(
    (productId: string) => {
      const ebr = parseStoredEbrFromNotes(drawerEbrNotes);
      return resolveLineChangeTags(productId, {
        editedIds: [
          ...(negotiationDetails?.editedProductIds ?? []),
          ...(ebr?.editedProductIds ?? []),
        ],
        addedIds: [
          ...(negotiationDetails?.addedProductIds ?? []),
          ...(ebr?.addedProductIds ?? []),
        ],
        cancelledIds: [
          ...(negotiationDetails?.cancelledProductIds ?? []),
          ...(ebr?.cancelledProductIds ?? []),
        ],
        awaitingApproval: awaitingLineApproval,
      });
    },
    [awaitingLineApproval, drawerEbrNotes, negotiationDetails],
  );

  const clientEbrSuggestion = React.useMemo(() => {
    if (!viewingBookingEvent || viewingBookingEvent.bookingScenario !== "EBR")
      return null;
    const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
    if (!ebr || ebr.lastEditedBy !== "client") return null;
    return ebr;
  }, [viewingBookingEvent]);

  const requestedScheduleLabel = React.useMemo(() => {
    if (!clientEbrSuggestion?.suggestedDateISO) return "";
    const datePart = formatMdyDate(clientEbrSuggestion.suggestedDateISO);
    const timePart = clientEbrSuggestion.suggestedTime?.trim() || "";
    return [datePart, timePart].filter(Boolean).join(" · ");
  }, [clientEbrSuggestion]);

  const scheduleChangeTags = React.useMemo(() => {
    if (requestedScheduleLabel) return [];
    const ebr = parseStoredEbrFromNotes(viewingBookingEvent?.notes);
    const scheduleChanged =
      Boolean(negotiationDetails?.scheduleEdited) ||
      Boolean(
        ebr?.originalDateISO &&
          ebr.suggestedDateISO &&
          (ebr.originalDateISO !== ebr.suggestedDateISO ||
            (ebr.originalTime &&
              ebr.suggestedStart &&
              ebr.originalTime !== ebr.suggestedStart)),
      );
    if (!scheduleChanged) return [];
    return awaitingLineApproval
      ? (["edited", "pending"] as const)
      : (["edited"] as const);
  }, [
    awaitingLineApproval,
    negotiationDetails?.scheduleEdited,
    requestedScheduleLabel,
    viewingBookingEvent?.notes,
  ]);

  return {
    drawerScheduleChangedForSilent,
    silentSafeDrawerEdit,
    silentFieldUpdates,
    drawerLineChangeSets,
    resolveServiceEditTag,
    cancelledServicesForDrawer,
    mainCancelledServices,
    resolveProductEditTag,
    clientEbrSuggestion,
    requestedScheduleLabel,
    scheduleChangeTags,
  };
}
