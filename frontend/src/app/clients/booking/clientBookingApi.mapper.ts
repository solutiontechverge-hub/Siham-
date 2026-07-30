import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { ClientBookingRecord, ClientBookingStatus } from "./clientBookingRecords";
import { fmtMinutesToTimeLabel, parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "./booking-time";
import { wallClockDateFromDateTime, wallClockTimeFromDateTime } from "../../../components/common/calendar/calendar.utils";
import { parseCalendarEntryNotes, parseStoredEbrFromNotes } from "../../../components/common/calendar/bookingEventDetails";
import type { BusinessSetupListing, CalendarBooking, CreateBookingRequest } from "../../../store/services/businessApi";
import { mapApiBookingStatusToClient } from "./clientBookingStatus";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

/** Pull a UUID out of synthetic cart ids like `profile-svc-<uuid>-0`. */
export function extractUuidFromSyntheticId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isUuid(value)) return value;
  const match = String(value).match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i,
  );
  return match && isUuid(match[1]) ? match[1] : null;
}

export function resolveSubcategoryServiceId(
  setup: BusinessSetupListing,
  catalogServiceId: string,
  serviceName?: string,
): string | null {
  const normalizedName = serviceName?.trim().toLowerCase();
  const embeddedUuid = extractUuidFromSyntheticId(catalogServiceId);
  const candidates = [catalogServiceId, embeddedUuid].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    for (const detail of setup.serviceDetails ?? []) {
      const detailId = detail.id != null ? String(detail.id) : "";
      const subcategoryId = detail.serviceId != null ? String(detail.serviceId) : "";
      if (detailId && detailId === candidate && isUuid(subcategoryId)) return subcategoryId;
      if (subcategoryId && subcategoryId === candidate) return subcategoryId;
      if (detailId && detailId === candidate && isUuid(detailId)) return detailId;
    }

    for (const entry of setup.serviceCategories ?? []) {
      const subcategoryId = String(entry.service_id ?? entry.serviceId ?? "").trim();
      if (subcategoryId && subcategoryId === candidate) return subcategoryId;
    }
  }

  for (const detail of setup.serviceDetails ?? []) {
    const subcategoryId = detail.serviceId != null ? String(detail.serviceId) : "";
    if (
      normalizedName &&
      detail.serviceTitle?.trim().toLowerCase() === normalizedName &&
      isUuid(subcategoryId)
    ) {
      return subcategoryId;
    }
  }

  for (const entry of setup.serviceCategories ?? []) {
    const subcategoryId = String(entry.service_id ?? entry.serviceId ?? "").trim();
    const title = String(
      (entry as { service_title?: string; serviceTitle?: string }).service_title ??
        (entry as { service_title?: string; serviceTitle?: string }).serviceTitle ??
        "",
    ).trim();
    if (normalizedName && title.toLowerCase() === normalizedName && isUuid(subcategoryId)) {
      return subcategoryId;
    }
  }

  if (embeddedUuid) return embeddedUuid;
  return isUuid(catalogServiceId) ? catalogServiceId : null;
}

export function resolveTeamMemberId(setup: BusinessSetupListing, teamMemberId: string | null | undefined): string | null {
  if (!teamMemberId) return null;
  if (isUuid(teamMemberId)) return teamMemberId;
  const member = setup.teamMembers?.find((row) => String(row.id) === teamMemberId);
  return member?.id && isUuid(String(member.id)) ? String(member.id) : null;
}

function buildDateTimeIso(dateIso: string, minutesFromMidnight: number) {
  return buildWallClockDateTimeIso(dateIso, minutesFromMidnight);
}

function mapApiStatus(status: ClientBookingStatus): CreateBookingRequest["status"] {
  if (status === "confirmed") return "confirmed";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "no_show";
  return "requested";
}

function mapApiBookingType(locationMode: "fixed" | "desired"): CreateBookingRequest["booking_type"] {
  return locationMode === "desired" ? "project" : "online";
}

function mapClientBookingRequestType(locationMode: "fixed" | "desired"): CreateBookingRequest["booking_type"] {
  return locationMode === "desired" ? "project" : "request";
}

