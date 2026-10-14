import { minutesSinceMidnight } from "../components/common/calendar/calendar.utils";
import {
  isPlanningPerson,
  isBufferPerson,
  type ChronologicalParticipantType,
  type ChronologicalPerson,
  type ChronologicalServiceLine,
  type ChronologicalTimedEntry,
  type ChronologicalBlock,
} from "./bookingChronologicalBlocks.participants";
import { parseDurationMinsLabel, addMinutesToTime } from "./bookingServiceEdit.data";

export function resolveParticipantType(
  person: ChronologicalPerson,
): ChronologicalParticipantType {
  if (person.isRequester) return "requester";
  if (isPlanningPerson(person)) return "planning";
  if (isBufferPerson(person)) return "buffer";
  if (person.participantType === "model") return "model";
  return "guest";
}

function resolveBlockTitle(
  person: ChronologicalPerson,
  participantType: ChronologicalParticipantType,
  modelOrdinal: number,
): string {
  if (participantType === "planning") return "Planning Details";
  if (participantType === "buffer") {
    const trimmed = person.name.trim();
    return trimmed ? `Buffer: ${trimmed}` : "Buffer";
  }
  if (participantType === "model") {
    const trimmed = person.name.trim();
    if (trimmed && trimmed.toLowerCase() !== "model") return trimmed;
    return `Model ${modelOrdinal}`;
  }
  if (participantType === "guest") {
    const trimmed = person.name.trim();
    if (trimmed && trimmed.toLowerCase() !== "guest") return trimmed;
    return "Guest";
  }
  return person.name.trim() || "Client";
}

export function resolvePlanningWindow(person: ChronologicalPerson, fallbackStart?: string) {
  const durationMins = parseDurationMinsLabel(person.planningDuration) ?? 0;
  const startTime =
    person.planningStartTime?.trim() ||
    person.bufferStartTime?.trim() ||
    fallbackStart?.trim() ||
    "";
  if (!startTime) return null;
  const endTime =
    person.planningEndTime?.trim() ||
    person.bufferEndTime?.trim() ||
    addMinutesToTime(startTime, durationMins > 0 ? durationMins : 60);
  if (!endTime) return null;
  return { startTime, endTime };
}

export function compareTimedEntries<T extends ChronologicalServiceLine>(
  a: ChronologicalTimedEntry<T>,
  b: ChronologicalTimedEntry<T>,
) {
  const startDiff =
    minutesSinceMidnight(a.startTime) - minutesSinceMidnight(b.startTime);
  if (startDiff !== 0) return startDiff;
  if (a.participantId !== b.participantId) {
    return a.participantId.localeCompare(b.participantId);
  }
  return a.id.localeCompare(b.id);
}

function resolveLineTeamMemberId<T extends ChronologicalServiceLine>(item: T) {
  return item.staffResourceId?.trim() || item.teamMemberId?.trim() || undefined;
}

