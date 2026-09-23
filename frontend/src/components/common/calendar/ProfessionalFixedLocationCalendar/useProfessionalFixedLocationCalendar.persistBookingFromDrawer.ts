import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { resolveMediaUrl } from "../../../../lib/resolveMediaUrl";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildCreateCalendarEntryPayload,
  mapCalendarEntryToEvent,
} from "../calendar-entry.mappers";
import {
  buildBookingDetailsSnapshot,
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { resolveOfflineBookingPrepayAction } from "../bookingCheckout";
import { consumeConfirmedEditGrant } from "../../client-booking/bookingEditRequest";
import { supersedeOpenSalesCardsForBooking } from "../salesOverview.storage";
import { extractBookingId, type SelectedSlot } from "../calendar.utils";
import {
  applyPendingInlineGuestEdit,
  calendarStatusToApiValue,
  clockHm,
  isIsoDateTime,
} from "./useProfessionalFixedLocationCalendar.helpers";
import type {
  InlineGuestDraftState,
  ProfessionalFixedLocationCalendarProps,
} from "./useProfessionalFixedLocationCalendar.types";
import {
  applyExistingBookingEditLabels,
  buildLocalPersistEvent,
  buildPersistClientSnapshot,
  buildStaffServiceIntervals,
  resolvePersistClientName,
  resolveStaffConflictMessage,
  type PersistBookingGuest as BookingGuest,
} from "./useProfessionalFixedLocationCalendar.persistBookingFromDrawer.helpers";
import { clearProfessionalBookingDrawerDraft } from "./professionalBookingDrawerDraft";
import {
  buildPersistBookingTitle,
  buildPersistDrawerDetails,
  mapProjectUploadsBaseline,
  mergeProjectUploadsWithAttachments,
  resolvePersistStatusAndBookingType,
} from "./useProfessionalFixedLocationCalendar.persistBookingFromDrawer.buildDetails";
import { persistIncomingEbrFromDrawer } from "./useProfessionalFixedLocationCalendar.persistBookingFromDrawer.incomingEbr";

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

/** Persist drawer booking — deps + apply bag (ponytail: same pattern as openBookingDrawer). */
export type UseProfessionalFixedLocationCalendarPersistBookingFromDrawerArgs = {
  selectedSlot: SelectedSlot | null;
  bookingGuests: BookingGuest[];
  editingInlineGuestId: string | null;
  inlineGuestDraft: InlineGuestDraftState;
  emptyInlineGuestDraft: InlineGuestDraftState;
  editingEventId: string | null;
  events: readonly CalendarEvent[];
  slotLocation: CalendarEvent["location"];
  incomingRequestEditMode: boolean;
  originalServicesSnapshot: BookingServiceLineItem[];
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  selectedClient: {
    name: string;
    email: string;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
    isGuest?: boolean;
    isMollure?: boolean;
  } | null;
  addClientSource: "" | "client-list" | "mollure-platform" | "non-mollure" | "guest";
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  desiredLocationDraft: Parameters<
    typeof buildBookingDetailsSnapshot
  >[0]["desiredLocationDraft"];
  showPrepayment: boolean;
  prepaymentPercent: string;
  prepaymentAmount: number;
  paymentMethod: "online" | "offline";
  /** Matches offline Save confirmPrepayment / temp Pay Now paid override. */
  confirmPrepayment: boolean;
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling: string;
  showNoShowFee: boolean;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  cancellationFeeAt: string | null | undefined;
  exceededCancellationWindow: boolean | undefined;
  showInternalNote: boolean;
  bookingInternalNote: string;
  bookingTotalDiscount: Parameters<
    typeof buildBookingDetailsSnapshot
  >[0]["bookingTotalDiscount"];
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: { eurPerKm: string; totalKilometer: string };
  bookingTotalForSave: number;
  businessResponseWindowInput: { hours?: number | null; minutes?: number | null };
  resourceNameById: Map<string, string>;
  guestDraft: { firstName: string; lastName: string };
  nonMollureDraft: { firstName: string; lastName: string };
  bookingProjectDescription: string;
  bookingProjectEnabled: boolean;
  bookingProjectUploads: {
    id: string;
    name: string;
    url?: string;
    mimeType?: string;
    kind?: string;
    previewUrl?: string;
    file?: File;
  }[];
  canUseBookingProject: boolean;
  slotStatus: CalendarEvent["status"];
  slotBookingType: NonNullable<CalendarEvent["bookingType"]>;
  onCreateCalendarEntry: ProfessionalFixedLocationCalendarProps["onCreateCalendarEntry"];
  onUpdateBookingStatus: ProfessionalFixedLocationCalendarProps["onUpdateBookingStatus"];
  onUpdateCalendarEntry: ProfessionalFixedLocationCalendarProps["onUpdateCalendarEntry"];
  dispatchBookingEventIfApi: (
    eventId: string | null | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    opts?: { initiated_by?: "client" | "professional"; message?: string },
  ) => void | Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadBookingAttachments: (...args: any[]) => { unwrap: () => Promise<any> };
  showSnackbar: ShowSnackbar;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addIdentityToClientList: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findListedClient: (...args: any[]) => any;
  // Setters + refs — intentional apply bag (ponytail: keep colocated).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply: Record<string, any>;
};

export function useProfessionalFixedLocationCalendarPersistBookingFromDrawer({
  selectedSlot,
  bookingGuests,
  editingInlineGuestId,
  inlineGuestDraft,
  emptyInlineGuestDraft,
  editingEventId,
  events,
  slotLocation,
  incomingRequestEditMode,
  originalServicesSnapshot,
  selectedServices,
  selectedProducts,
  bookingUniqueItems,
  selectedClient,
  addClientSource,
  bookingPhoneDraft,
  desiredLocationDraft,
  showPrepayment,
  prepaymentPercent,
  prepaymentAmount,
  paymentMethod,
  confirmPrepayment,
  showLateCancellation,
  lateCancellationFeePercent,
  lateCancellationFeePercentCeiling,
  showLateRescheduling,
  lateRescheduleFeePercent,
  lateRescheduleFeePercentCeiling,
  showNoShowFee,
  noShowFeePercent,
  noShowFeePercentCeiling,
  cancellationFeeAt,
  exceededCancellationWindow,
  showInternalNote,
  bookingInternalNote,
  bookingTotalDiscount,
  showKilometerAllowance,
  kilometerAllowanceDraft,
  bookingTotalForSave,
  businessResponseWindowInput,
  resourceNameById,
  guestDraft,
  nonMollureDraft,
  bookingProjectDescription,
  bookingProjectEnabled,
  bookingProjectUploads,
  canUseBookingProject,
  slotStatus,
  slotBookingType,
  onCreateCalendarEntry,
  onUpdateBookingStatus,
  onUpdateCalendarEntry,
  dispatchBookingEventIfApi,
  uploadBookingAttachments,
  showSnackbar,
  addIdentityToClientList,
  findListedClient,
  apply,
}: UseProfessionalFixedLocationCalendarPersistBookingFromDrawerArgs) {
  const {
    setBookingGuests,
    setEditingInlineGuestId,
    setShowInlineGuestField,
    setInlineGuestDraft,
    setEvents,
    setIncomingRequestEditMode,
    setIsEditingExisting,
    setSlotStatus,
    setStaffConflictMessage,
    setStaffConflictOpen,
    setSlotSaveAttempted,
    setActiveDateIso,
    setBookingProjectUploads,
    setEditingEventId,
    staffConflictAckRef,
    silentEditBaselineRef,
    reopenBookingAfterSaveRef,
  } = apply as {
    setBookingGuests: React.Dispatch<React.SetStateAction<BookingGuest[]>>;
    setEditingInlineGuestId: React.Dispatch<React.SetStateAction<string | null>>;
    setShowInlineGuestField: React.Dispatch<React.SetStateAction<boolean>>;
    setInlineGuestDraft: React.Dispatch<React.SetStateAction<InlineGuestDraftState>>;
    setEvents: React.Dispatch<React.SetStateAction<readonly CalendarEvent[]>>;
    setIncomingRequestEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    setIsEditingExisting: React.Dispatch<React.SetStateAction<boolean>>;
    setSlotStatus: React.Dispatch<React.SetStateAction<CalendarEvent["status"]>>;
    setStaffConflictMessage: React.Dispatch<React.SetStateAction<string | null>>;
    setStaffConflictOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSlotSaveAttempted: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveDateIso: React.Dispatch<React.SetStateAction<string>>;
    setBookingProjectUploads: React.Dispatch<React.SetStateAction<typeof bookingProjectUploads>>;
    setEditingEventId: React.Dispatch<React.SetStateAction<string | null>>;
    staffConflictAckRef: React.MutableRefObject<boolean>;
    silentEditBaselineRef: React.MutableRefObject<{
      services: BookingServiceLineItem[];
      guests: BookingGuest[];
      products: BookingProductLineItem[];
      uniqueItems: BookingProductLineItem[];
      phoneCode: string;
      phoneNumber: string;
    } | null>;
    reopenBookingAfterSaveRef: React.MutableRefObject<CalendarEvent | null>;
  };

  const persistBookingFromDrawer = React.useCallback(async (): Promise<boolean> => {
      if (!selectedSlot) return false;

      const guestsForPersist = applyPendingInlineGuestEdit(
        bookingGuests,
        editingInlineGuestId,
        inlineGuestDraft,
      );
      if (editingInlineGuestId) {
        setBookingGuests(guestsForPersist);
        setEditingInlineGuestId(null);
        setShowInlineGuestField(false);
        setInlineGuestDraft(emptyInlineGuestDraft);
      }

      const existingEvent = editingEventId
        ? events.find((event) => event.id === editingEventId)
        : null;
      const persistDesiredLocationKm =
        slotLocation === "DL" || existingEvent?.location === "DL";

      if (incomingRequestEditMode && editingEventId && existingEvent) {
        return persistIncomingEbrFromDrawer({
          selectedSlot,
          editingEventId,
          existingEvent,
          guestsForPersist,
          originalServicesSnapshot,
          selectedServices,
          selectedProducts,
          bookingUniqueItems,
          selectedClient,
          addClientSource,
          bookingPhoneDraft,
          desiredLocationDraft,
          showPrepayment,
          prepaymentPercent,
          paymentMethod,
          showLateCancellation,
          lateCancellationFeePercent,
          lateCancellationFeePercentCeiling,
          showLateRescheduling,
          lateRescheduleFeePercent,
          lateRescheduleFeePercentCeiling,
          showNoShowFee,
          noShowFeePercent,
          noShowFeePercentCeiling,
          cancellationFeeAt,
          exceededCancellationWindow,
          showInternalNote,
          bookingInternalNote,
          bookingTotalDiscount,
          persistDesiredLocationKm,
          showKilometerAllowance,
          kilometerAllowanceDraft,
          bookingTotalForSave,
          businessResponseWindowInput,
          resourceNameById,
          onUpdateBookingStatus,
          showSnackbar,
          dispatchBookingEventIfApi,
          setEvents,
          setIncomingRequestEditMode,
          setIsEditingExisting,
          setSlotStatus,
          setSlotSaveAttempted,
          setActiveDateIso,
        });
      }

      const title = buildPersistBookingTitle(selectedServices, guestsForPersist);

      if (!staffConflictAckRef.current) {
        const conflictMessage = resolveStaffConflictMessage({
          staffIntervals: buildStaffServiceIntervals({
            selectedServices,
            guestsForPersist,
            selectedSlot,
          }),
          editingEventId,
          selectedSlotDate: selectedSlot.date,
          events,
        });
        if (conflictMessage) {
          setStaffConflictMessage(conflictMessage);
          setStaffConflictOpen(true);
          return false;
        }
      } else {
        staffConflictAckRef.current = false;
      }

      const clientName = resolvePersistClientName({
        selectedClientName: selectedClient?.name,
        guestDraft,
        nonMollureDraft,
      });
      const isNewManualBooking = !editingEventId;
      const parsedEditingId = parseApiCalendarEventId(editingEventId);
      const statusToApiValue = calendarStatusToApiValue;

      // Shared FL+DL: persist main + guest/model lines in top-level notes so
      // client mapper sees the full update without location forks.
      const details = buildPersistDrawerDetails({
        selectedClient,
        addClientSource,
        existingEvent,
        selectedServices,
        selectedProducts,
        bookingUniqueItems,
        guestsForPersist,
        bookingPhoneDraft,
        desiredLocationDraft,
        showPrepayment,
        prepaymentPercent,
        paymentMethod,
        confirmPrepayment,
        showLateCancellation,
        lateCancellationFeePercent,
        lateCancellationFeePercentCeiling,
        showLateRescheduling,
        lateRescheduleFeePercent,
        lateRescheduleFeePercentCeiling,
        showNoShowFee,
        noShowFeePercent,
        noShowFeePercentCeiling,
        cancellationFeeAt,
        exceededCancellationWindow,
        showInternalNote,
        bookingInternalNote,
        bookingTotalDiscount,
        persistDesiredLocationKm,
        showKilometerAllowance,
        kilometerAllowanceDraft,
        isNewManualBooking,
        resourceNameById,
      });

      const existingClientSnapshot = existingEvent?.details?.clientSnapshot;
      const shouldWriteClientSnapshot =
        Boolean(existingClientSnapshot) ||
        slotLocation === "DL" ||
        guestsForPersist.length > 0 ||
        details.services.some(
          (service) => service.staffResourceId || service.teamMemberId,
        );
      if (shouldWriteClientSnapshot) {
        let projectUploadsForSnapshot =
          mapProjectUploadsBaseline(bookingProjectUploads);

        if (canUseBookingProject && bookingProjectEnabled) {
          const filesToUpload = bookingProjectUploads
            .map((upload) => upload.file)
            .filter((file): file is File => Boolean(file));
          if (filesToUpload.length > 0) {
            try {
              const uploaded = await uploadBookingAttachments(
                filesToUpload,
              ).unwrap();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const attachments: any[] = uploaded.data?.attachments ?? [];
              projectUploadsForSnapshot = mergeProjectUploadsWithAttachments(
                bookingProjectUploads,
                attachments,
                resolveMediaUrl,
              );
              setBookingProjectUploads(
                projectUploadsForSnapshot.map((upload) => ({
                  id: upload.id,
                  name: upload.name,
                  previewUrl: upload.previewUrl,
                  url: upload.url,
                  mimeType: upload.mimeType,
                  kind: upload.kind,
                })),
              );
            } catch (error) {
              showSnackbar({
                severity: "error",
                message: getApiErrorMessage(
                  error,
                  "Unable to upload project files. Please try again.",
                ),
              });
              return false;
            }
          }
        }

        details.clientSnapshot = buildPersistClientSnapshot({
          existingClientSnapshot,
          clientName,
          guestsForPersist,
          services: details.services,
          resourceNameById,
          canUseBookingProject,
          bookingProjectEnabled,
          bookingProjectDescription,
          projectUploadsForSnapshot,
          // ponytail: snapshot shape matches runtime; cast keeps extract out of snapshot union fights
        }) as NonNullable<typeof details.clientSnapshot>;
      }

      // Persist Edited labels for FL + DL when pro updates an existing booking.
      if (editingEventId && existingEvent) {
        applyExistingBookingEditLabels({
          // ponytail: snapshot shape matches runtime; cast keeps extract out of snapshot union fights
          details: details as Parameters<
            typeof applyExistingBookingEditLabels
          >[0]["details"],
          existingEvent,
          selectedSlot,
          selectedServices,
          selectedProducts,
          bookingUniqueItems,
          guestsForPersist,
          originalServicesSnapshot,
          silentBaseline: silentEditBaselineRef.current,
        });
      }

      const isMollureManualBooking =
        addClientSource === "mollure-platform" ||
        Boolean(selectedClient?.mollureUserId);
      const isOfflineManualBooking =
        isNewManualBooking && !isMollureManualBooking;
      const offlinePrepayAction = resolveOfflineBookingPrepayAction({
        isNewBooking: isNewManualBooking,
        isOfflineBooking: isOfflineManualBooking,
        showPrepayment,
        prepaymentAmount,
        paymentMethod,
      });
      const { resolvedStatus, resolvedBookingType } =
        resolvePersistStatusAndBookingType({
          existingEvent,
          isNewManualBooking,
          isOfflineManualBooking,
          offlinePrepayStatus: offlinePrepayAction?.status,
          slotStatus,
          slotBookingType,
          canUseBookingProject,
          bookingProjectEnabled,
        });

      const buildLocalEvent = (id: string, bookingCode: string): CalendarEvent =>
        buildLocalPersistEvent({
          id,
          bookingCode,
          selectedSlot,
          title,
          resolvedStatus,
          slotLocation,
          resolvedBookingType,
          existingEvent,
          details,
          clientName,
          selectedClientKind: selectedClient?.clientKind,
        });

      const bookingTotal = bookingTotalForSave;

      // Edit existing API booking / calendar entry â€” never create a second of/ol code.
      if (editingEventId && parsedEditingId) {
        const createPayload = buildCreateCalendarEntryPayload({
          selectedSlot,
          title,
          clientName,
          status: resolvedStatus,
          bookingType: resolvedBookingType,
          location: slotLocation,
          serviceIds: selectedServices.map((service) => service.id),
          details,
        });
        const grantSave = existingEvent?.status === "Confirmed";

        try {
          const persistedNotes = serializeCalendarEntryNotes(
            details.internalNote ?? "",
            details,
            grantSave ? null : parseStoredEbrFromNotes(existingEvent?.notes),
            grantSave ? null : parseStoredErFromNotes(existingEvent?.notes),
          );
          const startTime = isIsoDateTime(createPayload.start_time)
            ? createPayload.start_time
            : null;
          const endTime = isIsoDateTime(createPayload.end_time)
            ? createPayload.end_time
            : null;
          const scheduleFieldsChanged = existingEvent
            ? existingEvent.date !== selectedSlot.date ||
              clockHm(existingEvent.start) !== clockHm(selectedSlot.start) ||
              clockHm(existingEvent.end) !== clockHm(selectedSlot.end)
            : false;
          if (parsedEditingId.kind === "booking") {
            if (!onUpdateBookingStatus) {
              showSnackbar({
                severity: "error",
                message: "Booking update API is not connected.",
              });
              return false;
            }
            await onUpdateBookingStatus(
              parsedEditingId.id,
              statusToApiValue(resolvedStatus),
              {
                ...(typeof persistedNotes === "string"
                  ? { notes: persistedNotes }
                  : {}),
                total_price: bookingTotal,
                booking_date: selectedSlot.date,
                ...(scheduleFieldsChanged && startTime
                  ? { start_time: startTime }
                  : {}),
                ...(scheduleFieldsChanged && endTime
                  ? { end_time: endTime }
                  : {}),
                notify_incoming_er: resolvedStatus === "Requested",
                initiated_by: "professional",
              },
            );
          } else {
            if (!onUpdateCalendarEntry) {
              showSnackbar({
                severity: "error",
                message: "Calendar update API is not connected.",
              });
              return false;
            }
            await onUpdateCalendarEntry(parsedEditingId.id, createPayload);
          }

          silentEditBaselineRef.current = null;

          // Payable-affecting edit before prior sales/payment resolves → supersede
          // open sales cards (Cancel Sales semantics) so rebuild shows latest totals.
          if (!details.silentUpdated && parsedEditingId.kind === "booking") {
            supersedeOpenSalesCardsForBooking(parsedEditingId.id);
          }

          const nextEvent = buildLocalEvent(
            editingEventId,
            existingEvent?.bookingCode ??
              String(Math.floor(10000 + Math.random() * 90000)),
          );
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEventId
                ? {
                    ...event,
                    ...nextEvent,
                    id: event.id,
                    notes:
                      typeof persistedNotes === "string"
                        ? persistedNotes
                        : event.notes,
                  }
                : event,
            ),
          );
          setSlotStatus(nextEvent.status);
          setIsEditingExisting(false);
          if (existingEvent?.status === "Confirmed") {
            const bookingRef =
              existingEvent.bookingCode ?? extractBookingId(editingEventId);
            consumeConfirmedEditGrant(bookingRef);
            if (!details.silentUpdated) {
              setEvents((prev) =>
                prev.map((event) =>
                  event.id === editingEventId
                    ? {
                        ...event,
                        bookingScenario:
                          event.bookingScenario === "ER" ||
                          event.bookingScenario === "E" ||
                          nextEvent.bookingScenario === "E"
                            ? "E"
                            : event.bookingScenario,
                      }
                    : event,
                ),
              );
            }
          }
          if (existingEvent && selectedSlot && !details.silentUpdated) {
            if (existingEvent.date !== selectedSlot.date) {
              void dispatchBookingEventIfApi(
                editingEventId,
                "booking_date_changed",
                { initiated_by: "professional" },
              );
            } else if (
              existingEvent.start !== selectedSlot.start ||
              existingEvent.end !== selectedSlot.end
            ) {
              void dispatchBookingEventIfApi(editingEventId, "time_changed", {
                initiated_by: "professional",
              });
            }
          }
          showSnackbar({
            severity: "success",
            message: "Booking updated.",
          });
          setSlotSaveAttempted(false);
          setActiveDateIso(selectedSlot.date);
          return true;
        } catch (error) {
          console.error("[booking-update]", error);
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to update booking."),
          });
          return false;
        }
      }

      if (isNewManualBooking) {
        if (!onCreateCalendarEntry) {
          showSnackbar({
            severity: "error",
            message: "Calendar API is not connected.",
          });
          return false;
        }

        try {
          const created = await onCreateCalendarEntry(
            buildCreateCalendarEntryPayload({
              selectedSlot,
              title,
              clientName,
              status: resolvedStatus,
              bookingType: resolvedBookingType,
              location: slotLocation,
              serviceIds: selectedServices.map((service) => service.id),
              details,
            }),
          );

          const nextEvent = created
            ? {
                ...mapCalendarEntryToEvent(created, selectedSlot.resourceId),
                date: selectedSlot.date,
                start: selectedSlot.start.slice(0, 5),
                end: selectedSlot.end.slice(0, 5),
                resourceId: selectedSlot.resourceId,
                title,
                status: resolvedStatus,
                bookingType: resolvedBookingType,
                bookingScenario:
                  resolvedStatus === "Requested"
                    ? (existingEvent?.bookingScenario ?? "BR")
                    : undefined,
                showClientName: clientName,
                details,
              }
            : buildLocalEvent(
                `b-${Date.now()}-a`,
                String(Math.floor(10000 + Math.random() * 90000)),
              );

          setEvents((prev) => [...prev, nextEvent]);
          setEditingEventId(nextEvent.id);
          setSlotStatus(nextEvent.status);
          setIsEditingExisting(false);
          if (offlinePrepayAction?.reopen) {
            reopenBookingAfterSaveRef.current = nextEvent;
          }

          if (
            (addClientSource === "mollure-platform" ||
              addClientSource === "non-mollure") &&
            !selectedClient?.isGuest
          ) {
            const identity = {
              name: selectedClient?.name,
              email: selectedClient?.email,
              customerId: selectedClient?.mollureUserId,
              clientKind: selectedClient?.clientKind,
              phone: [bookingPhoneDraft.phoneCode, bookingPhoneDraft.phoneNumber]
                .map((part) => String(part ?? "").trim())
                .filter(Boolean)
                .join(" "),
            };
            if (!findListedClient(identity)) {
              void addIdentityToClientList(identity, { silent: true });
            }
          }

          showSnackbar({
            severity: "success",
            message: isOfflineManualBooking
              ? "Booking confirmed."
              : "Booking request sent.",
          });
          setSlotSaveAttempted(false);
          setActiveDateIso(selectedSlot.date);
          if (isNewManualBooking) {
            clearProfessionalBookingDrawerDraft();
          }
          return true;
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to save booking."),
          });
          return false;
        }
      }

      const nextEvent = buildLocalEvent(
        editingEventId ?? `b-${Date.now()}-a`,
        existingEvent?.bookingCode ??
          String(Math.floor(10000 + Math.random() * 90000)),
      );

      setEvents((prev) => {
        if (!editingEventId) return [...prev, nextEvent];
        return prev.map((event) =>
          event.id === editingEventId ? nextEvent : event,
        );
      });
      setEditingEventId(nextEvent.id);
      setSlotStatus(nextEvent.status);
      setIsEditingExisting(false);
      if (existingEvent?.status === "Confirmed" && editingEventId) {
        const bookingRef =
          existingEvent.bookingCode ?? extractBookingId(editingEventId);
        consumeConfirmedEditGrant(bookingRef);
      }
      showSnackbar({
        severity: "success",
        message: "Booking updated.",
      });
      setSlotSaveAttempted(false);
      setActiveDateIso(selectedSlot.date);
      if (isNewManualBooking) {
        clearProfessionalBookingDrawerDraft();
      }
      return true;
    }, [
      bookingGuests,
      bookingInternalNote,
      bookingPhoneDraft,
      bookingTotalDiscount,
      bookingTotalForSave,
      desiredLocationDraft,
      dispatchBookingEventIfApi,
      editingEventId,
      editingInlineGuestId,
      emptyInlineGuestDraft,
      events,
      guestDraft.firstName,
      guestDraft.lastName,
      incomingRequestEditMode,
      inlineGuestDraft,
      kilometerAllowanceDraft,
      lateCancellationFeePercent,
      lateCancellationFeePercentCeiling,
      nonMollureDraft.firstName,
      nonMollureDraft.lastName,
      onCreateCalendarEntry,
      onUpdateBookingStatus,
      onUpdateCalendarEntry,
      originalServicesSnapshot,
      paymentMethod,
      prepaymentPercent,
      bookingProjectDescription,
      bookingProjectEnabled,
      bookingProjectUploads,
      selectedClient,
      addClientSource,
      uploadBookingAttachments,
      selectedProducts,
      selectedServices,
      bookingUniqueItems,
      selectedSlot,
      showInternalNote,
      showKilometerAllowance,
      showLateCancellation,
      showLateRescheduling,
      lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling,
      showNoShowFee,
      noShowFeePercent,
      noShowFeePercentCeiling,
      cancellationFeeAt,
      exceededCancellationWindow,
      showPrepayment,
      prepaymentAmount,
      showSnackbar,
      slotBookingType,
      slotLocation,
      slotStatus,
      canUseBookingProject,
      resourceNameById,
      addIdentityToClientList,
      findListedClient,
      bookingPhoneDraft.phoneCode,
      bookingPhoneDraft.phoneNumber,
    ]);

  return { persistBookingFromDrawer };
}
