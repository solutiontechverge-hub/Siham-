"use client";

import * as React from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  CLIENT_BOOKING_MIN_LEAD_ERROR,
  isSameDayBookingTooSoon,
} from "./booking-time";
import {
  ACTIVE_BOOKING_ID_KEY,
  CHECKOUT_REF_KEY,
  createBookingRef,
  getActiveBookingSession,
  lockEbrDraft,
  rememberCreateReturnHref,
  setActiveBookingSession,
} from "./clientBookingSession";
import { clearClientBookingCreateUiDraft } from "./clientBookingCreateUiDraft";
import { resolveCreateCheckoutPath } from "./resolveCreateBookingStatus";
import { getApiErrorMessage } from "../../../lib/api-error";
import { INPUT_LIMITS, parseText } from "../../../lib/inputSchema";
import {
  fileFromProjectUpload,
  inferProjectUploadKind,
} from "../../../lib/projectUploadMedia";
import { resolveMediaUrl } from "../../../lib/resolveMediaUrl";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { parsePrepaymentPercent } from "../../../components/common/client-booking/parsePrepaymentPercent";
import { parseBookingListTab } from "./bookingPillTabs";
import {
  isNotesPerson,
  servicesMissingTeamMember,
  withTeamMemberProvidedByProNote,
} from "./booking.page.data";
import type {
  BookingPerson,
  Service,
  ShopState,
  ShopTeamMember,
} from "./booking.page.types";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import { toISO } from "./useClientBookingCreatePage.calendarTime";

