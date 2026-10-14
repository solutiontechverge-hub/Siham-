"use client";

import * as React from "react";
import {
  SELECTED_SHOP_KEY,
  getActiveBookingSession,
  isReturningToCreateDraft,
} from "./clientBookingSession";
import { resolveMediaUrl } from "../../../lib/resolveMediaUrl";
import {
  getServicesForLocationMode,
  getTeamForLocationMode,
  pricePublicProfileServiceOnDate,
} from "../../../data/businessPublicProfile.data";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { enrichClientBookingRecord } from "./clientBookingDraftCache";
import {
  readClientBookingCreateUiDraft,
  shouldRestoreClientBookingCreateUiDraft,
} from "./clientBookingCreateUiDraft";
import { loadPublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import {
  createNotesPerson,
  isNotesPerson,
  sortPeopleByCanonicalBookingOrder,
} from "./booking.page.data";
import type {
  BookingPerson,
  Service,
  ShopState,
  ShopTeamMember,
} from "./booking.page.types";
import { toISO } from "./useClientBookingCreatePage.calendarTime";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";

type ProfileSelection = NonNullable<
  ReturnType<typeof loadPublicProfileBookingSelection>
>;

export type UseClientBookingCreateHydrationArgs = {
  fromProfile: boolean;
  isEbrSuggest: boolean;
  profileHydrationToken: string;
  shop: ShopState | null;
  setShop: React.Dispatch<React.SetStateAction<ShopState | null>>;
  businessProfile: BusinessPublicProfileData | null | undefined;
  requesterDisplayName: string;
  isCompanyClient: boolean;
  selectedDate: Date;
  clampToBookableDay: (d: Date) => Date;
  getPreferredServiceTab: (
    items: Service[],
  ) => "assigned" | "unassigned";
  setShopTeamMembers: React.Dispatch<React.SetStateAction<ShopTeamMember[]>>;
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  setServiceTab: React.Dispatch<
    React.SetStateAction<"assigned" | "unassigned">
  >;
  setSelectedServiceIds: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setBookingProjectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectDescription: React.Dispatch<React.SetStateAction<string>>;
  setSelectedTeamMemberId: React.Dispatch<React.SetStateAction<string>>;
  setProfileHydrated: React.Dispatch<React.SetStateAction<boolean>>;
  setPeople: React.Dispatch<React.SetStateAction<BookingPerson[]>>;
  setSelectedPersonId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  setCombineServices: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectUploads: React.Dispatch<
    React.SetStateAction<
      Array<{ id: string; name: string; previewUrl: string; file?: File }>
    >
  >;
  setClientNote: React.Dispatch<React.SetStateAction<string>>;
  setDesiredVisitAddress: React.Dispatch<
    React.SetStateAction<{
      street: string;
      number: string;
      postalCode: string;
      province: string;
      municipality: string;
    }>
  >;
  ebrSuggestBaselineRef: React.MutableRefObject<Service[] | null>;
  hydrationSignatureRef: React.MutableRefObject<string | null>;
};

export function useClientBookingCreateHydration(
  args: UseClientBookingCreateHydrationArgs,
) {
  const {
    fromProfile,
    isEbrSuggest,
    profileHydrationToken,
    shop,
    setShop,
    businessProfile,
    requesterDisplayName,
    isCompanyClient,
    selectedDate,
    clampToBookableDay,
    getPreferredServiceTab,
    setShopTeamMembers,
    setServices,
    setServiceTab,
    setSelectedServiceIds,
    setBookingProjectEnabled,
    setProjectDescription,
    setSelectedTeamMemberId,
    setProfileHydrated,
    setPeople,
    setSelectedPersonId,
    setSelectedDate,
    setSelectedTime,
    setCombineServices,
    setProjectUploads,
    setClientNote,
    setDesiredVisitAddress,
    ebrSuggestBaselineRef,
    hydrationSignatureRef,
  } = args;

  // Date changes must not re-fire hydration (autosave + restore would loop).
  const selectedDateRef = React.useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  React.useEffect(() => {
    try {
      const profileSelection = loadPublicProfileBookingSelection();
      const raw = window.sessionStorage.getItem(SELECTED_SHOP_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as {
            shopId?: string;
            shopName?: string;
            municipalityLabel?: string;
            addressLabel?: string;
            locationMode?: "fixed" | "desired";
          })
        : null;

      if (fromProfile && profileSelection?.shopId) {
        const addressSource =
          parsed?.shopId === profileSelection.shopId ? parsed : null;
        setShop({
          shopId: profileSelection.shopId,
          shopName:
            profileSelection.shopName ?? addressSource?.shopName ?? "Salon",
          municipalityLabel: addressSource?.municipalityLabel,
          addressLabel: addressSource?.addressLabel,
          locationMode: profileSelection.locationMode,
        });
        return;
      }

      // Confirmed EBR edit: prefer the booking session shop (Desired needs locationMode + people).
      if (isEbrSuggest) {
        const session = getActiveBookingSession();
        if (session?.shop?.shopId) {
          setShop({
            shopId: session.shop.shopId,
            shopName: session.shop.shopName ?? "Salon",
            municipalityLabel: session.shop.municipalityLabel,
            addressLabel: session.shop.addressLabel,
            locationMode: session.shop.locationMode,
          });
          return;
        }
      }

      if (parsed?.shopId && parsed?.shopName) {
        setShop({
          shopId: parsed.shopId,
          shopName: parsed.shopName,
          municipalityLabel: parsed.municipalityLabel,
          addressLabel: parsed.addressLabel,
          locationMode: parsed.locationMode,
        });
      }
    } catch {
      // ignore
    }
  }, [fromProfile, isEbrSuggest, profileHydrationToken, setShop]);

  const applyProfileSelection = React.useCallback(
    (profileSelection: ProfileSelection) => {
      setShopTeamMembers(profileSelection.teamMembers);

      const isDesired = profileSelection.locationMode === "desired";
      const firstMember = profileSelection.teamMembers.find((tm) =>
        tm.locationModes.includes(profileSelection.locationMode),
      );
      const noSelectableTeam = !firstMember;
      const defaultTeamMemberId = firstMember?.id ?? null;

      const profileServices = profileSelection.services.map((row) => ({
        id: row.id,
        catalogServiceId:
          row.catalogServiceId ?? extractUuidFromSyntheticId(row.id),
        name: row.name,
        durationMins: row.durationMins,
        price: row.price,
        // New Book Now: always Unassigned for every professional. Edit/EBR keeps draft guestId.
        guestId: null,
        // Do not stamp first roster TM — auto-assign fills only when free at the slot.
        teamMemberId: noSelectableTeam ? null : row.teamMemberId ?? null,
      }));

      setServices(profileServices);
      setServiceTab(getPreferredServiceTab(profileServices));
      setSelectedServiceIds({});

      if (isDesired && isCompanyClient && profileSelection.projectEnabled) {
        setBookingProjectEnabled(true);
        setProjectDescription(profileSelection.projectInstructions);
      } else {
        setBookingProjectEnabled(false);
      }

      setShop((prev) => ({
        shopId: profileSelection.shopId,
        shopName: profileSelection.shopName ?? prev?.shopName ?? "Salon",
        municipalityLabel: prev?.municipalityLabel,
        addressLabel: prev?.addressLabel,
        locationMode: profileSelection.locationMode,
      }));

      // First load: pre-select team member from backend roster when available.
      if (noSelectableTeam) {
        setSelectedTeamMemberId("");
      } else {
        const fromServices =
          profileServices.find((s) => s.teamMemberId)?.teamMemberId ?? null;
        setSelectedTeamMemberId(fromServices || defaultTeamMemberId || "");
      }

      setProfileHydrated(true);
    },
    [
      getPreferredServiceTab,
      isCompanyClient,
      setBookingProjectEnabled,
      setProfileHydrated,
      setProjectDescription,
      setSelectedServiceIds,
      setSelectedTeamMemberId,
      setServiceTab,
      setServices,
      setShop,
      setShopTeamMembers,
    ],
  );

  React.useEffect(() => {
    const profileSelection = loadPublicProfileBookingSelection();

    const applyProfileIfNeeded = (selection: ProfileSelection) => {
      const signature = `${profileHydrationToken}:${selection.savedAt ?? ""}:${selection.services
        .map((row) => `${row.id}:${row.teamMemberId ?? ""}`)
        .join("|")}`;
      if (hydrationSignatureRef.current === signature) return;
      hydrationSignatureRef.current = signature;
      applyProfileSelection(selection);
    };

    const hydrateFromActiveDraft = (
      existing: NonNullable<ReturnType<typeof enrichClientBookingRecord>>,
      options: { signaturePrefix: string; forceRequesterGuestId: boolean },
    ): boolean => {
      const locationMode =
        existing.shop?.locationMode ?? shop?.locationMode ?? "fixed";
      const signature = `${options.signaturePrefix}:${existing.bookingRef}:${existing.draft?.people
        ?.map((p) => `${p.id}:${p.participantType ?? ""}`)
        .join(",")}:${(existing.draft?.services ?? [])
        .map(
          (row) => `${row.id}:${row.guestId ?? ""}:${row.teamMemberId ?? ""}`,
        )
        .join("|")}:${existing.draft?.projectDetails?.description ?? ""}:${
        existing.draft?.combineServices === false ? "0" : "1"
      }:${[
        existing.draft?.desiredLocation?.street,
        existing.draft?.desiredLocation?.number,
        existing.draft?.desiredLocation?.postalCode,
        existing.draft?.desiredLocation?.province,
        existing.draft?.desiredLocation?.municipality,
      ].join("|")}`;
      if (hydrationSignatureRef.current === signature) return false;
      hydrationSignatureRef.current = signature;

      const draftServices: Service[] = (existing.draft?.services ?? []).map(
        (row) => ({
          id: row.id,
          catalogServiceId:
            (row as Service).catalogServiceId ??
            extractUuidFromSyntheticId(row.id) ??
            row.id,
          name: row.name,
          durationMins: row.durationMins,
          price: row.price,
          guestId: options.forceRequesterGuestId
            ? row.guestId != null && row.guestId !== ""
              ? row.guestId
              : "p-requester"
            : (row.guestId ?? null),
          teamMemberId: row.teamMemberId ?? null,
        }),
      );

      setServices(draftServices);
      if (options.signaturePrefix === "ebrSuggest") {
        ebrSuggestBaselineRef.current = draftServices.map((s) => ({ ...s }));
      }

      const draftPeople: BookingPerson[] = existing.draft?.people?.length
        ? existing.draft.people.map((p) => ({
            id: p.id,
            name: p.name,
            isRequester: Boolean(p.isRequester),
            participantType: p.participantType,
            planningActivity: p.planningActivity,
            planningDuration: p.planningDuration,
            planningIsLocked: p.planningIsLocked,
            planningStartTime: p.planningStartTime,
            planningEndTime: p.planningEndTime,
          }))
        : [
            {
              id: "p-requester",
              name: requesterDisplayName,
              isRequester: true as const,
            },
          ];
      if (
        existing.draft?.clientNote?.trim() &&
        !draftPeople.some(isNotesPerson)
      ) {
        draftPeople.push(createNotesPerson());
      }
      setPeople(sortPeopleByCanonicalBookingOrder(draftPeople));

      const personWithServices =
        draftPeople.find((p) =>
          draftServices.some((s) => s.guestId === p.id),
        ) ??
        draftPeople.find((p) => p.isRequester) ??
        draftPeople[0];
      if (personWithServices?.id) setSelectedPersonId(personWithServices.id);

      const draftTeamMembers = existing.draft?.teamMembers;
      if (draftTeamMembers?.length) {
        setShopTeamMembers((prev) => {
          const fromDraft = draftTeamMembers.map((tm) => ({
            id: tm.id,
            name: tm.name,
            locationModes: (prev.find((p) => p.id === tm.id)?.locationModes ?? [
              locationMode,
            ]) as Array<"fixed" | "desired">,
          }));
          return fromDraft.length ? fromDraft : prev;
        });
      } else if (businessProfile) {
        const apiTeam = getTeamForLocationMode(
          businessProfile,
          locationMode,
        ).map((tm) => ({
          id: tm.id,
          name: tm.name,
          locationModes: tm.locationModes,
        }));
        if (apiTeam.length) setShopTeamMembers(apiTeam);
      }

      if (existing.draft?.selectedDateISO) {
        const parsed = new Date(`${existing.draft.selectedDateISO}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
          setSelectedDate(clampToBookableDay(parsed));
        }
      }
      if (existing.draft?.selectedTime) {
        setSelectedTime(existing.draft.selectedTime);
      }
      if (typeof existing.draft?.combineServices === "boolean") {
        setCombineServices(existing.draft.combineServices);
      }
      if (existing.draft?.projectDetails) {
        const desc = existing.draft.projectDetails.description ?? "";
        const uploads = existing.draft.projectDetails.uploads ?? [];
        setProjectDescription(desc);
        setProjectUploads(
          uploads.map((u) => ({
            id: u.id,
            name: u.name,
            previewUrl:
              resolveMediaUrl(u.previewUrl) ||
              resolveMediaUrl(u.url) ||
              u.previewUrl ||
              "",
          })),
        );
        if (
          existing.shop?.locationMode === "desired" &&
          (desc.trim() || uploads.length > 0)
        ) {
          setBookingProjectEnabled(true);
        }
      }
      // Restore project mode if draft already has a Planning participant.
      if (
        existing.shop?.locationMode === "desired" &&
        (existing.draft?.people ?? []).some(
          (p) => p.participantType === "planning" || p.name === "Planning",
        )
      ) {
        setBookingProjectEnabled(true);
      }
      if (existing.draft?.clientNote) {
        setClientNote(existing.draft.clientNote);
      }
      const savedVisit = existing.draft?.desiredLocation;
      if (
        savedVisit &&
        (savedVisit.street?.trim() ||
          savedVisit.number?.trim() ||
          savedVisit.postalCode?.trim() ||
          savedVisit.province?.trim() ||
          savedVisit.municipality?.trim())
      ) {
        setDesiredVisitAddress({
          street: savedVisit.street ?? "",
          number: savedVisit.number ?? "",
          postalCode: savedVisit.postalCode ?? "",
          province: savedVisit.province ?? "",
          municipality: savedVisit.municipality ?? "",
        });
      }
      const firstTm =
        draftServices.find((s) => s.teamMemberId)?.teamMemberId ?? "";
      setSelectedTeamMemberId(firstTm);
      setServiceTab(getPreferredServiceTab(draftServices));
      setProfileHydrated(true);
      return true;
    };

    // Confirmed Edit / EBR must win over leftover profile-selection cache.
    // Desired bookings often still have mollure:profile_booking_selection from create,
    // which used to wipe Models/Guests/Planning before we restored the draft.
    if (isEbrSuggest) {
      if (!shop?.shopId) return;
      const existingRaw = getActiveBookingSession();
      const existing = existingRaw
        ? enrichClientBookingRecord(existingRaw)
        : null;
      if (!existing?.draft?.services?.length) {
        // Session not ready yet — never fall through to blank catalog.
        return;
      }
      if (existing.shop?.shopId && existing.shop.shopId !== shop.shopId) {
        return;
      }
      hydrateFromActiveDraft(existing, {
        signaturePrefix: "ebrSuggest",
        forceRequesterGuestId: true,
      });
      return;
    }

    // Summary back (browser or arrow): restore guests/models/planning/date/time
    // instead of re-applying Book Now profile selection.
    if (
      isReturningToCreateDraft({
        fromProfile,
        hydrationToken: profileHydrationToken,
        shopId: shop?.shopId,
      })
    ) {
      const existingRaw = getActiveBookingSession();
      const existing = existingRaw
        ? enrichClientBookingRecord(existingRaw)
        : null;
      if (existing?.draft?.services?.length) {
        hydrateFromActiveDraft(existing, {
          signaturePrefix: "createReturn",
          forceRequesterGuestId: false,
        });
        return;
      }
    }

    // Reload / leave mid-create: restore autosaved UI draft (same Book Now token).
    // Once any hydration signature is set, only return — never re-apply (autosave
    // rewrites the draft on every date change and would loop with setState).
    const createUiDraft = readClientBookingCreateUiDraft();
    if (
      shouldRestoreClientBookingCreateUiDraft({
        draft: createUiDraft,
        shopId: shop?.shopId,
        fromProfile,
        hydrationToken: profileHydrationToken,
      }) &&
      createUiDraft
    ) {
      if (!shop?.shopId) return;
      if (hydrationSignatureRef.current) return;
      const applied = hydrateFromActiveDraft(
        {
          id: `bk_create_ui_${createUiDraft.shopId}`,
          bookingRef: `create-ui:${createUiDraft.shopId}`,
          status: "draft",
          createdAt: createUiDraft.savedAt,
          shop: {
            shopId: createUiDraft.shopId,
            shopName: createUiDraft.shopName ?? shop.shopName ?? "Salon",
            municipalityLabel:
              createUiDraft.municipalityLabel ?? shop.municipalityLabel,
            addressLabel: createUiDraft.addressLabel ?? shop.addressLabel,
            locationMode:
              createUiDraft.locationMode ?? shop.locationMode ?? "fixed",
          },
          draft: {
            selectedDateISO: createUiDraft.selectedDateISO,
            selectedTime: createUiDraft.selectedTime,
            combineServices: createUiDraft.combineServices,
            people: createUiDraft.people,
            services: createUiDraft.services,
            teamMembers: createUiDraft.shopTeamMembers.map(({ id, name }) => ({
              id,
              name,
            })),
            total: createUiDraft.total,
            ...(createUiDraft.clientNote.trim()
              ? { clientNote: createUiDraft.clientNote }
              : {}),
            ...(createUiDraft.bookingProjectEnabled
              ? {
                  projectDetails: {
                    description: createUiDraft.projectDescription,
                    uploads: createUiDraft.projectUploads,
                  },
                }
              : {}),
            ...(createUiDraft.locationMode === "desired"
              ? { desiredLocation: createUiDraft.desiredVisitAddress }
              : {}),
          },
        },
        {
          // Never include savedAt — autosave rewrites it on every date/time change.
          signaturePrefix: `createUi:${createUiDraft.shopId}:${createUiDraft.hydrationToken}`,
          forceRequesterGuestId: false,
        },
      );
      // Only stamp UI-only fields when hydrate actually applied (not on every render).
      if (applied) {
        if (createUiDraft.selectedPersonId) {
          setSelectedPersonId(createUiDraft.selectedPersonId);
        }
        if (createUiDraft.selectedTeamMemberId !== undefined) {
          setSelectedTeamMemberId(createUiDraft.selectedTeamMemberId);
        }
        if (createUiDraft.serviceTab) {
          setServiceTab(createUiDraft.serviceTab);
        }
        if (createUiDraft.selectedServiceIds) {
          setSelectedServiceIds(createUiDraft.selectedServiceIds);
        }
        if (createUiDraft.shopTeamMembers.length) {
          setShopTeamMembers(createUiDraft.shopTeamMembers);
        }
      }
      return;
    }

    if (fromProfile && profileSelection?.services.length) {
      applyProfileIfNeeded(profileSelection);
      return;
    }

    if (!shop?.shopId) return;

    if (
      profileSelection?.shopId === shop.shopId &&
      profileSelection.services.length > 0
    ) {
      applyProfileIfNeeded(profileSelection);
      return;
    }

    if (fromProfile) return;

    if (!businessProfile) return;

    const defaultSignature = `default:${shop.shopId}`;
    if (hydrationSignatureRef.current === defaultSignature) return;
    hydrationSignatureRef.current = defaultSignature;

    const apiTeam = businessProfile
      ? getTeamForLocationMode(
          businessProfile,
          shop.locationMode ?? "fixed",
        ).map((tm) => ({
          id: tm.id,
          name: tm.name,
          locationModes: tm.locationModes,
        }))
      : [];

    const mode = shop.locationMode ?? "fixed";
    const defaultTeamMemberId = apiTeam[0]?.id ?? null;
    const catalogServices = getServicesForLocationMode(
      businessProfile,
      mode,
    ).map((s) => {
      const priced = pricePublicProfileServiceOnDate(
        s,
        toISO(selectedDateRef.current),
      );
      return {
        id: s.id,
        catalogServiceId: s.id,
        name: s.name,
        durationMins: s.durationMins,
        price: priced.price,
        originalPrice: priced.originalPrice,
        discountPct: priced.discountPct,
        guestId: null as string | null,
        teamMemberId: null as string | null,
      };
    });

    setServices(catalogServices.slice(0, 3));
    setShopTeamMembers(apiTeam);
    // Picker default only — services stay unassigned until auto-assign finds a free TM.
    setSelectedTeamMemberId(defaultTeamMemberId ?? "");
    setServiceTab(getPreferredServiceTab(catalogServices.slice(0, 3)));
    setProfileHydrated(true);
  }, [
    applyProfileSelection,
    businessProfile,
    clampToBookableDay,
    ebrSuggestBaselineRef,
    fromProfile,
    getPreferredServiceTab,
    hydrationSignatureRef,
    isEbrSuggest,
    profileHydrationToken,
    requesterDisplayName,
    setBookingProjectEnabled,
    setClientNote,
    setCombineServices,
    setDesiredVisitAddress,
    setPeople,
    setProfileHydrated,
    setProjectDescription,
    setProjectUploads,
    setSelectedDate,
    setSelectedPersonId,
    setSelectedTeamMemberId,
    setSelectedTime,
    setServiceTab,
    setServices,
    setShopTeamMembers,
    shop?.locationMode,
    shop?.shopId,
  ]);

  return { applyProfileSelection };
}
