import {
  getActiveBookingSession,
  setActiveBookingSession,
  unlockEbrDraft,
} from "../../../app/clients/booking/clientBookingSession";
import { resolveCreateBookingStatus } from "../../../app/clients/booking/resolveCreateBookingStatus";
import {
  buildWallClockDateTimeIso,
  parseTimeLabelToMinutes,
} from "../../../app/clients/booking/booking-time";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";
import { splitContactPhone } from "../../../lib/phone-validation";
import {
  detectEditedServiceIds,
  detectServiceLineChanges,
  flattenBookingServices,
  isSilentSafeBookingChange,
} from "../calendar/bookingRequestNegotiation";
import {
  parseCalendarEntryNotes,
  serializeCalendarEntryNotes,
} from "../calendar/bookingEventDetails";
import {
  buildProtectiveFeeActivation,
  shouldTriggerLateRescheduleFee,
} from "../calendar/bookingFeeTriggers";
import { summarizeClientBookingPrice } from "../calendar/bookingTotal";
import {
  clientSuggestEbrChanges,
  consumeConfirmedEditGrant,
  type BookingEditSuggestedProduct,
} from "./bookingEditRequest";
import { guestsFromPeopleAndServices } from "./clientBookingDetails.helpers";
import type { ClientBookingDraft } from "./types";
import type { UpdateMyBookingRequest } from "../../../store/services/businessApi";

function readEbrBaselineSchedule() {
  if (typeof window === "undefined") return { dateISO: "", time: "" };
  try {
    const raw = window.sessionStorage.getItem("mollure:ebr_baseline_schedule");
    if (!raw) return { dateISO: "", time: "" };
    const parsed = JSON.parse(raw) as { dateISO?: string; time?: string };
    return { dateISO: parsed.dateISO ?? "", time: parsed.time ?? "" };
  } catch {
    return { dateISO: "", time: "" };
  }
}

type EditRequestSlice = {
  editedServiceIds?: string[];
  editedProductIds?: string[];
  professionalNote?: string;
  suggestedProducts?: BookingEditSuggestedProduct[] | null;
  refresh: () => void;
};