export type CreateDraftPayloadInput = {
  selectedDate: Date;
  selectedTime: string;
  combineServices: boolean;
  peopleForDraft: BookingPerson[];
  servicesForDraft: Service[];
  shopTeamMembers: ShopTeamMember[];
  total: number;
  clientNote: string;
  isDesiredLocation: boolean;
  isCompanyClient: boolean;
  bookingProjectEnabled: boolean;
  projectDescriptionForDraft: string;
  projectUploads: Array<{
    id: string;
    name: string;
    previewUrl?: string;
    url?: string;
    mimeType?: string;
    kind?: "image" | "document";
    file?: File;
  }>;
  desiredVisitAddress: {
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  missingTeamMember: boolean;
};

/** Shared draft shape for EBR suggest save and new booking continue. */
export function buildClientBookingCreateDraftPayload(
  input: CreateDraftPayloadInput,
) {
  const {
    selectedDate,
    selectedTime,
    combineServices,
    peopleForDraft,
    servicesForDraft,
    shopTeamMembers,
    total,
    clientNote,
    isDesiredLocation,
    isCompanyClient,
    bookingProjectEnabled,
    projectDescriptionForDraft,
    projectUploads,
    desiredVisitAddress,
    missingTeamMember,
  } = input;

  return {
    selectedDateISO: toISO(selectedDate),
    selectedTime,
    combineServices,
    people: peopleForDraft,
    services: servicesForDraft,
    teamMembers: shopTeamMembers.map(({ id, name }) => ({ id, name })),
    total,
    ...(clientNote.trim() ? { clientNote: clientNote.trim() } : {}),
    ...(isDesiredLocation
      ? {
          ...(isCompanyClient && bookingProjectEnabled
            ? {
                projectDetails: {
                  description: projectDescriptionForDraft,
                  uploads: projectUploads.map((u) => ({
                    id: u.id,
                    name: u.name,
                    previewUrl: u.previewUrl,
                    mimeType: u.mimeType ?? u.file?.type,
                    kind:
                      u.kind ??
                      inferProjectUploadKind(u.name, u.mimeType ?? u.file?.type),
                  })),
                },
              }
            : {}),
          desiredLocation: {
            street: desiredVisitAddress.street.trim(),
            number: desiredVisitAddress.number.trim(),
            postalCode: desiredVisitAddress.postalCode.trim(),
            province: desiredVisitAddress.province.trim(),
            municipality: desiredVisitAddress.municipality.trim(),
          },
        }
      : missingTeamMember
        ? {
            projectDetails: {
              description: projectDescriptionForDraft,
              uploads: [],
            },
          }
        : {}),
  };
}

export type UseClientBookingCreateContinueArgs = {
  router: { push: (href: string) => void };
  searchParams: ReadonlyURLSearchParams | null;
  showSnackbar: (args: {
    severity: "error" | "success" | "info" | "warning";
    message: string;
  }) => void;
  shop: ShopState | null;
  services: Service[];
  allServicesAssigned: boolean;
  isContinuing: boolean;
  setIsContinuing: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectedToday: boolean;
  selectedTime: string;
  setTimeValidationError: React.Dispatch<React.SetStateAction<string | null>>;
  planningPersonId: string | null;
  people: BookingPerson[];
  planningActivity: string;
  planningDuration: string;
  planningWindowFromDraft: (
    duration: string,
    existingStart?: string,
  ) => {
    planningStartTime?: string;
    planningEndTime?: string;
  };
  isDesiredLocation: boolean;
  selectedTeamMemberId: string;
  projectDescription: string;
  selectedDate: Date;
  combineServices: boolean;
  shopTeamMembers: ShopTeamMember[];
  total: number;
  clientNote: string;
  isCompanyClient: boolean;
  bookingProjectEnabled: boolean;
  projectUploads: Array<{
    id: string;
    name: string;
    previewUrl: string;
    file?: File;
  }>;
  desiredVisitAddress: {
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  desiredVisitAddressLabel: string;
  businessProfile: BusinessPublicProfileData | null | undefined;
  isEbrSuggest: boolean;
  /** Confirmed booking client edit — schedule/location only; lock service lines. */
  isConfirmedEbrEdit: boolean;
  ebrSuggestBaselineRef: React.MutableRefObject<Service[] | null>;
  locationMode: "fixed" | "desired";
  fromProfile: boolean;
  uploadBookingAttachments: (
    files: File[],
  ) => {
    unwrap: () => Promise<{
      data?: {
        attachments?: Array<{
          id: string;
          name: string;
          url: string;
          mimeType?: string;
          kind?: "image" | "document";
        }>;
      };
    }>;
  };
};

export function useClientBookingCreateContinue(
  args: UseClientBookingCreateContinueArgs,
) {
  const {
    router,
    searchParams,
    showSnackbar,
    shop,
    services,
    allServicesAssigned,
    isContinuing,
    setIsContinuing,
    isSelectedToday,
    selectedTime,
    setTimeValidationError,
    planningPersonId,
    people,
    planningActivity,
    planningDuration,
    planningWindowFromDraft,
    isDesiredLocation,
    selectedTeamMemberId,
    projectDescription,
    selectedDate,
    combineServices,
    shopTeamMembers,
    total,
    clientNote,
    isCompanyClient,
    bookingProjectEnabled,
    projectUploads,
    desiredVisitAddress,
    desiredVisitAddressLabel,
    businessProfile,
    isEbrSuggest,
    isConfirmedEbrEdit,
    ebrSuggestBaselineRef,
    locationMode,
    fromProfile,
    uploadBookingAttachments,
  } = args;

  const onContinue = React.useCallback(async () => {
    if (
      !shop?.shopId ||
      services.length === 0 ||
      !allServicesAssigned ||
      isContinuing
    )
      return;

    if (isSelectedToday && isSameDayBookingTooSoon(selectedTime)) {
      setTimeValidationError(CLIENT_BOOKING_MIN_LEAD_ERROR);
      showSnackbar({
        severity: "error",
        message: CLIENT_BOOKING_MIN_LEAD_ERROR,
      });
      return;
    }
    setTimeValidationError(null);

    const noteParsed = parseText(clientNote, {
      required: false,
      label: "Note",
      min: INPUT_LIMITS.notesMin,
      max: null,
    });
    if (!noteParsed.ok) {
      showSnackbar({ severity: "error", message: noteParsed.error });
      return;
    }

    const peopleForDraft = (
      planningPersonId != null
        ? people.map((p) =>
            p.id === planningPersonId
              ? {
                  ...p,
                  planningActivity: planningActivity.trim(),
                  planningDuration: planningDuration.trim(),
                  ...planningWindowFromDraft(
                    planningDuration,
                    p.planningStartTime,
                  ),
                }
              : p,
          )
        : people
    ).filter((p) => !isNotesPerson(p));

    const requesterId =
      peopleForDraft.find((p) => p.isRequester)?.id ??
      peopleForDraft[0]?.id ??
      "p-requester";
    const servicesForDraft = services.map((s) => ({
      ...s,
      catalogServiceId: s.catalogServiceId ?? extractUuidFromSyntheticId(s.id),
      guestId: s.guestId ?? requesterId,
      teamMemberId:
        isDesiredLocation && selectedTeamMemberId
          ? selectedTeamMemberId
          : s.teamMemberId,
    }));
    const missingTeamMember = servicesMissingTeamMember(servicesForDraft);
    const projectDescriptionForDraft = missingTeamMember
      ? withTeamMemberProvidedByProNote(projectDescription)
      : projectDescription.trim();

    const payload = buildClientBookingCreateDraftPayload({
      selectedDate,
      selectedTime,
      combineServices,
      peopleForDraft,
      servicesForDraft,
      shopTeamMembers,
      total,
      clientNote,
      isDesiredLocation,
      isCompanyClient,
      bookingProjectEnabled,
      projectDescriptionForDraft,
      projectUploads,
      desiredVisitAddress,
      missingTeamMember,
    });

    const prepaymentPercent = parsePrepaymentPercent(
      businessProfile?.prepaymentLabel,
    );
    // Both locations surface Pay Now when the pro configures a prepayment %.
    // Fixed still blocks Book Now until paid; Desired can send the request first.
    const requiresPrepayment = prepaymentPercent > 0;

    // EBR suggest-edit: update existing booking draft and return to details (no new booking).
    if (isEbrSuggest) {
      setIsContinuing(true);
      try {
        const existing = getActiveBookingSession();
        if (!existing?.bookingRef) {
          showSnackbar({
            severity: "error",
            message: "Booking not found for suggested changes.",
          });
          return;
        }

        // Client confirmed edit: keep prior services/prices/people/project; allow schedule + DL address.
        const draftForSave = isConfirmedEbrEdit
          ? {
              ...payload,
              services:
                ebrSuggestBaselineRef.current ??
                existing.draft?.services ??
                payload.services,
              products: existing.draft?.products,
              people: existing.draft?.people ?? payload.people,
              projectDetails: existing.draft?.projectDetails,
              total: existing.draft?.total ?? payload.total,
              teamMembers: existing.draft?.teamMembers ?? payload.teamMembers,
            }
          : payload;

        const baseline =
          ebrSuggestBaselineRef.current ?? existing.draft?.services ?? [];
        const baselineById = new Map(baseline.map((s) => [s.id, s]));
        const editedServiceIds: string[] = [];
        if (!isConfirmedEbrEdit) {
          for (const service of draftForSave.services) {
            const original = baselineById.get(service.id);
            if (
              !original ||
              original.name !== service.name ||
              original.price !== service.price ||
              original.durationMins !== service.durationMins ||
              (original.teamMemberId ?? null) !==
                (service.teamMemberId ?? null) ||
              (original.guestId ?? null) !== (service.guestId ?? null)
            ) {
              editedServiceIds.push(service.id);
            }
          }
          for (const original of baseline) {
            if (!draftForSave.services.some((s) => s.id === original.id)) {
              editedServiceIds.push(original.id);
            }
          }
        }

        setActiveBookingSession({
          ...existing,
          draft: draftForSave,
          requiresPrepayment: existing.requiresPrepayment ?? requiresPrepayment,
          prepaymentPercent:
            existing.prepaymentPercent ??
            (prepaymentPercent > 0 ? prepaymentPercent : 0),
        });
        if (typeof window !== "undefined") {
          lockEbrDraft();
          window.sessionStorage.setItem("mollure:ebr_suggest_return", "1");
          window.sessionStorage.setItem(
            "mollure:ebr_suggest_edited_ids",
            JSON.stringify([...new Set(editedServiceIds)]),
          );
        }
        const listTab = parseBookingListTab(searchParams?.get("tab"));
        const checkoutPath = resolveCreateCheckoutPath({
          locationMode,
          requiresPrepayment: Boolean(
            existing.requiresPrepayment ?? requiresPrepayment,
          ),
        });
        rememberCreateReturnHref();
        router.push(`${checkoutPath}?tab=${listTab}`);
      } finally {
        setIsContinuing(false);
      }
      return;
    }

    const bookingRef = createBookingRef();

    setIsContinuing(true);
    try {
      if (fromProfile && typeof window !== "undefined") {
        window.sessionStorage.removeItem(ACTIVE_BOOKING_ID_KEY);
        window.sessionStorage.removeItem(CHECKOUT_REF_KEY);
      }

      const localUploads: Array<{
        id: string;
        name: string;
        url?: string;
        previewUrl?: string;
        mimeType?: string;
        kind?: "image" | "document";
      }> = projectUploads.map((u) => ({
        id: u.id,
        name: u.name,
        previewUrl: u.previewUrl,
        mimeType: u.file?.type,
        kind: inferProjectUploadKind(u.name, u.file?.type),
      }));
      let projectDetailsUploads = localUploads;
      if (
        isDesiredLocation &&
        isCompanyClient &&
        bookingProjectEnabled &&
        projectUploads.length > 0
      ) {
        const filesToUpload = (
          await Promise.all(projectUploads.map((u) => fileFromProjectUpload(u)))
        ).filter((file): file is File => Boolean(file));
        if (filesToUpload.length > 0) {
          const uploaded =
            await uploadBookingAttachments(filesToUpload).unwrap();
          const attachments = uploaded.data?.attachments ?? [];
          const durableByName = new Map(
            attachments.map((att) => [att.name, att]),
          );
          projectDetailsUploads = projectUploads.map((upload, index) => {
            const matched =
              (upload.file && durableByName.get(upload.file.name)) ||
              durableByName.get(upload.name) ||
              attachments[index];
            if (!matched) return localUploads[index];
            const durable = resolveMediaUrl(matched.url) ?? matched.url;
            return {
              id: matched.id || upload.id,
              name: upload.name || matched.name,
              url: matched.url,
              previewUrl: durable,
              mimeType: matched.mimeType || upload.file?.type,
              kind:
                matched.kind ||
                inferProjectUploadKind(
                  upload.name || matched.name,
                  matched.mimeType || upload.file?.type,
                ),
            };
          });
        }
      }

      const payloadWithUploads = buildClientBookingCreateDraftPayload({
        selectedDate,
        selectedTime,
        combineServices,
        peopleForDraft,
        servicesForDraft,
        shopTeamMembers,
        total,
        clientNote,
        isDesiredLocation,
        isCompanyClient,
        bookingProjectEnabled,
        projectDescriptionForDraft,
        projectUploads: projectDetailsUploads,
        desiredVisitAddress,
        missingTeamMember,
      });

      const shopForSession = shop
        ? {
            ...shop,
            ...(isDesiredLocation && desiredVisitAddressLabel
              ? {
                  addressLabel: desiredVisitAddressLabel,
                  municipalityLabel:
                    desiredVisitAddress.municipality.trim() ||
                    shop.municipalityLabel,
                }
              : {}),
          }
        : shop;

      const draftRecord = {
        id: `bk_draft_${Date.now()}`,
        bookingRef,
        status: "draft" as const,
        shop: shopForSession,
        draft: payloadWithUploads,
        createdAt: new Date().toISOString(),
        requiresPrepayment,
        prepaymentPercent: prepaymentPercent > 0 ? prepaymentPercent : 0,
        prepaid: false,
        bookingRequestSent: false,
      };
      setActiveBookingSession(draftRecord);
      clearClientBookingCreateUiDraft();

      const listTab = parseBookingListTab(searchParams?.get("tab"));
      const checkoutPath = resolveCreateCheckoutPath({
        locationMode,
        requiresPrepayment,
      });
      rememberCreateReturnHref();
      router.push(`${checkoutPath}?tab=${listTab}`);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to create booking. Please try again.",
        ),
      });
    } finally {
      setIsContinuing(false);
    }
  }, [
    allServicesAssigned,
    bookingProjectEnabled,
    businessProfile?.prepaymentLabel,
    clientNote,
    combineServices,
    desiredVisitAddress,
    desiredVisitAddressLabel,
    ebrSuggestBaselineRef,
    fromProfile,
    isCompanyClient,
    isContinuing,
    isDesiredLocation,
    isEbrSuggest,
    isConfirmedEbrEdit,
    isSelectedToday,
    locationMode,
    people,
    planningActivity,
    planningDuration,
    planningPersonId,
    planningWindowFromDraft,
    projectDescription,
    projectUploads,
    router,
    searchParams,
    selectedDate,
    selectedTeamMemberId,
    selectedTime,
    services,
    setIsContinuing,
    setTimeValidationError,
    shop,
    shopTeamMembers,
    showSnackbar,
    total,
    uploadBookingAttachments,
  ]);

  return { onContinue };
}
