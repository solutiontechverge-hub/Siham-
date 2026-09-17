import type { CalendarBookingGuestItem } from "../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingServiceLineItem } from "./bookingServiceEdit.data";
import {
  buildChronologicalBlocks,
  collapsePersonBlocks,
  type ChronologicalParticipantType,
  type ChronologicalPerson,
} from "./bookingChronologicalBlocks.core";

export type DrawerChronologicalBlock = {
  key: string;
  blockIndex: number;
  participantId: string;
  participantType: ChronologicalParticipantType;
  isMainClient: boolean;
  guestId?: string;
  services: BookingServiceLineItem[];
  planningItem?: { activity: string; duration: string };
  startTime: string;
  endTime: string;
};

/** Split a person's chronological blocks so products can attach to the earliest only. */
export function splitParticipantDrawerBlocks(
  blocks: readonly DrawerChronologicalBlock[],
  participantId: string,
): {
  first: DrawerChronologicalBlock | undefined;
  rest: DrawerChronologicalBlock[];
} {
  const matches = blocks.filter(
    (block) => block.participantId === participantId,
  );
  return { first: matches[0], rest: matches.slice(1) };
}

export function buildDrawerChronologicalBlocks(input: {
  bookingStart?: string;
  requesterPerson: ChronologicalPerson;
  mainServices: readonly BookingServiceLineItem[];
  guests: readonly CalendarBookingGuestItem[];
  teamMembers?: ReadonlyArray<{ id: string; name: string }>;
}): DrawerChronologicalBlock[] {
  const teamMemberNameById = new Map(
    (input.teamMembers ?? []).map((member) => [member.id, member.name]),
  );
  const blocks = collapsePersonBlocks(
    buildChronologicalBlocks({
      bookingStart: input.bookingStart,
      requesterPerson: input.requesterPerson,
      mainServices: input.mainServices,
      guests: input.guests.map((guest) => ({
        person: {
          id: guest.id,
          name: guest.name,
          participantType: guest.participantType,
          planningActivity: guest.planningActivity,
          planningDuration: guest.planningDuration,
          planningStartTime: guest.planningStartTime,
          planningEndTime: guest.planningEndTime,
          bufferStartTime: guest.bufferStartTime,
          bufferEndTime: guest.bufferEndTime,
          bufferTeamMemberId: guest.bufferTeamMemberId,
        },
        services: guest.services,
      })),
      teamMembers: input.teamMembers,
    }),
    teamMemberNameById,
  );

  return blocks.map((block) => ({
    key: block.key,
    blockIndex: block.blockIndex,
    participantId: block.participantId,
    participantType: block.participantType,
    isMainClient: block.isRequester,
    guestId: block.isRequester ? undefined : block.participantId,
    services: block.items as BookingServiceLineItem[],
    planningItem: block.planningItem,
    startTime: block.startTime,
    endTime: block.endTime,
  }));
}

