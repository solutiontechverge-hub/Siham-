"use client";

import * as React from "react";
import type { CalendarBookingDetails } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import {
  allowComputedServiceAddCancelTags,
  bookingNotesIndicateSilentOnlyVisit,
  detectProductLineChanges,
  detectServiceLineChanges,
  flattenBookingServices,
  hasServiceReorderOnly,
  isAwaitingClientChangeApproval,
} from "../calendar/bookingRequestNegotiation";
import type { ClientBookingDraft } from "./types";
import type { BookingEditRequestRecord } from "./bookingEditRequest";

type LineTagService = {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  startTime?: string;
  endTime?: string;
  teamMemberId?: string | null;
  staffResourceId?: string | null;
  guestId?: string | null;
};

export function toComparableLineServices(
  services: readonly LineTagService[],
) {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    price: service.price,
    durationMins: service.durationMins,
    startTime: service.startTime,
    endTime: service.endTime,
    staffResourceId: service.teamMemberId ?? service.staffResourceId ?? undefined,
    guestId: service.guestId ?? undefined,
  }));
}

export function resolveHasProfessionalSuggestedEdits(input: {
  isCancelled: boolean;
  isEbrIncoming: boolean;
  isIncomingConfirmedEr: boolean;
  editRequest: Pick<
    BookingEditRequestRecord,
    "status"
  > & {
    isAccepted: boolean;
    isRejected: boolean;
    isSuggested: boolean;
  };
  bookingNotesMeta?: CalendarBookingDetails | null;
}) {
  if (input.isCancelled) return false;
  if (input.editRequest.isAccepted || input.editRequest.isRejected) return false;
  // Silent phone / guest / reorder — never treat as a professional suggestion,
  // even when a stale editRequest still says suggested/pending.
  if (bookingNotesIndicateSilentOnlyVisit(input.bookingNotesMeta)) return false;
  if (
    input.isEbrIncoming ||
    input.isIncomingConfirmedEr ||
    input.editRequest.isSuggested
  ) {
    return true;
  }
  return isAwaitingClientChangeApproval(input.bookingNotesMeta, {
    lastEditedBy: input.bookingNotesMeta?.lastEditedBy,
    status: input.editRequest.status,
  });
}

/**
 * Silent Updated never awaits approval. Stale editRequest.isSuggested/isPending
 * must not keep Edited+Pending on every service line (screenshot regression).
 */
export function resolveClientChangesAwaitingApproval(input: {
  hasProfessionalSuggestedEdits: boolean;
  isEbrIncoming: boolean;
  editRequestIsSuggested: boolean;
  silentOnlyVisit: boolean;
}): boolean {
  if (input.silentOnlyVisit) return false;
  return (
    input.hasProfessionalSuggestedEdits ||
    input.editRequestIsSuggested ||
    input.isEbrIncoming
  );
}

/** Silent-only visit: never surface leftover Edited/Added/Cancelled line ids. */
export function resolveClientVisibleEditedServiceIds(input: {
  silentOnlyVisit: boolean;
  mergedIds: readonly string[];
  healedEdited?: readonly string[];
  allowHealed?: boolean;
}): string[] | undefined {
  if (input.silentOnlyVisit) return undefined;
  if (input.mergedIds.length) return [...new Set(input.mergedIds)];
  if (input.allowHealed && input.healedEdited?.length) {
    return [...input.healedEdited];
  }
  return undefined;
}

export function resolveClientScheduleChangeTags(input: {
  clientChangesAwaitingApproval: boolean;
  bookingNotesMeta?: CalendarBookingDetails | null;
  editRequest: Pick<
    BookingEditRequestRecord,
    | "originalDateISO"
    | "suggestedDateISO"
    | "originalTime"
    | "suggestedTime"
  >;
}): readonly ("edited" | "pending")[] {
  const scheduleChanged =
    Boolean(input.bookingNotesMeta?.scheduleEdited) ||
    Boolean(
      input.editRequest.originalDateISO &&
        input.editRequest.suggestedDateISO &&
        (input.editRequest.originalDateISO !==
          input.editRequest.suggestedDateISO ||
          (input.editRequest.originalTime &&
            input.editRequest.suggestedTime &&
            input.editRequest.originalTime !== input.editRequest.suggestedTime)),
    );
  if (!scheduleChanged) return [];
  return input.clientChangesAwaitingApproval
    ? (["edited", "pending"] as const)
    : (["edited"] as const);
}

