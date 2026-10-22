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
import {
  autoAssignServicesByAvailability,
  computeUnionBookableSlots,
  filterMembersNotOnLeave,
  filterServicesOfferedByAvailableMembers,
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
      teamMembers: raw.teamMembers,
      busyByMember: raw.busyByMember,
    };
  }, [setupAvailabilityResponse?.data]);

  /** Hide leave (no schedule that day+location) from client team picks / Any. */
  const scheduleAvailableTeamMembers = React.useMemo(() => {
    if (!availabilitySnapshot || !hasAssignableTeamMembers) {
      return filteredTeamMembers;
    }
    return filterMembersNotOnLeave(filteredTeamMembers, availabilitySnapshot);
  }, [
    availabilitySnapshot,
    filteredTeamMembers,
    hasAssignableTeamMembers,
  ]);

  const candidateMemberIds = React.useMemo(
    () => scheduleAvailableTeamMembers.map((member) => member.id),
    [scheduleAvailableTeamMembers],
  );

  const bookableServiceCatalog = React.useMemo(() => {
    if (
      !availabilitySnapshot ||
      !hasAssignableTeamMembers ||
      !locationServiceCatalog.length
    ) {
      return locationServiceCatalog;
    }
    const fallbackIds = locationServiceCatalog.map((service) => service.id);
    return filterServicesOfferedByAvailableMembers(
      locationServiceCatalog,
      availabilitySnapshot,
      candidateMemberIds,
      fallbackIds,
    );
  }, [
    availabilitySnapshot,
    candidateMemberIds,
    hasAssignableTeamMembers,
    locationServiceCatalog,
  ]);

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
    // When live TM availability is loaded, never fall back to hours that ignore blocks/busy.
    if (availabilityBookableTimes) {
      if (!availabilityBookableTimes.length) return [];
      const allowed = new Set(availabilityBookableTimes);
      return baseAvailableTimes.filter((time) => allowed.has(time));
    }
    return baseAvailableTimes;
  }, [availabilityBookableTimes, baseAvailableTimes]);

  const locationServiceCatalogRef = React.useRef(locationServiceCatalog);
  locationServiceCatalogRef.current = locationServiceCatalog;
  const selectedDateISO = toISO(selectedDate);

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
    // FL + Combine Services: one free member for the shared window.
    // Always recalculate from live availability — never pin a hydration/default TM.
    const assignments = autoAssignServicesByAvailability({
      snapshot: availabilitySnapshot,
      services: services.map((service) => ({
        id: service.id,
        catalogServiceId:
          service.catalogServiceId ?? extractUuidFromSyntheticId(service.id),
        durationMins: service.durationMins,
        teamMemberId: undefined,
      })),
      candidateMemberIds,
      fallbackCatalogIds: catalogList.map((service) => service.id),
      startMin,
      assignOneMemberForAll: isDesiredLocation || bookServicesAtSameTime,
      sharedWindowMins: bookServicesAtSameTime
        ? servicesDurationMins || undefined
        : undefined,
    });

    // ponytail: no lastAutoAssignRef — that key ignored current teamMemberIds, so
    // guest-assign re-stamping the default first TM after a clear never got undone.
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

    if (isDesiredLocation || bookServicesAtSameTime) {
      const sharedMember =
        assignments.find((row) => row.teamMemberId)?.teamMemberId ?? "";
      // Sync picker when assign finds someone. Do NOT clear to "" while the
      // current pick is still on the leave-filtered roster (just busy) — that
      // fought the ""→first repair effect and caused max update depth.
      if (sharedMember) {
        if (sharedMember !== selectedTeamMemberId) {
          setSelectedTeamMemberId(sharedMember);
        }
      } else if (
        selectedTeamMemberId &&
        !candidateMemberIds.includes(selectedTeamMemberId)
      ) {
        setSelectedTeamMemberId("");
      }
    }
  }, [
    availabilitySnapshot,
    bookServicesAtSameTime,
    candidateMemberIds,
    hasAssignableTeamMembers,
    isDesiredLocation,
    selectedDateISO,
    selectedTeamMemberId,
    selectedTime,
    services,
    servicesDurationMins,
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
        scheduleAvailableTeamMembers.map((tm) => [
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

      for (const tm of scheduleAvailableTeamMembers) {
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
    [availabilitySnapshot, scheduleAvailableTeamMembers],
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
      Boolean(id && scheduleAvailableTeamMembers.some((tm) => tm.id === id));

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

    return scheduleAvailableTeamMembers[0]?.id ?? "";
  }, [
    scheduleAvailableTeamMembers,
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
    scheduleAvailableTeamMembers,
    bookableServiceCatalog,
  };
}