export function buildClientBookingApiPayload(input: {
  setup: BusinessSetupListing;
  shopId: string;
  locationMode: "fixed" | "desired";
  draft: ClientBookingDraft;
  status: ClientBookingStatus;
  bookingRef: string;
  total: number;
  /** When true, creates an incoming BR for the professional (not a direct online booking). */
  asBookingRequest?: boolean;
}): CreateBookingRequest | null {
  const dateIso = input.draft.selectedDateISO;
  const startMinutes = parseTimeLabelToMinutes(input.draft.selectedTime ?? "");
  const services = input.draft.services ?? [];
  if (!dateIso || !services.length) return null;

  const durationMinutes = services.reduce((sum, service) => sum + (service.durationMins ?? 0), 0);
  const firstService = services[0] as (typeof services)[number] & { catalogServiceId?: string | null };
  const catalogId = firstService.catalogServiceId || firstService.id;
  const serviceId = resolveSubcategoryServiceId(input.setup, catalogId, firstService.name);
  const teamMemberId = resolveTeamMemberId(
    input.setup,
    firstService.teamMemberId ?? input.draft.teamMembers?.[0]?.id ?? null,
  );

  const serviceNames = services.map((service) => service.name).filter(Boolean);
  const projectDescription = input.draft.projectDetails?.description?.trim() || "";
  const projectUploads = input.draft.projectDetails?.uploads ?? [];
  const desiredLocation = input.draft.desiredLocation;
  const hasDesiredVisitAddress =
    input.locationMode === "desired" &&
    Boolean(
      desiredLocation?.street?.trim() ||
        desiredLocation?.number?.trim() ||
        desiredLocation?.postalCode?.trim() ||
        desiredLocation?.province?.trim() ||
        desiredLocation?.municipality?.trim(),
    );

  const isImageUpload = (upload: (typeof projectUploads)[number]) => {
    if (upload.kind === "image") return true;
    if (upload.kind === "document") return false;
    const mime = String(upload.mimeType ?? "").toLowerCase();
    const name = String(upload.name ?? "").toLowerCase();
    return mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(name);
  };

  const imageUrls = projectUploads.filter((u) => u.url && isImageUpload(u)).map((u) => u.url as string);
  const documentUrls = projectUploads.filter((u) => u.url && !isImageUpload(u)).map((u) => u.url as string);

  const humanNotesParts = [
    serviceNames.length > 1 ? `Services: ${serviceNames.join(", ")}` : null,
    projectDescription ? `Project: ${projectDescription}` : null,
  ].filter(Boolean);
  const humanNotes = humanNotesParts.length ? humanNotesParts.join(" | ") : "";

  const clientSnapshot = {
    people: (input.draft.people ?? []).map((p) => ({
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
      guestId: s.guestId ?? null,
      teamMemberId: s.teamMemberId ?? null,
    })),
    projectDetails: input.draft.projectDetails
      ? {
          description: input.draft.projectDetails.description ?? "",
          uploads: (input.draft.projectDetails.uploads ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            url: u.url,
            mimeType: u.mimeType,
            kind: u.kind,
            previewUrl: u.previewUrl,
          })),
        }
      : undefined,
    teamMembers: input.draft.teamMembers ?? [],
  };

  const notes = `${humanNotes}${humanNotes ? "\n" : ""}---mollure-meta---\n${JSON.stringify({
    requestDirection: input.asBookingRequest ? "incoming" : undefined,
    clientSnapshot,
  })}`;

  return {
    booking_date: dateIso,
    business_setup_id: input.shopId,
    service_id: serviceId,
    team_member_id: teamMemberId,
    start_time: buildDateTimeIso(dateIso, startMinutes),
    end_time: buildDateTimeIso(dateIso, startMinutes + Math.max(durationMinutes, 15)),
    location_type: input.locationMode === "desired" ? "desired" : "fixed",
    status: mapApiStatus(input.status),
    booking_type: input.asBookingRequest
      ? mapClientBookingRequestType(input.locationMode)
      : mapApiBookingType(input.locationMode),
    unique_code: input.bookingRef,
    total_price: input.total,
    notes,
    ...(hasDesiredVisitAddress && desiredLocation
      ? {
          province: desiredLocation.province.trim() || null,
          municipality: desiredLocation.municipality.trim() || null,
          street_address: desiredLocation.street.trim() || null,
          street_number: desiredLocation.number.trim() || null,
          postal_code: desiredLocation.postalCode.trim() || null,
        }
      : {}),
    ...(input.draft.projectDetails || hasDesiredVisitAddress
      ? {
          location_details: {
            ...(input.draft.projectDetails
              ? {
                  projectDescription,
                  uploads: projectUploads.map((upload) => ({
                    id: upload.id,
                    name: upload.name,
                    url: upload.url ?? null,
                    mimeType: upload.mimeType ?? null,
                    kind: upload.kind ?? null,
                  })),
                }
              : {}),
            ...(hasDesiredVisitAddress && desiredLocation
              ? {
                  desiredLocation: {
                    street: desiredLocation.street.trim(),
                    number: desiredLocation.number.trim(),
                    postalCode: desiredLocation.postalCode.trim(),
                    province: desiredLocation.province.trim(),
                    municipality: desiredLocation.municipality.trim(),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(imageUrls.length ? { images: imageUrls } : {}),
    ...(documentUrls.length ? { documents: documentUrls } : {}),
  };
}

function hhmmToTimeLabel(hhmm?: string | null) {
  if (!hhmm) return "";
  const match = String(hhmm).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return fmtMinutesToTimeLabel(Number(match[1]) * 60 + Number(match[2]));
}

function buildAddressLabel(booking: CalendarBooking) {
  if (booking.location_type === "desired") {
    const visitParts = [
      booking.street_address,
      booking.street_number,
      booking.postal_code,
      booking.municipality,
      booking.province,
    ]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean);
    if (visitParts.length) return visitParts.join(", ");
  }
  const parts = [
    booking.fixed_location_address,
    booking.fixed_location_street_number,
    booking.fixed_location_municipality,
    booking.fixed_location_province,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.join(", ") || null;
}

function parseServiceNamesFromNotes(notes?: string | null) {
  if (!notes) return [];
  const human = String(notes).split("---mollure-meta---")[0] ?? "";
  const match = human.match(/Services:\s*(.+)$/im);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function mapApiBookingToClientRecord(booking: CalendarBooking): ClientBookingRecord {
  const status = mapApiBookingStatusToClient(booking.status) ?? "requested";
  const dateIso =
    wallClockDateFromDateTime(booking.date || booking.booking_date || booking.start_time) ??
    String(booking.booking_date ?? "").slice(0, 10);
  const startHhmm = booking.start || wallClockTimeFromDateTime(booking.start_time);
  const endHhmm = booking.end || wallClockTimeFromDateTime(booking.end_time);
  const startLabel = hhmmToTimeLabel(startHhmm);
  const ebr = parseStoredEbrFromNotes(booking.notes);
  const notesDetails = parseCalendarEntryNotes(booking.notes);
  const clientSnapshot = notesDetails?.clientSnapshot;
  const bookingCancelled = String(booking.status ?? "").toLowerCase() === "cancelled";
  const activeEbr =
    !bookingCancelled && ebr && (ebr.status === "suggested" || ebr.status === "pending") ? ebr : null;
  const incomingEditRequest =
    !bookingCancelled && ebr && ebr.status !== "none"
      ? {
          status: ebr.status,
          suggestedAt: ebr.suggestedAt,
          professionalNote: ebr.professionalNote,
          clientNote: ebr.clientNote,
          editedServiceIds: ebr.editedServiceIds,
          editedProductIds: ebr.editedProductIds,
          suggestedServices: ebr.suggestedServices?.map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            teamMemberId: service.staffResourceId ?? null,
            guestId: null as string | null,
            startTime: service.startTime,
            endTime: service.endTime,
          })),
          suggestedProducts: ebr.suggestedProducts,
          suggestedDateISO: ebr.suggestedDateISO,
          suggestedTime: ebr.suggestedTime,
          originalDateISO: ebr.originalDateISO,
          originalTime: ebr.originalTime,
        }
      : null;
  const serviceNames = parseServiceNamesFromNotes(
    activeEbr?.suggestedServices?.length
      ? `Services: ${activeEbr.suggestedServices.map((s) => s.name).join(", ")}`
      : booking.notes,
  );
  const title =
    activeEbr?.suggestedServices?.[0]?.name ||
    booking.service_title ||
    serviceNames[0] ||
    "Booking";
  const names = activeEbr?.suggestedServices?.length
    ? activeEbr.suggestedServices.map((s) => s.name)
    : notesDetails?.services?.length
      ? notesDetails.services.map((s) => s.name)
      : serviceNames.length
        ? serviceNames
        : [title];
  const total = activeEbr?.suggestedServices?.length
    ? activeEbr.suggestedServices.reduce((sum, s) => sum + (s.price || 0), 0) +
      (activeEbr.suggestedProducts ?? []).reduce((sum, p) => sum + p.price * (p.quantity || 1), 0)
    : notesDetails?.services?.length
      ? notesDetails.services.reduce((sum, s) => sum + (s.price || 0), 0) +
        (notesDetails.products ?? []).reduce((sum, p) => sum + p.price * (p.quantity || 1), 0)
      : Number(booking.total_price) || 0;
  const durationMins = (() => {
    if (activeEbr?.suggestedServices?.length) {
      return activeEbr.suggestedServices.reduce((sum, s) => sum + (s.durationMins || 0), 0) || 60;
    }
    if (!startHhmm || !endHhmm) return 60;
    const [sh, sm] = startHhmm.split(":").map(Number);
    const [eh, em] = endHhmm.split(":").map(Number);
    return Math.max(15, eh * 60 + em - (sh * 60 + sm));
  })();
  const priceEach = names.length > 1 ? Math.round((total / names.length) * 100) / 100 : total;
  const prepaid = String(booking.prepayment_status ?? "").toLowerCase() === "paid";
  const isEbrIncoming = incomingEditRequest?.status === "suggested";
  const notesRequestDirection = notesDetails?.requestDirection;
  // Notes requestDirection is from the professional's perspective:
  // outgoing = pro sent BR → client sees incoming; incoming = client sent → outgoing.
  const bookingRequestDirection = isEbrIncoming
    ? "incoming"
    : status === "requested"
      ? notesRequestDirection === "outgoing"
        ? "incoming"
        : "outgoing"
      : undefined;

  const locationDetails =
    booking.location_details && typeof booking.location_details === "object"
      ? (booking.location_details as {
          projectDescription?: string;
          desiredLocation?: {
            street?: string;
            number?: string;
            postalCode?: string;
            province?: string;
            municipality?: string;
          };
          uploads?: Array<{
            id?: string;
            name?: string;
            url?: string | null;
            mimeType?: string | null;
            kind?: "image" | "document" | null;
          }>;
        })
      : null;
  const detailUploads = Array.isArray(locationDetails?.uploads) ? locationDetails.uploads : [];
  const imageUploads = (booking.images ?? []).filter(Boolean).map((url, index) => ({
    id: `img-${index}`,
    name: `Image ${index + 1}`,
    url,
    kind: "image" as const,
  }));
  const documentUploads = (booking.documents ?? []).filter(Boolean).map((url, index) => ({
    id: `doc-${index}`,
    name: `Document ${index + 1}`,
    url,
    kind: "document" as const,
  }));
  const projectUploads =
    detailUploads.length > 0
      ? detailUploads.map((upload, index) => ({
          id: upload.id || `upload-${index}`,
          name: upload.name || `File ${index + 1}`,
          url: upload.url ?? undefined,
          mimeType: upload.mimeType ?? undefined,
          kind: upload.kind === "document" ? ("document" as const) : ("image" as const),
        }))
      : [...imageUploads, ...documentUploads];
  const projectDescription =
    typeof locationDetails?.projectDescription === "string" ? locationDetails.projectDescription : "";

  const desiredLocationFromColumns =
    booking.location_type === "desired" &&
    (booking.street_address ||
      booking.street_number ||
      booking.postal_code ||
      booking.province ||
      booking.municipality)
      ? {
          street: String(booking.street_address ?? "").trim(),
          number: String(booking.street_number ?? "").trim(),
          postalCode: String(booking.postal_code ?? "").trim(),
          province: String(booking.province ?? "").trim(),
          municipality: String(booking.municipality ?? "").trim(),
        }
      : null;
  const desiredLocationFromDetails = locationDetails?.desiredLocation
    ? {
        street: String(locationDetails.desiredLocation.street ?? "").trim(),
        number: String(locationDetails.desiredLocation.number ?? "").trim(),
        postalCode: String(locationDetails.desiredLocation.postalCode ?? "").trim(),
        province: String(locationDetails.desiredLocation.province ?? "").trim(),
        municipality: String(locationDetails.desiredLocation.municipality ?? "").trim(),
      }
    : null;
  const desiredLocation = desiredLocationFromColumns ?? desiredLocationFromDetails;

  return {
    id: booking.id,
    apiBookingId: booking.id,
    bookingRef: booking.unique_code ?? undefined,
    status,
    bookingRequestSent: status === "requested",
    bookingRequestDirection,
    shop: {
      shopId: booking.business_setup_id,
      shopName: booking.business_name ?? "Salon",
      addressLabel: buildAddressLabel(booking) ?? undefined,
      municipalityLabel: booking.fixed_location_municipality ?? undefined,
      locationMode: booking.location_type === "desired" ? "desired" : "fixed",
    },
    draft: {
      selectedDateISO: dateIso,
      selectedTime: startLabel,
      combineServices: names.length > 1,
      people: clientSnapshot?.people?.map((p) => ({
        id: p.id,
        name: p.name,
        isRequester: p.isRequester,
        participantType: p.participantType,
        planningActivity: p.planningActivity,
        planningDuration: p.planningDuration,
        planningIsLocked: p.planningIsLocked,
      })),
      services: (() => {
        const snapshotServices = clientSnapshot?.services ?? [];
        const noteServices = notesDetails?.services ?? [];
        const guestNestedServices = (notesDetails?.guests ?? []).flatMap((guest) =>
          (guest.services ?? []).map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            guestId: guest.id,
            teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
          })),
        );
        const snapshotById = new Map(snapshotServices.map((s) => [s.id, s]));
        const snapshotByName = new Map(snapshotServices.map((s) => [s.name, s]));
        const resolveGuestId = (
          id: string,
          name: string,
          fallback: string | null | undefined,
        ) =>
          fallback ??
          snapshotById.get(id)?.guestId ??
          snapshotByName.get(name)?.guestId ??
          null;

        if (activeEbr?.suggestedServices?.length) {
          return activeEbr.suggestedServices.map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            guestId: resolveGuestId(service.id, service.name, null),
            teamMemberId: service.staffResourceId ?? booking.team_member_id,
          }));
        }

        // Prefer pro-updated notes lines; merge guest/model lines from snapshot/guests
        // so FL + DL both show the full booking on the client.
        const merged: Array<{
          id: string;
          name: string;
          durationMins: number;
          price: number;
          guestId: string | null;
          teamMemberId: string | null | undefined;
        }> = [];
        const pushUnique = (row: {
          id: string;
          name: string;
          durationMins: number;
          price: number;
          guestId?: string | null;
          teamMemberId?: string | null;
        }) => {
          const guestId = row.guestId ?? null;
          const exists = merged.some(
            (item) => item.id === row.id && String(item.guestId ?? "") === String(guestId ?? ""),
          );
          if (exists) return;
          merged.push({
            id: row.id,
            name: row.name,
            durationMins: row.durationMins,
            price: row.price,
            guestId,
            teamMemberId: row.teamMemberId ?? booking.team_member_id,
          });
        };

        for (const service of noteServices) {
          pushUnique({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            guestId: resolveGuestId(service.id, service.name, service.guestId ?? null),
            teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
          });
        }
        for (const service of snapshotServices) {
          pushUnique({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            guestId: service.guestId ?? null,
            teamMemberId: service.teamMemberId ?? null,
          });
        }
        for (const service of guestNestedServices) {
          pushUnique(service);
        }

        if (merged.length) return merged;

        return names.map((name, index) => ({
          id: `${booking.service_id ?? booking.id}-${index}`,
          name,
          durationMins: names.length === 1 ? durationMins : Math.round(durationMins / names.length),
          price: priceEach,
          guestId: null as string | null,
          teamMemberId: booking.team_member_id,
        }));
      })(),
      products: (() => {
        if (activeEbr?.suggestedProducts?.length) {
          return activeEbr.suggestedProducts.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice ?? product.price,
          }));
        }
        const noteProducts = notesDetails?.products ?? [];
        const guestProducts = (notesDetails?.guests ?? []).flatMap((guest) =>
          (guest.products ?? []).map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice ?? product.price,
          })),
        );
        const mergedProducts = [...noteProducts];
        for (const product of guestProducts) {
          if (!mergedProducts.some((p) => p.id === product.id)) {
            mergedProducts.push(product);
          }
        }
        if (mergedProducts.length) {
          return mergedProducts.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice ?? product.price,
          }));
        }
        return [];
      })(),
      teamMembers: clientSnapshot?.teamMembers?.length
        ? clientSnapshot.teamMembers
        : booking.team_member_id
          ? [{ id: booking.team_member_id, name: booking.team_member_name || "Team member" }]
          : undefined,
      projectDetails:
        projectDescription || projectUploads.length
          ? {
              description: projectDescription || clientSnapshot?.projectDetails?.description || "",
              uploads: projectUploads.length
                ? projectUploads
                : (clientSnapshot?.projectDetails?.uploads ?? []),
            }
          : clientSnapshot?.projectDetails
            ? {
                description: clientSnapshot.projectDetails.description ?? "",
                uploads: clientSnapshot.projectDetails.uploads ?? [],
              }
            : undefined,
      ...(desiredLocation &&
      (desiredLocation.street ||
        desiredLocation.number ||
        desiredLocation.postalCode ||
        desiredLocation.province ||
        desiredLocation.municipality)
        ? { desiredLocation }
        : {}),
      total: (() => {
        if (activeEbr?.suggestedServices?.length) {
          return (
            activeEbr.suggestedServices.reduce((sum, s) => sum + (s.price || 0), 0) +
            (activeEbr.suggestedProducts ?? []).reduce(
              (sum, p) => sum + p.price * (p.quantity || 1),
              0,
            )
          );
        }
        const noteServices = notesDetails?.services ?? [];
        const noteProducts = [
          ...(notesDetails?.products ?? []),
          ...(notesDetails?.guests ?? []).flatMap((guest) => guest.products ?? []),
        ];
        const snapshotServices = clientSnapshot?.services ?? [];
        if (noteServices.length || noteProducts.length || snapshotServices.length) {
          const serviceSum = (noteServices.length ? noteServices : snapshotServices).reduce(
            (sum, s) => sum + (s.price || 0),
            0,
          );
          // Deduplicate guest product ids already in notes.products
          const seen = new Set<string>();
          const productSum = noteProducts.reduce((sum, p) => {
            if (seen.has(p.id)) return sum;
            seen.add(p.id);
            return sum + p.price * (p.quantity || 1);
          }, 0);
          return serviceSum + productSum;
        }
        return total;
      })(),
    },
    createdAt: booking.created_at ?? undefined,
    prepaid,
    requiresPrepayment:
      prepaid ||
      String(booking.prepayment_status ?? "").toLowerCase() === "required" ||
      Boolean(notesDetails?.showPrepayment),
    prepaymentPercent: Number(notesDetails?.prepaymentPercent) || 0,
    contactPhone: booking.contact_number ?? undefined,
    notes: booking.notes ?? null,
    editedServiceIds:
      notesDetails?.editedServiceIds?.length
        ? notesDetails.editedServiceIds
        : ebr?.editedServiceIds?.length
          ? ebr.editedServiceIds
          : undefined,
    editedProductIds:
      notesDetails?.editedProductIds?.length
        ? notesDetails.editedProductIds
        : ebr?.editedProductIds?.length
          ? ebr.editedProductIds
          : undefined,
    incomingEditRequest,
  };
}