function teamMemberChipLabelForItems<T extends ChronologicalServiceLine>(
  items: readonly T[],
  teamMemberNameById: ReadonlyMap<string, string>,
) {
  const ids = [
    ...new Set(
      items
        .map((item) => item.teamMemberId ?? item.staffResourceId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (ids.length !== 1) return undefined;
  return teamMemberNameById.get(ids[0]) || undefined;
}

export function groupTimedEntriesIntoBlocks<T extends ChronologicalServiceLine>(
  entries: readonly ChronologicalTimedEntry<T>[],
  peopleById: ReadonlyMap<string, ChronologicalPerson>,
  teamMemberNameById: ReadonlyMap<string, string>,
): ChronologicalBlock<T>[] {
  if (!entries.length) return [];

  const sorted = [...entries].sort(compareTimedEntries);
  const blocks: ChronologicalBlock<T>[] = [];
  let modelOrdinal = 0;

  for (const entry of sorted) {
    const person = peopleById.get(entry.participantId);
    const participantType = entry.participantType;
    if (participantType === "model") modelOrdinal += 1;

    const last = blocks[blocks.length - 1];
    const canMerge =
      last &&
      last.participantId === entry.participantId &&
      last.endTime === entry.startTime &&
      entry.kind === "service" &&
      last.items.length > 0;

    if (canMerge && entry.service) {
      last.items.push(entry.service);
      last.endTime = entry.endTime;
      last.teamMemberLabel = teamMemberChipLabelForItems(
        last.items,
        teamMemberNameById,
      );
      last.teamMemberId = resolveLineTeamMemberId(last.items[0] ?? entry.service);
      continue;
    }

    const title = person
      ? resolveBlockTitle(person, participantType, modelOrdinal)
      : entry.participantId;

    blocks.push({
      key: `${entry.participantId}::${blocks.length}`,
      blockIndex: blocks.length,
      participantId: entry.participantId,
      participantType,
      title,
      isRequester: Boolean(person?.isRequester),
      startTime: entry.startTime,
      endTime: entry.endTime,
      items: entry.service ? [entry.service] : [],
      ...(entry.kind === "planning" || entry.kind === "buffer"
        ? {
            planningItem: {
              activity: entry.planningActivity?.trim() ?? "",
              duration: entry.planningDuration?.trim() ?? "",
            },
          }
        : {}),
      teamMemberLabel: entry.service
        ? teamMemberChipLabelForItems([entry.service], teamMemberNameById)
        : entry.teamMemberId
          ? teamMemberNameById.get(entry.teamMemberId)
          : undefined,
      teamMemberId: entry.service
        ? resolveLineTeamMemberId(entry.service)
        : entry.teamMemberId,
    });
  }

  return blocks;
}

function sortBlockItemsByStartTime<T extends ChronologicalServiceLine>(items: T[]) {
  return [...items].sort((a, b) => {
    const aStart = a.startTime?.trim();
    const bStart = b.startTime?.trim();
    if (!aStart && !bStart) return a.id.localeCompare(b.id);
    if (!aStart) return 1;
    if (!bStart) return -1;
    const diff = minutesSinceMidnight(aStart) - minutesSinceMidnight(bStart);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Drawer / payment-summary grouping: one card per person with every service
 * that belongs to them. Calendar timeline still uses time-sliced blocks.
 */
export function collapsePersonBlocks<T extends ChronologicalServiceLine>(
  blocks: readonly ChronologicalBlock<T>[],
  teamMemberNameById: ReadonlyMap<string, string>,
): ChronologicalBlock<T>[] {
  if (blocks.length <= 1) return [...blocks];

  const collapsed: ChronologicalBlock<T>[] = [];
  const indexByParticipant = new Map<string, number>();

  for (const block of blocks) {
    const keepSeparate =
      block.participantType === "planning" ||
      block.participantType === "buffer";
    if (keepSeparate) {
      collapsed.push({
        ...block,
        items: [...block.items],
        key: `${block.participantId}::${collapsed.length}`,
        blockIndex: collapsed.length,
      });
      continue;
    }

    const existingIndex = indexByParticipant.get(block.participantId);
    if (existingIndex == null) {
      indexByParticipant.set(block.participantId, collapsed.length);
      collapsed.push({
        ...block,
        items: [...block.items],
        key: `${block.participantId}::${collapsed.length}`,
        blockIndex: collapsed.length,
      });
      continue;
    }

    const existing = collapsed[existingIndex];
    existing.items.push(...block.items);
    if (
      minutesSinceMidnight(block.startTime) <
      minutesSinceMidnight(existing.startTime)
    ) {
      existing.startTime = block.startTime;
    }
    if (
      minutesSinceMidnight(block.endTime) >
      minutesSinceMidnight(existing.endTime)
    ) {
      existing.endTime = block.endTime;
    }
  }

  return collapsed.map((block, index) => {
    const items = sortBlockItemsByStartTime(block.items);
    return {
      ...block,
      key: `${block.participantId}::${index}`,
      blockIndex: index,
      items,
      teamMemberLabel: teamMemberChipLabelForItems(items, teamMemberNameById),
      teamMemberId: items[0]
        ? resolveLineTeamMemberId(items[0])
        : block.teamMemberId,
    };
  });
}

export function getLatestEntryEnd<T extends ChronologicalServiceLine>(
  entries: readonly ChronologicalTimedEntry<T>[],
) {
  let latest = "";
  let latestMin = -1;
  for (const entry of entries) {
    const mins = minutesSinceMidnight(entry.endTime);
    if (mins >= latestMin) {
      latestMin = mins;
      latest = entry.endTime;
    }
  }
  return latest;
}
