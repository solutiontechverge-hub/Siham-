import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { buildBookingDetailsSnapshot } from "../bookingEventDetails";
import { buildMultiServiceBookingTitle } from "../calendar-overlap.utils";
import {
  buildGuestServiceLines,
  buildPersistProductLines,
  buildPersistServiceLines,
  type PersistBookingGuest,
} from "./useProfessionalFixedLocationCalendar.persistBookingFromDrawer.helpers";

/** Pure: multi-service booking title for persist. */
export function buildPersistBookingTitle(
  selectedServices: BookingServiceLineItem[],
  guestsForPersist: PersistBookingGuest[],
) {
  return buildMultiServiceBookingTitle(
    [
      ...selectedServices.map((service) => service.name),
      ...guestsForPersist.flatMap((guest) =>
        guest.services.map((service) => service.name),
      ),
    ],
    "Booking",
  );
}

type SnapshotInput = Parameters<typeof buildBookingDetailsSnapshot>[0];

/** Pure: details bag + service/product lines for persist (no I/O). */
export function buildPersistDrawerDetails(input: {
  selectedClient: SnapshotInput["selectedClient"];
  addClientSource: "" | "client-list" | "mollure-platform" | "non-mollure" | "guest";
  existingEvent: CalendarEvent | null | undefined;
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  guestsForPersist: PersistBookingGuest[];
  bookingPhoneDraft: SnapshotInput["bookingPhoneDraft"];
  desiredLocationDraft: SnapshotInput["desiredLocationDraft"];
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  /** When true, persist prepaymentStatus confirmed (offline Save / temp Pay Now). */
  confirmPrepayment?: boolean;
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
  bookingTotalDiscount: SnapshotInput["bookingTotalDiscount"];
  persistDesiredLocationKm: boolean;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: SnapshotInput["kilometerAllowanceDraft"];
  isNewManualBooking: boolean;
  resourceNameById: Map<string, string>;
}) {
  const {
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
    confirmPrepayment = false,
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
  } = input;

  const details = {
    ...buildBookingDetailsSnapshot({
      selectedClient,
      isGuest:
        addClientSource === "guest" ||
        Boolean(selectedClient?.isGuest) ||
        Boolean(existingEvent?.details?.isGuest),
      selectedServices: selectedServices,
      selectedProducts: [...selectedProducts, ...bookingUniqueItems],
      bookingGuests: guestsForPersist,
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
      cancellationFeeAt: cancellationFeeAt ?? undefined,
      exceededCancellationWindow,
      showInternalNote,
      bookingInternalNote,
      bookingTotalDiscount,
      showKilometerAllowance: persistDesiredLocationKm && showKilometerAllowance,
      kilometerAllowanceDraft: persistDesiredLocationKm
        ? kilometerAllowanceDraft
        : { eurPerKm: "", totalKilometer: "" },
      clientNote: existingEvent?.details?.clientNote,
      ...(isNewManualBooking
        ? {
            requestDirection: "outgoing" as const,
            originalServices: selectedServices,
            // Freeze guest baseline so first-view does not treat them as Added.
            originalGuests: guestsForPersist,
          }
        : existingEvent?.details?.requestDirection
          ? {
              requestDirection: existingEvent.details.requestDirection,
              ...(existingEvent.details.originalServices?.length
                ? {
                    originalServices: existingEvent.details.originalServices,
                    ...(existingEvent.details.originalGuests?.length
                      ? {
                          originalGuests: existingEvent.details.originalGuests,
                        }
                      : {}),
                  }
                : {
                    originalServices: selectedServices,
                    originalGuests: guestsForPersist,
                  }),
            }
          : {
              requestDirection: "outgoing" as const,
              originalServices: selectedServices,
              originalGuests: guestsForPersist,
            }),
    }),
    ...(showPrepayment
      ? {
          prepaymentStatus:
            paymentMethod === "offline" ||
            confirmPrepayment ||
            existingEvent?.details?.prepaymentStatus === "confirmed"
              ? ("confirmed" as const)
              : (existingEvent?.details?.prepaymentStatus ??
                ("pending" as const)),
        }
      : {}),
  };

  const guestServiceLines = buildGuestServiceLines(
    guestsForPersist,
    resourceNameById,
  );
  details.services = buildPersistServiceLines(
    selectedServices,
    guestServiceLines,
    resourceNameById,
  );
  details.products = buildPersistProductLines(
    selectedProducts,
    bookingUniqueItems,
    guestsForPersist,
  );

  // Fresh create: freeze the same flattened lines the drawer will compare against.
  if (isNewManualBooking) {
    details.originalServices = details.services;
    details.originalGuests = guestsForPersist;
  }

  return details as typeof details & {
    services: NonNullable<(typeof details)["services"]>;
    products: NonNullable<(typeof details)["products"]>;
  };
}

