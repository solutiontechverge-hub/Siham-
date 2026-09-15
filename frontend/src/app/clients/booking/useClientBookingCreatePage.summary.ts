"use client";

import * as React from "react";
import { parseTimeLabelToMinutes } from "./booking-time";
import { toISO } from "./useClientBookingCreatePage.calendarTime";
import { buildBookingSummarySections } from "../../../components/common/client-booking/buildBookingSummarySections";
import type { SetupAvailabilitySnapshot } from "./clientAvailability.utils";
import type {
  BookingPerson,
  Service,
  ShopTeamMember,
} from "./booking.page.types";

export type UseClientBookingCreateSummaryArgs = {
  services: Service[];
  people: BookingPerson[];
  shopTeamMembers: ShopTeamMember[];
  availabilitySnapshot: SetupAvailabilitySnapshot | null;
  selectedTeamMemberId: string;
  filteredTeamMembers: ShopTeamMember[];
  selectedDate: Date;
  selectedTime: string;
  bookServicesAtSameTime: boolean;
  servicesDurationMins: number;
  total: number;
};

export function useClientBookingCreateSummary(
  args: UseClientBookingCreateSummaryArgs,
) {
  const {
    services,
    people,
    shopTeamMembers,
    availabilitySnapshot,
    selectedTeamMemberId,
    filteredTeamMembers,
    selectedDate,
    selectedTime,
    bookServicesAtSameTime,
    servicesDurationMins,
    total,
  } = args;

  const bookingStartMinutes = React.useMemo(
    () => parseTimeLabelToMinutes(selectedTime),
    [selectedTime],
  );
  const bookingDurationMinutes = React.useMemo(
    () => servicesDurationMins,
    [servicesDurationMins],
  );
  const bookingEndMinutes = bookingStartMinutes + bookingDurationMinutes;

  const summaryGroups = React.useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      if (!s.guestId) continue;
      const prev = map.get(s.guestId) ?? [];
      prev.push(s);
      map.set(s.guestId, prev);
    }
    return map;
  }, [services]);

  const teamMemberNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const tm of shopTeamMembers) {
      const id = String(tm.id ?? "").trim();
      const name = tm.name?.trim();
      if (id && name) map.set(id, name);
    }
    for (const tm of availabilitySnapshot?.teamMembers ?? []) {
      const id = String(tm.id ?? "").trim();
      const name = tm.name?.trim();
      if (id && name && !map.has(id)) map.set(id, name);
    }
    return map;
  }, [availabilitySnapshot?.teamMembers, shopTeamMembers]);

  const guestNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    return map;
  }, [people]);

  const teamMemberChipLabelForItems = React.useCallback(
    (items: Service[]) => {
      const ids = [
        ...new Set(
          items
            .map((s) => s.teamMemberId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      if (ids.length === 0) return undefined;
      // One shared professional — single chip. Multiple different TMs — per-service labels instead.
      if (ids.length !== 1) return undefined;
      const fullName = teamMemberNameById.get(ids[0]);
      if (!fullName) return undefined;
      return fullName.split(/\s+/)[0];
    },
    [teamMemberNameById],
  );

  const teamMemberFirstName = React.useCallback(
    (teamMemberId: string | null | undefined) => {
      const id = String(teamMemberId ?? "").trim();
      if (!id) return undefined;
      const fullName = teamMemberNameById.get(id);
      if (!fullName) return undefined;
      return fullName.split(/\s+/)[0] || fullName;
    },
    [teamMemberNameById],
  );

  const resolveServiceTeamMemberId = React.useCallback(
    (service: { teamMemberId?: string | null }) => {
      const id =
        String(service.teamMemberId ?? "").trim() ||
        String(selectedTeamMemberId ?? "").trim() ||
        filteredTeamMembers[0]?.id ||
        "";
      return id || undefined;
    },
    [filteredTeamMembers, selectedTeamMemberId],
  );

  const resolveServiceTeamMemberName = React.useCallback(
    (service: { teamMemberId?: string | null }) => {
      const id = resolveServiceTeamMemberId(service);
      if (!id) return undefined;
      return (
        teamMemberFirstName(id) ||
        teamMemberNameById.get(id) ||
        filteredTeamMembers.find((tm) => tm.id === id)?.name
      );
    },
    [
      filteredTeamMembers,
      resolveServiceTeamMemberId,
      teamMemberFirstName,
      teamMemberNameById,
    ],
  );

  const summarySections = React.useMemo(() => {
    const draft = {
      selectedDateISO: toISO(selectedDate),
      selectedTime,
      combineServices: bookServicesAtSameTime,
      people,
      services,
      teamMembers: shopTeamMembers.map((member) => ({
        id: String(member.id),
        name: member.name,
      })),
      total,
    };
    return buildBookingSummarySections(draft).map((section) => ({
      ...section,
      roleLabel:
        section.participantType === "requester"
          ? "Client"
          : section.participantType === "planning"
            ? "Planning"
            : section.participantType === "model"
              ? "Model"
              : section.participantType === "buffer"
                ? "Buffer"
                : "Guest",
    }));
  }, [
    bookServicesAtSameTime,
    people,
    selectedDate,
    selectedTime,
    services,
    shopTeamMembers,
    total,
  ]);


  return {
    bookingStartMinutes,
    bookingDurationMinutes,
    bookingEndMinutes,
    summaryGroups,
    teamMemberNameById,
    guestNameById,
    teamMemberChipLabelForItems,
    teamMemberFirstName,
    resolveServiceTeamMemberId,
    resolveServiceTeamMemberName,
    summarySections,
  };
}
