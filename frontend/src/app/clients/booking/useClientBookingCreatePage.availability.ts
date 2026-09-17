"use client";

import * as React from "react";
import { parseTimeLabelToMinutes } from "./booking-time";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { toISO } from "./useClientBookingCreatePage.calendarTime";
import { useGetSetupAvailabilityQuery } from "../../../store/services/businessApi";
import type {
  ScheduleAvailabilityRow,
  ScheduleDateOverride,
} from "../../../components/common/calendar/calendar-settings.types";
import type { PublicBusinessHoursLike } from "../../../components/common/calendar/calendar.utils";
import {
  autoAssignServicesByAvailability,
  computeUnionBookableSlots,
  getMemberSlotStatus,
  type SetupAvailabilitySnapshot,
} from "./clientAvailability.utils";
import type {
  CatalogService,
  Service,
  ShopTeamMember,
  TeamMemberSlotOption,
} from "./booking.page.types";

export type UseClientBookingCreateAvailabilityArgs = {
  setupIdForHours: string;
  selectedDate: Date;
  bookingLocationCode: string;
  hasAssignableTeamMembers: boolean;
  profileHydrated: boolean;
  filteredTeamMembers: ShopTeamMember[];
  servicesDurationMins: number;
  isSelectedToday: boolean;
  minBookableMinutes: number;
  baseAvailableTimes: string[];
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  selectedTime: string;
  locationServiceCatalog: CatalogService[];
  isDesiredLocation: boolean;
  selectedTeamMemberId: string;
  setSelectedTeamMemberId: React.Dispatch<React.SetStateAction<string>>;
  selectedPersonId: string;
  bookServicesAtSameTime: boolean;
};