export async function persistClientEbrSuggestion(params: {
  note: string;
  editedServiceIdsOverride?: string[];
  bookingRef: string;
  apiBookingId: string | null;
  activeBookingNotes?: string | null;
  displayDraft: ClientBookingDraft | null;
  draft: ClientBookingDraft | null;
  editRequest: EditRequestSlice;
  locationMode: string;
  persistBookingPatch: (payload: UpdateMyBookingRequest) => Promise<unknown>;
  refreshActiveBooking: () => Promise<unknown> | unknown;
  showSnackbar: (opts: {
    severity: "success" | "error";
    message: string;
  }) => void;
}) {
  const {
    note,
    editedServiceIdsOverride,
    bookingRef,
    apiBookingId,
    activeBookingNotes,
    displayDraft,
    draft,
    editRequest,
    locationMode,
    persistBookingPatch,
    refreshActiveBooking,
    showSnackbar,
  } = params;

  if (!bookingRef) return;
  // Prefer the live session draft (includes services added in the editor).
  const sessionRecord = getActiveBookingSession();
  const sessionDraft = sessionRecord?.draft;
  const servicesSource =
    sessionDraft?.services ?? displayDraft?.services ?? draft?.services ?? [];
  const services = servicesSource.map((service) => ({
    id: service.id,
    name: service.name,
    durationMins: service.durationMins,
    price: service.price,
    staffResourceId: service.teamMemberId ?? undefined,
    guestId: service.guestId ?? null,
    teamMemberId: service.teamMemberId ?? null,
    startTime: service.startTime,
    endTime: service.endTime,
  }));
  const total =
    sessionDraft?.total ??
    displayDraft?.total ??
    draft?.total ??
    services.reduce((sum, service) => sum + service.price, 0);
  const editedServiceIds = editedServiceIdsOverride?.length
    ? editedServiceIdsOverride
    : (editRequest.editedServiceIds ?? []);
  const dateLabel = sessionDraft?.selectedDateISO || "";
  const timeLabel = sessionDraft?.selectedTime || "";
  const durationMins = services.reduce(
    (sum, service) => sum + (service.durationMins || 0),
    0,
  );
  const startMinutes =
    dateLabel && timeLabel ? parseTimeLabelToMinutes(timeLabel) : null;
  const suggestedStart =
    startMinutes != null
      ? `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`
      : undefined;
  const endMinutes =
    startMinutes != null ? startMinutes + Math.max(durationMins, 15) : null;
  const suggestedEnd =
    endMinutes != null
      ? `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
      : undefined;

  // Schedule/project diffs are shown via suggested* meta + Edited tag on schedule row.
  // Service-line Edited tags come from editedServiceIdsOverride / service field diffs only.

  const humanNote = note.trim();

  let baselineSchedule = { dateISO: "", time: "" };
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(
        "mollure:ebr_baseline_schedule",
      );
      if (raw) {
        const parsed = JSON.parse(raw) as {
          dateISO?: string;
          time?: string;
        };
        baselineSchedule = {
          dateISO: parsed.dateISO ?? "",
          time: parsed.time ?? "",
        };
      }
    } catch {
      // ignore
    }
  }

  // Keep people/services/project snapshot so Desired Edit can rehydrate models/guests.
  const priorNotes = parseCalendarEntryNotes(
    sessionRecord?.notes ?? activeBookingNotes,
  );
  const ebrPreviousGuests = guestsFromPeopleAndServices(
    priorNotes?.clientSnapshot?.people,
    priorNotes?.services ?? priorNotes?.originalServices ?? [],
    priorNotes?.guests,
  );
  const ebrCurrentGuests = guestsFromPeopleAndServices(
    sessionDraft?.people ?? draft?.people,
    services,
    priorNotes?.guests,
  );
  const ebrOriginalGuests = priorNotes?.originalGuests?.length
    ? priorNotes.originalGuests
    : priorNotes?.guests?.length
      ? priorNotes.guests
      : ebrPreviousGuests;
  const originalComparable = flattenBookingServices({
    services: priorNotes?.originalServices?.length
      ? priorNotes.originalServices
      : (priorNotes?.services ?? []),
    guests: ebrOriginalGuests,
  });
  const currentComparable = flattenBookingServices({
    services,
    guests: ebrCurrentGuests,
  });
  const lineChanges = detectServiceLineChanges(
    originalComparable,
    currentComparable,
  );
  const resolvedEditedIds = [
    ...new Set([
      ...editedServiceIds,
      ...lineChanges.edited,
      ...lineChanges.added,
    ]),
  ];
  const clientSnapshot = {
    people: (
      sessionDraft?.people ??
      draft?.people ??
      priorNotes?.clientSnapshot?.people ??
      []
    ).map((p) => ({
      id: p.id,
      name: p.name,
      isRequester: Boolean(p.isRequester),
      participantType: p.participantType,
      planningActivity: p.planningActivity,
      planningDuration: p.planningDuration,
      planningIsLocked: p.planningIsLocked,
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMins: s.durationMins,
      startTime: s.startTime,
      endTime: s.endTime,
      guestId: s.guestId ?? null,
      teamMemberId: s.teamMemberId ?? null,
    })),
    projectDetails: sessionDraft?.projectDetails
      ? {
          description: sessionDraft.projectDetails.description ?? "",
          uploads: (sessionDraft.projectDetails.uploads ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            previewUrl: u.previewUrl,
          })),
        }
      : priorNotes?.clientSnapshot?.projectDetails,
    teamMembers:
      sessionDraft?.teamMembers ??
      draft?.teamMembers ??
      priorNotes?.clientSnapshot?.teamMembers ??
      [],
  };

  const persistedNotes = serializeCalendarEntryNotes(
    humanNote,
    {
      showInternalNote:
        Boolean(priorNotes?.showInternalNote) || Boolean(humanNote.trim()),
      showLateRescheduling: priorNotes?.showLateRescheduling,
      lateRescheduleFeePercent: priorNotes?.lateRescheduleFeePercent,
      showLateCancellation: priorNotes?.showLateCancellation,
      lateCancellationFeePercent: priorNotes?.lateCancellationFeePercent,
      showPrepayment: priorNotes?.showPrepayment,
      prepaymentPercent: priorNotes?.prepaymentPercent,
      paymentMethod: priorNotes?.paymentMethod,
      showKilometerAllowance: priorNotes?.showKilometerAllowance,
      kilometerAllowance: priorNotes?.kilometerAllowance,
      cancellationReason: priorNotes?.cancellationReason,
      requestDirection: "incoming",
      clientSnapshot,
      guests: ebrCurrentGuests,
      originalGuests: ebrOriginalGuests,
      originalServices: priorNotes?.originalServices?.length
        ? priorNotes.originalServices
        : originalComparable.length
          ? originalComparable
          : priorNotes?.services,
      services: priorNotes?.services,
      silentUpdateSnapshot: priorNotes?.silentUpdateSnapshot ?? {
        guests: ebrPreviousGuests,
        people: priorNotes?.clientSnapshot?.people,
        services: priorNotes?.services,
        products: priorNotes?.products,
        phoneCode: priorNotes?.phoneCode,
        phoneNumber: priorNotes?.phoneNumber,
        desiredLocation: priorNotes?.desiredLocation,
      },
    },
    {
      status: "pending",
      suggestedAt: new Date().toISOString(),
      clientNote: note.trim() || undefined,
      professionalNote: editRequest.professionalNote,
      editedServiceIds: resolvedEditedIds,
      clientEditedServiceIds: resolvedEditedIds,
      addedServiceIds: lineChanges.added,
      cancelledServiceIds: lineChanges.cancelled,
      editedProductIds: editRequest.editedProductIds,
      suggestedServices: services,
      suggestedProducts: editRequest.suggestedProducts?.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity ?? 1,
        unitPrice: product.price,
      })),
      suggestedDateISO: dateLabel || undefined,
      suggestedTime: timeLabel || undefined,
      suggestedStart,
      suggestedEnd,
      ...(baselineSchedule.dateISO || baselineSchedule.time
        ? {
            originalDateISO: baselineSchedule.dateISO || undefined,
            originalTime: baselineSchedule.time || undefined,
          }
        : {}),
      suggestedTotalPrice: total,
      suggestedProjectDetails: sessionDraft?.projectDetails
        ? {
            description: sessionDraft.projectDetails.description ?? "",
            uploads: sessionDraft.projectDetails.uploads ?? [],
          }
        : undefined,
      responseStatus: "suggestion_for_change",
      requestDirection: "incoming",
      lastEditedBy: "client",
    },
  );

  clientSuggestEbrChanges(bookingRef, {
    clientNote: note,
    editedServiceIds: resolvedEditedIds,
    editedProductIds: editRequest.editedProductIds,
    addedServiceIds: lineChanges.added,
    cancelledServiceIds: lineChanges.cancelled,
    suggestedServices: services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMins: service.durationMins,
      price: service.price,
      teamMemberId: service.teamMemberId,
      guestId: service.guestId,
      startTime: service.startTime,
      endTime: service.endTime,
    })),
    suggestedProducts: editRequest.suggestedProducts ?? undefined,
  });
  if (apiBookingId) {
    // Keep original booking_date / start / end / total until the professional Accepts.
    await persistBookingPatch({
      id: apiBookingId,
      status: "requested",
      notes: persistedNotes,
    });

    const resolved = resolveCreateBookingStatus({
      locationMode: locationMode === "desired" ? "desired" : "fixed",
    });
    if (sessionRecord) {
      setActiveBookingSession({
        ...sessionRecord,
        status: resolved.status,
        bookingRequestSent: true,
        notes: persistedNotes,
        ...(resolved.bookingRequestDirection
          ? { bookingRequestDirection: resolved.bookingRequestDirection }
          : {}),
        draft: sessionDraft ? sessionDraft : sessionRecord.draft,
      });
    }
    await refreshActiveBooking();
  }
  unlockEbrDraft();
  editRequest.refresh();
  showSnackbar({
    severity: "success",
    message: "EBR sent to the professional.",
  });
}

export async function persistConfirmedGrantEdit(params: {
  bookingRef: string;
  apiBookingId: string;
  activeBooking: ClientBookingRecord | null;
  editRequest: { refresh: () => void };
  updateMyBooking: (payload: UpdateMyBookingRequest) => {
    unwrap: () => Promise<unknown>;
  };
  refreshActiveBooking: () => Promise<unknown> | unknown;
  showSnackbar: (opts: {
    severity: "success" | "error";
    message: string;
  }) => void;
  /** From business profile — late reschedule fee % (optional until wired). */
  rescheduleFeePercent?: number | null;
  rescheduleNoticeHours?: number | null;
  rescheduleNoticeMinutes?: number | null;
}) {
  const {
    bookingRef,
    apiBookingId,
    activeBooking,
    editRequest,
    updateMyBooking,
    refreshActiveBooking,
    showSnackbar,
  } = params;

  const sessionRecord = getActiveBookingSession();
  const sessionDraft = sessionRecord?.draft;
  if (!sessionDraft?.selectedDateISO) {
    unlockEbrDraft();
    showSnackbar({
      severity: "error",
      message: "Booking date is missing.",
    });
    return;
  }

  const priorNotes = parseCalendarEntryNotes(
    sessionRecord?.notes ?? activeBooking?.notes,
  );
  // Client confirmed edit: never rewrite service/price lines from the editor.
  const services = (
    priorNotes?.services?.length
      ? priorNotes.services
      : (activeBooking?.draft?.services ?? sessionDraft.services ?? [])
  ).map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMins: s.durationMins,
    guestId: s.guestId ?? null,
    teamMemberId: s.teamMemberId ?? null,
  }));
  const products = priorNotes?.products?.length
    ? priorNotes.products
    : (sessionDraft.products ?? []);
  const durationMins = services.reduce(
    (sum, service) => sum + (service.durationMins || 0),
    0,
  );
  const startMinutes = parseTimeLabelToMinutes(
    sessionDraft.selectedTime ?? "12:00 AM",
  );
  const endMinutes = startMinutes + Math.max(durationMins, 15);
  const nextDesiredLocation =
    sessionDraft.desiredLocation ?? priorNotes?.desiredLocation;
  let cursor = startMinutes;
  const serviceLines = services.map((s) => {
    const duration = Math.max(15, s.durationMins || 15);
    const startHhmm = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    cursor += duration;
    const endHhmm = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    return {
      id: s.id,
      name: s.name,
      price: s.price,
      durationMins: s.durationMins,
      guestId: s.guestId ?? null,
      teamMemberId: s.teamMemberId ?? null,
      startTime: startHhmm,
      endTime: endHhmm,
    };
  });
  const productLines = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: product.quantity || 1,
    unitPrice: product.unitPrice ?? product.price,
  }));
  const originalServices = priorNotes?.originalServices?.length
    ? priorNotes.originalServices
    : (priorNotes?.services ?? []);
  const lineChanges = detectServiceLineChanges(originalServices, serviceLines);
  const clientSnapshot = {
    people: (
      priorNotes?.clientSnapshot?.people ??
      activeBooking?.draft?.people ??
      sessionDraft.people ??
      []
    ).map((p) => ({
      id: p.id,
      name: p.name,
      isRequester: Boolean(p.isRequester),
      participantType: p.participantType,
      planningActivity: p.planningActivity,
      planningDuration: p.planningDuration,
      planningIsLocked: p.planningIsLocked,
    })),
    services: serviceLines,
    projectDetails: priorNotes?.clientSnapshot?.projectDetails
      ? priorNotes.clientSnapshot.projectDetails
      : sessionDraft.projectDetails
        ? {
            description: sessionDraft.projectDetails.description ?? "",
            uploads: (sessionDraft.projectDetails.uploads ?? []).map((u) => ({
              id: u.id,
              name: u.name,
              previewUrl: u.previewUrl,
            })),
          }
        : undefined,
    teamMembers:
      sessionDraft.teamMembers ?? activeBooking?.draft?.teamMembers ?? [],
  };
  // Draft is overwritten on "Save changes" before this persist — compare to
  // editor-open baseline (sessionStorage), not the already-updated draft.
  const baselineSchedule = readEbrBaselineSchedule();
  const baselineDate =
    baselineSchedule.dateISO || activeBooking?.draft?.selectedDateISO || "";
  const baselineTime =
    baselineSchedule.time || activeBooking?.draft?.selectedTime || "";
  const scheduleEdited =
    (sessionDraft.selectedDateISO ?? "") !== baselineDate ||
    (sessionDraft.selectedTime ?? "") !== baselineTime;
  const priorDesired = priorNotes?.desiredLocation;
  const locationEdited = Boolean(
    nextDesiredLocation &&
      (String(priorDesired?.street ?? "") !==
        String(nextDesiredLocation.street ?? "") ||
        String(priorDesired?.number ?? "") !==
          String(nextDesiredLocation.number ?? "") ||
        String(priorDesired?.postalCode ?? "") !==
          String(nextDesiredLocation.postalCode ?? "") ||
        String(priorDesired?.municipality ?? "") !==
          String(nextDesiredLocation.municipality ?? "")),
  );
  const currentPhone = splitContactPhone(
    sessionRecord?.contactPhone ?? activeBooking?.contactPhone ?? "",
    priorNotes?.phoneCode,
  );
  const comparableServiceLines = serviceLines.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMins: s.durationMins,
    guestId: s.guestId ?? null,
    teamMemberId: s.teamMemberId ?? null,
    startTime: s.startTime,
    endTime: s.endTime,
  }));
  const lockedPeople =
    priorNotes?.clientSnapshot?.people ??
    activeBooking?.draft?.people ??
    sessionDraft.people;
  const previousGuests = guestsFromPeopleAndServices(
    priorNotes?.clientSnapshot?.people,
    priorNotes?.services ?? originalServices,
    priorNotes?.guests,
  );
  const currentGuests = guestsFromPeopleAndServices(
    lockedPeople,
    comparableServiceLines,
    priorNotes?.guests,
  );
  const baselineGuests = priorNotes?.originalGuests?.length
    ? priorNotes.originalGuests
    : priorNotes?.guests?.length
      ? priorNotes.guests
      : previousGuests;
  const snapshotGuests = priorNotes?.guests?.length
    ? priorNotes.guests
    : previousGuests;
  const silentSafeOnly = isSilentSafeBookingChange({
    previousServices: priorNotes?.services ?? originalServices,
    currentServices: comparableServiceLines,
    previousGuests,
    currentGuests,
    previousPeople: priorNotes?.clientSnapshot?.people,
    currentPeople: lockedPeople,
    previousPhoneCode: priorNotes?.phoneCode,
    currentPhoneCode: currentPhone.countryCode,
    previousPhoneNumber: priorNotes?.phoneNumber,
    currentPhoneNumber: currentPhone.phone,
    previousProducts: priorNotes?.products ?? [],
    currentProducts: productLines,
    scheduleChanged: scheduleEdited || locationEdited,
  });

  const baselineStartMs = baselineDate
    ? Date.parse(
        buildWallClockDateTimeIso(
          baselineDate,
          parseTimeLabelToMinutes(baselineTime || "12:00 AM"),
        ),
      )
    : NaN;
  let showLateRescheduling = Boolean(priorNotes?.showLateRescheduling);
  let lateRescheduleFeePercent = String(
    priorNotes?.lateRescheduleFeePercent ?? "",
  );
  let lateRescheduleFeePercentCeiling =
    priorNotes?.lateRescheduleFeePercentCeiling;
  if (
    scheduleEdited &&
    shouldTriggerLateRescheduleFee({
      policyPercent: params.rescheduleFeePercent,
      scheduleEdited: true,
      alreadyShown: showLateRescheduling,
      appointmentStartMs: Number.isFinite(baselineStartMs)
        ? baselineStartMs
        : null,
      noticeHours: params.rescheduleNoticeHours,
      noticeMinutes: params.rescheduleNoticeMinutes,
    })
  ) {
    const activation = buildProtectiveFeeActivation(
      params.rescheduleFeePercent,
      { kind: "lateReschedule" },
    );
    if (activation) {
      showLateRescheduling = true;
      lateRescheduleFeePercent = activation.percent;
      lateRescheduleFeePercentCeiling = activation.ceiling;
    }
  }

  const priced = summarizeClientBookingPrice({
    services: serviceLines,
    products: productLines,
    people: lockedPeople,
    showLateRescheduling,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    showLateCancellation: priorNotes?.showLateCancellation,
    lateCancellationFeePercent: priorNotes?.lateCancellationFeePercent,
    showPrepayment: priorNotes?.showPrepayment,
    prepaymentPercent: priorNotes?.prepaymentPercent,
  });
  const lateFeeFields = {
    showLateRescheduling,
    lateRescheduleFeePercent,
    ...(lateRescheduleFeePercentCeiling
      ? { lateRescheduleFeePercentCeiling }
      : {}),
    ...(showLateRescheduling && priced.breakdown.lateRescheduleFeeAmount > 0
      ? { outstandingRescheduleFee: priced.breakdown.lateRescheduleFeeAmount }
      : {}),
  };
  const totalPriceToSave =
    priced.breakdown.bookingTotal > 0
      ? priced.breakdown.bookingTotal
      : (activeBooking?.draft?.total ??
        priorNotes?.services?.reduce((sum, s) => sum + (s.price || 0), 0) ??
        sessionDraft.total);

  const nextNotes = serializeCalendarEntryNotes(
    priorNotes?.internalNote ?? "",
    silentSafeOnly
      ? {
          ...priorNotes,
          ...lateFeeFields,
          clientSnapshot,
          services: serviceLines,
          products: productLines,
          guests: currentGuests,
          ...(nextDesiredLocation
            ? { desiredLocation: nextDesiredLocation }
            : {}),
          phoneCode: currentPhone.countryCode || priorNotes?.phoneCode,
          phoneNumber: currentPhone.phone || priorNotes?.phoneNumber,
          lastEditedBy: "client",
          silentUpdated: true,
          // Clear ER line tags — silent Updated must not revive Edited/Pending.
          editedServiceIds: undefined,
          addedServiceIds: undefined,
          cancelledServiceIds: undefined,
          editedProductIds: undefined,
          addedProductIds: undefined,
          cancelledProductIds: undefined,
          scheduleEdited: undefined,
          silentUpdateSnapshot: {
            phoneCode: priorNotes?.phoneCode,
            phoneNumber: priorNotes?.phoneNumber,
            guests: snapshotGuests,
            services: priorNotes?.services,
            products: priorNotes?.products,
            people: priorNotes?.clientSnapshot?.people,
            desiredLocation: priorNotes?.desiredLocation,
          },
          originalServices: originalServices.length
            ? originalServices
            : serviceLines,
          originalGuests: baselineGuests,
        }
      : {
          ...priorNotes,
          ...lateFeeFields,
          clientSnapshot,
          services: serviceLines,
          products: productLines,
          guests: currentGuests,
          ...(nextDesiredLocation
            ? { desiredLocation: nextDesiredLocation }
            : {}),
          lastEditedBy: "client",
          silentUpdated: undefined,
          silentUpdateSnapshot: {
            phoneCode: priorNotes?.phoneCode,
            phoneNumber: priorNotes?.phoneNumber,
            guests: snapshotGuests,
            services: priorNotes?.services,
            products: priorNotes?.products,
            people: priorNotes?.clientSnapshot?.people,
            desiredLocation: priorNotes?.desiredLocation,
          },
          ...(scheduleEdited || locationEdited
            ? { scheduleEdited: true }
            : {}),
          originalServices: originalServices.length
            ? originalServices
            : serviceLines,
          originalGuests: baselineGuests,
          editedServiceIds: detectEditedServiceIds(
            originalServices,
            serviceLines,
          ),
          addedServiceIds: lineChanges.added,
          cancelledServiceIds: lineChanges.cancelled,
        },
    null,
    null,
  );

  await updateMyBooking({
    id: apiBookingId,
    status: "confirmed",
    notes: nextNotes,
    total_price: totalPriceToSave,
    booking_date: sessionDraft.selectedDateISO,
    start_time: buildWallClockDateTimeIso(
      sessionDraft.selectedDateISO,
      startMinutes,
    ),
    end_time: buildWallClockDateTimeIso(
      sessionDraft.selectedDateISO,
      endMinutes,
    ),
  }).unwrap();

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("mollure:ebr_baseline_schedule");
  }
  consumeConfirmedEditGrant(bookingRef);
  unlockEbrDraft();
  if (sessionRecord) {
    setActiveBookingSession({
      ...sessionRecord,
      status: "confirmed",
      notes: nextNotes,
      draft: {
        ...sessionDraft,
        total: totalPriceToSave,
      },
    });
  }
  await refreshActiveBooking();
  editRequest.refresh();
  showSnackbar({
    severity: "success",
    message: "Booking updated.",
  });
}