export function resolveLineTagComparisonMode(input: {
  clientChangesAwaitingApproval: boolean;
  isEbrIncoming: boolean;
  bookingStatus: ClientBookingStatus;
  bookingNotesMeta?: CalendarBookingDetails | null;
  clientVisibleEditedServiceIds?: string[] | null;
  clientVisibleAddedServiceIds: string[];
  clientVisibleCancelledServiceIds: string[];
  clientVisibleEditedProductIds?: string[] | null;
  clientVisibleAddedProductIds?: string[] | null;
  clientVisibleCancelledProductIds?: string[] | null;
}): "ebr" | "er" | "silent_updated" {
  const hasPersistedLineEdits = Boolean(
    input.clientVisibleEditedServiceIds?.length ||
      input.clientVisibleAddedServiceIds.length ||
      input.clientVisibleCancelledServiceIds.length ||
      input.clientVisibleEditedProductIds?.length ||
      input.clientVisibleAddedProductIds?.length ||
      input.clientVisibleCancelledProductIds?.length ||
      input.bookingNotesMeta?.scheduleEdited,
  );
  if (input.clientChangesAwaitingApproval) {
    return input.isEbrIncoming ? "ebr" : "er";
  }
  // Silent-only visit → Updated chips / Activity, never leftover Edited ids.
  if (
    input.bookingNotesMeta?.silentUpdated ||
    (input.bookingNotesMeta &&
      bookingNotesIndicateSilentOnlyVisit(input.bookingNotesMeta))
  ) {
    return "silent_updated";
  }
  // Edited/Added/Cancelled → Activity ER/EBR comparison (not silent Updated).
  if (hasPersistedLineEdits) {
    return input.bookingStatus === "requested" ? "ebr" : "er";
  }
  if (input.bookingStatus === "requested") return "ebr";
  return "er";
}

type EditRequestLineSlice = BookingEditRequestRecord & {
  isPending: boolean;
  isSuggested: boolean;
  isRejected: boolean;
  isAccepted: boolean;
};

type ActiveBookingLineSlice = {
  editedServiceIds?: string[] | null;
  editedProductIds?: string[] | null;
  incomingEditRequest?: {
    status?: string | null;
    editedServiceIds?: string[] | null;
    addedServiceIds?: string[] | null;
    cancelledServiceIds?: string[] | null;
  } | null;
} | null | undefined;

/**
 * Line-change tags after EBR accept (client or professional).
 * While a professional-sent edit awaits client approval, each changed line
 * keeps Edited/Added/Cancelled and also shows Pending.
 */