export function useClientBookingCreateAvailability(
  args: UseClientBookingCreateAvailabilityArgs,
) {
  const {
    setupIdForHours,
    selectedDate,
    bookingLocationCode,
    hasAssignableTeamMembers,
    profileHydrated,
    filteredTeamMembers,
    servicesDurationMins,
    isSelectedToday,
    minBookableMinutes,
    baseAvailableTimes,
    services,
    setServices,
    selectedTime,
    locationServiceCatalog,
    isDesiredLocation,
    selectedTeamMemberId,
    setSelectedTeamMemberId,
    selectedPersonId,
    bookServicesAtSameTime,
  } = args;

  const { data: setupAvailabilityResponse } = useGetSetupAvailabilityQuery(
    {
      setupId: setupIdForHours,
      date: toISO(selectedDate),
      location: bookingLocationCode as "FL" | "DL",
    },
    {
      skip: !setupIdForHours || !hasAssignableTeamMembers || !profileHydrated,
    },
  );

  const availabilitySnapshot = React.useMemo((): SetupAvailabilitySnapshot | null => {
    const raw = setupAvailabilityResponse?.data;
    if (!raw) return null;
    return {
      date: raw.date,
      location: raw.location,
      slotStepMinutes: raw.slotStepMinutes,
      scheduleAvailability: raw.scheduleAvailability as ScheduleAvailabilityRow[],
      dateOverrides: raw.dateOverrides as ScheduleDateOverride[],
      publicBusinessHours: raw.publicBusinessHours as PublicBusinessHoursLike[],
      teamMembers: raw.teamMembers,
      busyByMember: raw.busyByMember,
    };
  }, [setupAvailabilityResponse?.data]);

  const candidateMemberIds = React.useMemo(
    () => filteredTeamMembers.map((member) => member.id),
    [filteredTeamMembers],
  );

  const availabilityBookableTimes = React.useMemo(() => {
    if (!availabilitySnapshot || !hasAssignableTeamMembers) return null;
    const duration =
      servicesDurationMins ||
      availabilitySnapshot.slotStepMinutes;
    const minStart = isSelectedToday ? minBookableMinutes : undefined;
    return computeUnionBookableSlots(
      availabilitySnapshot,
      candidateMemberIds,
      duration,
      minStart,
    );
  }, [
    availabilitySnapshot,
    candidateMemberIds,
    hasAssignableTeamMembers,
    isSelectedToday,
    minBookableMinutes,
    servicesDurationMins,
  ]);

  const availableTimes = React.useMemo(() => {
    if (!availabilityBookableTimes?.length) return baseAvailableTimes;
    const allowed = new Set(availabilityBookableTimes);
    const filtered = baseAvailableTimes.filter((time) => allowed.has(time));
    return filtered.length > 0 ? filtered : baseAvailableTimes;
  }, [availabilityBookableTimes, baseAvailableTimes]);

  const lastAutoAssignRef = React.useRef("");
  const locationCatalogIdsKey = React.useMemo(
    () => locationServiceCatalog.map((service) => service.id).join(","),
    [locationServiceCatalog],
  );
  const locationServiceCatalogRef = React.useRef(locationServiceCatalog);
  locationServiceCatalogRef.current = locationServiceCatalog;
  const selectedDateISO = toISO(selectedDate);
  const servicesAssignKey = React.useMemo(
    () =>
      services.map((service) => `${service.id}:${service.durationMins}`).join(","),
    [services],
  );

  React.useEffect(() => {
    if (
      !availabilitySnapshot ||
      !hasAssignableTeamMembers ||
      !selectedTime ||
      services.length === 0
    ) {
      return;
    }

    const startMin = parseTimeLabelToMinutes(selectedTime);
    if (!startMin) return;

    const catalogList = locationServiceCatalogRef.current;
    const contextKey = [
      selectedDateISO,
      selectedTime,
      servicesAssignKey,
      locationCatalogIdsKey,
    ].join("|");

    const assignments = autoAssignServicesByAvailability({
      snapshot: availabilitySnapshot,
      services: services.map((service) => ({
        id: service.id,
        catalogServiceId:
          service.catalogServiceId ?? extractUuidFromSyntheticId(service.id),
        durationMins: service.durationMins,
        teamMemberId: service.teamMemberId,
      })),
      candidateMemberIds,
      fallbackCatalogIds: catalogList.map((service) => service.id),
      startMin,
      assignOneMemberForAll: isDesiredLocation,
    });

    const assignKey = `${contextKey}|${assignments
      .map((row) => `${row.id}:${row.teamMemberId ?? ""}`)
      .join(",")}`;
    if (lastAutoAssignRef.current === assignKey) return;
    lastAutoAssignRef.current = assignKey;

    setServices((prev) => {
      let changed = false;
      const next = prev.map((service) => {
        const assignment = assignments.find((row) => row.id === service.id);
        if (
          !assignment ||
          (assignment.teamMemberId ?? null) === (service.teamMemberId ?? null)
        ) {
          return service;
        }
        changed = true;
        return { ...service, teamMemberId: assignment.teamMemberId };
      });
      return changed ? next : prev;
    });

    if (isDesiredLocation) {
      const sharedMember =
        assignments.find((row) => row.teamMemberId)?.teamMemberId ?? "";
      if (sharedMember && sharedMember !== selectedTeamMemberId) {
        setSelectedTeamMemberId(sharedMember);
      }
    }
  }, [
    availabilitySnapshot,
    candidateMemberIds,
    hasAssignableTeamMembers,
    isDesiredLocation,
    locationCatalogIdsKey,
    selectedDateISO,
    selectedTeamMemberId,
    selectedTime,
    services,
    servicesAssignKey,
    setSelectedTeamMemberId,
    setServices,
  ]);

  const getServiceStartMin = React.useCallback(
    (serviceId: string) => {
      const start = parseTimeLabelToMinutes(selectedTime);
      if (!start) return 0;
      if (bookServicesAtSameTime) return start;
      let cursor = start;
      for (const service of services) {
        if (service.id === serviceId) return cursor;
        cursor += service.durationMins || 0;
      }
      return start;
    },
    [bookServicesAtSameTime, selectedTime, services],
  );

  const buildSlotTeamMemberOptions = React.useCallback(
    (
      currentId: string,
      startMin: number,
      durationMins: number,
    ): TeamMemberSlotOption[] => {
      const options: TeamMemberSlotOption[] = [];
      const slotById = new Map(
        filteredTeamMembers.map((tm) => [
          tm.id,
          availabilitySnapshot && startMin > 0
            ? getMemberSlotStatus(
                availabilitySnapshot,
                tm.id,
                startMin,
                durationMins || 30,
              )
            : { withinWorking: true, booked: false, available: true },
        ]),
      );
      const anyWorking = [...slotById.values()].some((slot) => slot.withinWorking);

      for (const tm of filteredTeamMembers) {
        const slot = slotById.get(tm.id) ?? {
          withinWorking: true,
          booked: false,
          available: true,
        };
        const isCurrent = tm.id === currentId;
        if (anyWorking && !slot.withinWorking && !isCurrent) continue;
        const unavailable = anyWorking && (slot.booked || !slot.withinWorking);
        options.push({
          value: tm.id,
          label: tm.name,
          disabled: unavailable,
          tooltip: slot.booked ? "Team member is booked" : undefined,
        });
      }
      const hasOtherAvailable = options.some(
        (option) => !option.disabled && option.value !== currentId,
      );
      if (!hasOtherAvailable) {
        options.push({
          value: "__no_other_team_member__",
          label: "No other team member available",
          disabled: true,
        });
      }
      return options;
    },
    [availabilitySnapshot, filteredTeamMembers],
  );

  const sharedTeamMemberOptions = React.useMemo(
    () =>
      buildSlotTeamMemberOptions(
        selectedTeamMemberId,
        parseTimeLabelToMinutes(selectedTime),
        servicesDurationMins || 30,
      ),
    [
      buildSlotTeamMemberOptions,
      selectedTeamMemberId,
      selectedTime,
      servicesDurationMins,
    ],
  );

  const getServiceTeamMemberOptions = React.useCallback(
    (service: Service): TeamMemberSlotOption[] =>
      buildSlotTeamMemberOptions(
        service.teamMemberId ?? "",
        getServiceStartMin(service.id),
        bookServicesAtSameTime
          ? servicesDurationMins || service.durationMins || 30
          : service.durationMins || 30,
      ),
    [
      bookServicesAtSameTime,
      buildSlotTeamMemberOptions,
      getServiceStartMin,
      servicesDurationMins,
    ],
  );

  const addServiceTeamMemberId = React.useMemo(() => {
    if (!hasAssignableTeamMembers) return "";

    const isValidMember = (id: string | null | undefined) =>
      Boolean(id && filteredTeamMembers.some((tm) => tm.id === id));

    const personAssigned = services.filter(
      (s) => s.guestId === selectedPersonId && s.teamMemberId,
    );
    if (personAssigned.length > 0) {
      const counts = new Map<string, number>();
      for (const row of personAssigned) {
        const id = row.teamMemberId!;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      let bestId = "";
      let bestCount = 0;
      for (const [id, count] of counts) {
        if (count > bestCount) {
          bestId = id;
          bestCount = count;
        }
      }
      if (isValidMember(bestId)) return bestId;
    }

    if (isValidMember(selectedTeamMemberId)) return selectedTeamMemberId;

    const bookingAssigned = services.find((s) => isValidMember(s.teamMemberId));
    if (bookingAssigned?.teamMemberId) return bookingAssigned.teamMemberId;

    return filteredTeamMembers[0]?.id ?? "";
  }, [
    filteredTeamMembers,
    hasAssignableTeamMembers,
    selectedPersonId,
    selectedTeamMemberId,
    services,
  ]);


  return {
    availabilitySnapshot,
    availableTimes,
    sharedTeamMemberOptions,
    getServiceTeamMemberOptions,
    addServiceTeamMemberId,
  };
}