/** Pure: status + bookingType for new/existing persist. */
export function resolvePersistStatusAndBookingType(input: {
  existingEvent: CalendarEvent | null | undefined;
  isNewManualBooking: boolean;
  isOfflineManualBooking: boolean;
  offlinePrepayStatus: CalendarEvent["status"] | undefined;
  slotStatus: CalendarEvent["status"];
  slotBookingType: NonNullable<CalendarEvent["bookingType"]>;
  canUseBookingProject: boolean;
  bookingProjectEnabled: boolean;
}): {
  resolvedStatus: CalendarEvent["status"];
  resolvedBookingType: NonNullable<CalendarEvent["bookingType"]>;
} {
  const {
    existingEvent,
    isNewManualBooking,
    isOfflineManualBooking,
    offlinePrepayStatus,
    slotStatus,
    slotBookingType,
    canUseBookingProject,
    bookingProjectEnabled,
  } = input;

  const resolvedStatus =
    existingEvent?.status ??
    (isNewManualBooking
      ? offlinePrepayStatus ??
        (isOfflineManualBooking ? "Confirmed" : "Requested")
      : slotStatus);

  const resolvedBookingType =
    existingEvent?.bookingType ??
    (isNewManualBooking
      ? canUseBookingProject && bookingProjectEnabled
        ? "Project"
        : isOfflineManualBooking
          ? "Offline"
          : "Online"
      : slotBookingType);

  return { resolvedStatus, resolvedBookingType };
}

type ProjectUpload = {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  kind?: string;
  previewUrl?: string;
  file?: File;
};

/** Pure: baseline project upload rows before optional attach upload. */
export function mapProjectUploadsBaseline(bookingProjectUploads: ProjectUpload[]) {
  return bookingProjectUploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    url: upload.url,
    mimeType: upload.mimeType,
    kind: upload.kind,
    previewUrl:
      upload.url && !upload.url.startsWith("blob:")
        ? upload.url
        : upload.previewUrl,
  }));
}

/** Pure: merge upload API attachments into project upload snapshot rows. */
export function mergeProjectUploadsWithAttachments(
  bookingProjectUploads: ProjectUpload[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachments: any[],
  resolveMediaUrl: (url: string) => string | null | undefined,
) {
  const durableByName = new Map(
    attachments.map((att) => [att.name, att]),
  );
  return bookingProjectUploads.map((upload, index) => {
    if (upload.url && !upload.url.startsWith("blob:")) {
      const durable = resolveMediaUrl(upload.url) ?? upload.url;
      return {
        id: upload.id,
        name: upload.name,
        url: upload.url,
        mimeType: upload.mimeType,
        kind: upload.kind,
        previewUrl: durable,
      };
    }
    const matched =
      (upload.file && durableByName.get(upload.file.name)) ||
      attachments[index];
    if (!matched) {
      return {
        id: upload.id,
        name: upload.name,
        url: upload.url,
        mimeType: upload.mimeType,
        kind: upload.kind,
        previewUrl: undefined,
      };
    }
    const matchedUrl = resolveMediaUrl(matched.url) ?? matched.url;
    return {
      id: upload.id,
      name: upload.name || matched.name,
      url: matched.url,
      mimeType: matched.mimeType ?? upload.mimeType,
      kind: matched.kind ?? upload.kind,
      previewUrl: matchedUrl,
    };
  });
}