export function useClientBookingLineChangeTags(input: {
  isCancelled: boolean;
  isEbrIncoming: boolean;
  isIncomingConfirmedEr: boolean;
  bookingStatus: ClientBookingStatus;
  bookingNotesMeta?: CalendarBookingDetails | null;
  draft: ClientBookingDraft | null;
  displayDraft: ClientBookingDraft | null;
  editRequest: EditRequestLineSlice;
  activeBooking: ActiveBookingLineSlice;
}) {
  const {
    isCancelled,
    isEbrIncoming,
    isIncomingConfirmedEr,
    bookingStatus,
    bookingNotesMeta,
    draft,
    displayDraft,
    editRequest,
    activeBooking,
  } = input;

  const silentOnlyVisit = bookingNotesIndicateSilentOnlyVisit(bookingNotesMeta);

  const hasProfessionalSuggestedEdits = React.useMemo(
    () =>
      resolveHasProfessionalSuggestedEdits({
        isCancelled,
        isEbrIncoming,
        isIncomingConfirmedEr,
        editRequest,
        bookingNotesMeta,
      }),
    [
      bookingNotesMeta,
      editRequest,
      isCancelled,
      isEbrIncoming,
      isIncomingConfirmedEr,
    ],
  );

  const clientChangesAwaitingApproval = resolveClientChangesAwaitingApproval({
    hasProfessionalSuggestedEdits,
    isEbrIncoming,
    editRequestIsSuggested: editRequest.isSuggested,
    silentOnlyVisit,
  });

  const pendingServiceChangeSets = React.useMemo(() => {
    if (!clientChangesAwaitingApproval) return null;
    // Only ER/EBR originalServices — services/draft fallback false-tags creates.
    const baseline = bookingNotesMeta?.originalServices ?? [];
    if (!baseline.length) return null;
    const original = toComparableLineServices(
      flattenBookingServices({
        services: baseline,
        guests: bookingNotesMeta?.originalGuests ?? bookingNotesMeta?.guests,
      }),
    );
    if (!original.length) return null;
    const current = toComparableLineServices(
      flattenBookingServices({
        services: displayDraft?.services ?? draft?.services ?? [],
        guests: bookingNotesMeta?.guests,
      }),
    );
    return detectServiceLineChanges(original, current);
  }, [
    bookingNotesMeta?.guests,
    bookingNotesMeta?.originalGuests,
    bookingNotesMeta?.originalServices,
    clientChangesAwaitingApproval,
    displayDraft?.services,
    draft?.services,
  ]);

  const pendingProductChangeSets = React.useMemo(() => {
    if (!clientChangesAwaitingApproval) return null;
    const original = bookingNotesMeta?.products ?? [];
    const current =
      displayDraft?.products ??
      editRequest.suggestedProducts ??
      draft?.products ??
      [];
    if (!original.length && !current.length) return null;
    const changes = detectProductLineChanges(original, current);
    if (
      !changes.added.length &&
      !changes.edited.length &&
      !changes.cancelled.length
    ) {
      return null;
    }
    return changes;
  }, [
    bookingNotesMeta?.products,
    clientChangesAwaitingApproval,
    displayDraft?.products,
    draft?.products,
    editRequest.suggestedProducts,
  ]);

  // Only ER/EBR baselines (originalServices). Falling back to services/draft
  // false-tags every fresh create (guest lines → Added, field drift → Edited).
  const healedServiceLineChanges = React.useMemo(() => {
    const empty = {
      added: [] as string[],
      edited: [] as string[],
      cancelled: [] as string[],
    };
    const baseline = bookingNotesMeta?.originalServices ?? [];
    if (!baseline.length) return empty;
    const original = flattenBookingServices({
      services: baseline,
      guests: bookingNotesMeta?.originalGuests,
    });
    const current = flattenBookingServices({
      services: displayDraft?.services ?? draft?.services ?? [],
      guests: bookingNotesMeta?.guests,
    });
    if (!original.length) return empty;
    const reorderOnly = hasServiceReorderOnly({
      previousServices: original.filter(
        (service) => !String(service.guestId ?? "").trim(),
      ),
      currentServices: current.filter(
        (service) => !String(service.guestId ?? "").trim(),
      ),
      previousGuests: bookingNotesMeta?.originalGuests,
      currentGuests: bookingNotesMeta?.guests,
    });
    const computed = detectServiceLineChanges(original, current);
    return {
      added: computed.added,
      cancelled: computed.cancelled,
      edited: reorderOnly ? [] : computed.edited,
    };
  }, [
    bookingNotesMeta?.guests,
    bookingNotesMeta?.originalGuests,
    bookingNotesMeta?.originalServices,
    displayDraft?.services,
    draft?.services,
  ]);

  // Match pro drawer: computed Added/Cancelled only while awaiting approval.
  const allowHealedComputedLineTags = allowComputedServiceAddCancelTags({
    hasExistingBooking: Boolean(activeBooking) && bookingStatus !== "draft",
    isEditingExisting: false,
    awaitingLineApproval: clientChangesAwaitingApproval,
  });

  const clientVisibleEditedServiceIds = React.useMemo(() => {
    const editReqActive =
      editRequest.isSuggested ||
      editRequest.isPending ||
      editRequest.isAccepted;
    const incoming = activeBooking?.incomingEditRequest;
    const incomingStatus = String(incoming?.status ?? "").toLowerCase();
    const incomingActive =
      incomingStatus === "suggested" ||
      incomingStatus === "pending" ||
      incomingStatus === "accepted";
    return resolveClientVisibleEditedServiceIds({
      silentOnlyVisit,
      mergedIds: [
        ...(pendingServiceChangeSets?.edited ?? []),
        ...(bookingNotesMeta?.editedServiceIds ?? []),
        ...(editReqActive ? (editRequest.editedServiceIds ?? []) : []),
        ...(activeBooking?.editedServiceIds ?? []),
        ...(incomingActive ? (incoming?.editedServiceIds ?? []) : []),
      ],
      healedEdited: healedServiceLineChanges.edited,
      allowHealed: allowHealedComputedLineTags,
    });
  }, [
    activeBooking?.editedServiceIds,
    activeBooking?.incomingEditRequest,
    allowHealedComputedLineTags,
    bookingNotesMeta?.editedServiceIds,
    editRequest.editedServiceIds,
    editRequest.isAccepted,
    editRequest.isPending,
    editRequest.isSuggested,
    healedServiceLineChanges.edited,
    pendingServiceChangeSets,
    silentOnlyVisit,
  ]);

  const clientVisibleAddedServiceIds = React.useMemo(() => {
    if (silentOnlyVisit) {
      return [];
    }
    const editReqActive =
      editRequest.isSuggested ||
      editRequest.isPending ||
      editRequest.isAccepted;
    const incoming = activeBooking?.incomingEditRequest;
    const incomingStatus = String(incoming?.status ?? "").toLowerCase();
    const incomingActive =
      incomingStatus === "suggested" ||
      incomingStatus === "pending" ||
      incomingStatus === "accepted";
    return [
      ...new Set([
        ...(pendingServiceChangeSets?.added ?? []),
        ...(bookingNotesMeta?.addedServiceIds ?? []),
        ...(editReqActive ? (editRequest.addedServiceIds ?? []) : []),
        ...(incomingActive ? (incoming?.addedServiceIds ?? []) : []),
        ...(allowHealedComputedLineTags
          ? healedServiceLineChanges.added
          : []),
      ]),
    ];
  }, [
    activeBooking?.incomingEditRequest,
    allowHealedComputedLineTags,
    bookingNotesMeta?.addedServiceIds,
    editRequest.addedServiceIds,
    editRequest.isAccepted,
    editRequest.isPending,
    editRequest.isSuggested,
    healedServiceLineChanges.added,
    pendingServiceChangeSets,
    silentOnlyVisit,
  ]);

  const clientVisibleCancelledServiceIds = React.useMemo(() => {
    if (silentOnlyVisit) {
      return [];
    }
    const editReqActive =
      editRequest.isSuggested ||
      editRequest.isPending ||
      editRequest.isAccepted;
    const incoming = activeBooking?.incomingEditRequest;
    const incomingStatus = String(incoming?.status ?? "").toLowerCase();
    const incomingActive =
      incomingStatus === "suggested" ||
      incomingStatus === "pending" ||
      incomingStatus === "accepted";
    return [
      ...new Set([
        ...(pendingServiceChangeSets?.cancelled ?? []),
        ...(bookingNotesMeta?.cancelledServiceIds ?? []),
        ...(editReqActive ? (editRequest.cancelledServiceIds ?? []) : []),
        ...(incomingActive ? (incoming?.cancelledServiceIds ?? []) : []),
        ...(allowHealedComputedLineTags
          ? healedServiceLineChanges.cancelled
          : []),
      ]),
    ];
  }, [
    activeBooking?.incomingEditRequest,
    allowHealedComputedLineTags,
    bookingNotesMeta?.cancelledServiceIds,
    editRequest.cancelledServiceIds,
    editRequest.isAccepted,
    editRequest.isPending,
    editRequest.isSuggested,
    healedServiceLineChanges.cancelled,
    pendingServiceChangeSets,
    silentOnlyVisit,
  ]);

  const cancelledServicesForDisplay = React.useMemo(() => {
    const ids = new Set(clientVisibleCancelledServiceIds);
    if (!ids.size) return [];
    const originals = flattenBookingServices({
      services:
        bookingNotesMeta?.originalServices ?? bookingNotesMeta?.services ?? [],
      guests: bookingNotesMeta?.originalGuests ?? bookingNotesMeta?.guests,
    });
    const currentIds = new Set(
      flattenBookingServices({
        services: displayDraft?.services ?? [],
        guests: bookingNotesMeta?.guests,
      }).map((service) => service.id),
    );
    return originals
      .filter((service) => ids.has(service.id) && !currentIds.has(service.id))
      .map((service) => ({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        guestId: service.guestId ?? null,
        teamMemberId: service.teamMemberId ?? service.staffResourceId ?? null,
        startTime: service.startTime,
        endTime: service.endTime,
      }));
  }, [
    bookingNotesMeta?.guests,
    bookingNotesMeta?.originalGuests,
    bookingNotesMeta?.originalServices,
    bookingNotesMeta?.services,
    clientVisibleCancelledServiceIds,
    displayDraft?.services,
  ]);

  const clientVisibleEditedProductIds = React.useMemo(() => {
    if (silentOnlyVisit) {
      return undefined;
    }
    if (pendingProductChangeSets) return pendingProductChangeSets.edited;
    if (bookingNotesMeta?.lastEditedBy === "client") return undefined;
    if (editRequest.isPending) return undefined;
    if (isEbrIncoming || editRequest.isSuggested) {
      return (
        editRequest.editedProductIds ??
        activeBooking?.editedProductIds ??
        undefined
      );
    }
    if (bookingNotesMeta?.lastEditedBy === "professional") {
      return (
        activeBooking?.editedProductIds ??
        editRequest.editedProductIds ??
        undefined
      );
    }
    if (!editRequest.isRejected && !editRequest.isAccepted) {
      return activeBooking?.editedProductIds ?? undefined;
    }
    return undefined;
  }, [
    activeBooking?.editedProductIds,
    bookingNotesMeta?.lastEditedBy,
    editRequest.editedProductIds,
    editRequest.isAccepted,
    editRequest.isPending,
    editRequest.isRejected,
    editRequest.isSuggested,
    isEbrIncoming,
    pendingProductChangeSets,
    silentOnlyVisit,
  ]);

  const clientVisibleAddedProductIds = React.useMemo(
    () =>
      silentOnlyVisit
        ? undefined
        : pendingProductChangeSets?.added ??
          editRequest.addedProductIds ??
          bookingNotesMeta?.addedProductIds,
    [
      bookingNotesMeta?.addedProductIds,
      editRequest.addedProductIds,
      pendingProductChangeSets,
      silentOnlyVisit,
    ],
  );

  const clientVisibleCancelledProductIds = React.useMemo(
    () =>
      silentOnlyVisit
        ? undefined
        : pendingProductChangeSets?.cancelled ??
          editRequest.cancelledProductIds ??
          bookingNotesMeta?.cancelledProductIds,
    [
      bookingNotesMeta?.cancelledProductIds,
      editRequest.cancelledProductIds,
      pendingProductChangeSets,
      silentOnlyVisit,
    ],
  );

  const clientScheduleChangeTags = React.useMemo(
    () =>
      resolveClientScheduleChangeTags({
        clientChangesAwaitingApproval,
        bookingNotesMeta,
        editRequest,
      }),
    [bookingNotesMeta, clientChangesAwaitingApproval, editRequest],
  );

  const lineTagComparisonMode = React.useMemo(
    () =>
      resolveLineTagComparisonMode({
        clientChangesAwaitingApproval,
        isEbrIncoming,
        bookingStatus,
        bookingNotesMeta,
        clientVisibleEditedServiceIds,
        clientVisibleAddedServiceIds,
        clientVisibleCancelledServiceIds,
        clientVisibleEditedProductIds,
        clientVisibleAddedProductIds,
        clientVisibleCancelledProductIds,
      }),
    [
      bookingNotesMeta,
      bookingStatus,
      clientChangesAwaitingApproval,
      clientVisibleAddedProductIds,
      clientVisibleAddedServiceIds,
      clientVisibleCancelledProductIds,
      clientVisibleCancelledServiceIds,
      clientVisibleEditedProductIds,
      clientVisibleEditedServiceIds,
      isEbrIncoming,
    ],
  );

  return {
    hasProfessionalSuggestedEdits,
    clientChangesAwaitingApproval,
    cancelledServicesForDisplay,
    clientVisibleEditedServiceIds,
    clientVisibleAddedServiceIds,
    clientVisibleCancelledServiceIds,
    clientVisibleEditedProductIds,
    clientVisibleAddedProductIds,
    clientVisibleCancelledProductIds,
    clientScheduleChangeTags,
    lineTagComparisonMode,
  };
}
