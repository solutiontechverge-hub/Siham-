import { minutesSinceMidnight } from "./calendar.utils";
import { collectEventTeamMemberIds } from "./teamMemberBookings";
import type {
  CalendarBookingGuestItem,
  CalendarBookingServiceItem,
  CalendarEvent,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type CalendarCardServiceLine = {
  key: string;
  id: string;
  name: string;
  start: string;
  end: string;
  teamMemberId: string;
  teamMemberName?: string;
};

export type CalendarCardGapLine = {
  key: string;
  kind: "buffer" | "planning";
  name: string;
  start: string;
  end: string;
  teamMemberId: string;
};

export type CalendarCardTeamMemberGroup = {
  id: string;
  name: string;
  avatarText: string;
  photoSrc?: string;
  services: Array<{ name: string; start: string; end: string }>;
};

export type CalendarCardTimelineLayout = {
  key: string;
  kind: "service" | "buffer" | "planning";
  name: string;
  start: string;
  end: string;
  teamMemberId?: string;
  teamMemberName?: string;
  /** Offset from parent body top (0–1). */
  topRatio: number;
  /** Height relative to parent body (0–1). */
  heightRatio: number;
  /** 0 = left, 1 = right (services alternate). Gaps use full width. */
  column: number;
  columnCount: number;
};

function assignedTeamId(service: {
  teamMemberId?: string | null;
  staffResourceId?: string | null;
}) {
  return String(service.teamMemberId || service.staffResourceId || "").trim();
}

function serviceLineDedupeKey(
  line: Pick<
    CalendarCardServiceLine,
    "id" | "name" | "start" | "end" | "teamMemberId"
  >,
) {
  return [
    String(line.id || "").toLowerCase(),
    line.name.toLowerCase(),
    line.start,
    line.end,
    line.teamMemberId,
  ].join("|");
}

function pushServiceLine(
  lines: CalendarCardServiceLine[],
  seen: Set<string>,
  service: CalendarBookingServiceItem,
  fallback: { start: string; end: string; resourceId: string },
  index: number,
) {
  const name = String(service.name ?? "").trim();
  if (!name) return;
  const teamMemberId = assignedTeamId(service) || fallback.resourceId;
  const line: CalendarCardServiceLine = {
    key: `${service.id || name}-${index}-${teamMemberId}`,
    id: String(service.id || `${name}-${index}`),
    name,
    start: service.startTime?.trim() || fallback.start,
    end: service.endTime?.trim() || fallback.end,
    teamMemberId,
    teamMemberName: service.teamMemberName?.trim() || undefined,
  };
  const dedupe = serviceLineDedupeKey(line);
  if (seen.has(dedupe)) return;
  seen.add(dedupe);
  lines.push(line);
}

function isBufferGuest(
  guest: Pick<CalendarBookingGuestItem, "id" | "name" | "participantType">,
) {
  if (guest.participantType === "buffer") return true;
  const id = String(guest.id ?? "").toLowerCase();
  return id === "buffer" || id.startsWith("buffer-") || id.startsWith("p-buffer");
}

function isPlanningGuest(
  guest: Pick<CalendarBookingGuestItem, "name" | "participantType">,
) {
  return guest.participantType === "planning" || guest.name === "Planning";
}

/** All timed service lines on a booking (main + guest), sorted by start. */
export function collectBookingServiceLines(
  event: Pick<
    CalendarEvent,
    "start" | "end" | "resourceId" | "details" | "title"
  >,
): CalendarCardServiceLine[] {
  const fallback = {
    start: event.start,
    end: event.end,
    resourceId: String(event.resourceId ?? ""),
  };
  const lines: CalendarCardServiceLine[] = [];
  const seen = new Set<string>();
  let index = 0;

  for (const service of event.details?.services ?? []) {
    pushServiceLine(lines, seen, service, fallback, index++);
  }
  for (const guest of event.details?.guests ?? []) {
    if (isBufferGuest(guest) || isPlanningGuest(guest)) continue;
    for (const service of guest.services ?? []) {
      pushServiceLine(lines, seen, service, fallback, index++);
    }
  }

  if (!lines.length && event.title?.trim()) {
    lines.push({
      key: `title-${event.resourceId}`,
      id: String(event.resourceId || "service"),
      name: event.title.trim(),
      start: event.start,
      end: event.end,
      teamMemberId: fallback.resourceId,
    });
  }

  return lines.sort(
    (a, b) => minutesSinceMidnight(a.start) - minutesSinceMidnight(b.start),
  );
}

/** Buffer / planning windows that must reserve space on the parent card. */
export function collectBookingGapLines(
  event: Pick<CalendarEvent, "start" | "end" | "resourceId" | "details">,
): CalendarCardGapLine[] {
  const fallbackResource = String(event.resourceId ?? "");
  const gaps: CalendarCardGapLine[] = [];
  const seen = new Set<string>();

  const pushGap = (
    kind: "buffer" | "planning",
    id: string,
    name: string,
    start?: string | null,
    end?: string | null,
    teamMemberId?: string | null,
  ) => {
    const startTime = String(start ?? "").trim();
    const endTime = String(end ?? "").trim();
    if (!startTime || !endTime) return;
    if (minutesSinceMidnight(endTime) <= minutesSinceMidnight(startTime)) {
      return;
    }
    const memberId = String(teamMemberId ?? "").trim() || fallbackResource;
    const key = `${kind}|${id}|${startTime}|${endTime}|${memberId}`;
    if (seen.has(key)) return;
    seen.add(key);
    gaps.push({
      key,
      kind,
      name: name.trim() || (kind === "buffer" ? "Buffer" : "Planning"),
      start: startTime,
      end: endTime,
      teamMemberId: memberId,
    });
  };

  for (const guest of event.details?.guests ?? []) {
    if (isBufferGuest(guest)) {
      pushGap(
        "buffer",
        String(guest.id || "buffer"),
        guest.name || "Buffer",
        guest.bufferStartTime,
        guest.bufferEndTime,
        guest.bufferTeamMemberId,
      );
      continue;
    }
    if (isPlanningGuest(guest)) {
      pushGap(
        "planning",
        String(guest.id || "planning"),
        guest.planningActivity || guest.name || "Planning",
        guest.planningStartTime,
        guest.planningEndTime,
        undefined,
      );
    }
  }

  for (const person of event.details?.clientSnapshot?.people ?? []) {
    const id = String(person.id ?? "").toLowerCase();
    const isBuffer =
      person.participantType === "buffer" ||
      id === "buffer" ||
      id.startsWith("buffer-") ||
      id.startsWith("p-buffer");
    const isPlanning =
      person.participantType === "planning" || person.name === "Planning";

    if (isBuffer) {
      pushGap(
        "buffer",
        String(person.id || "buffer"),
        person.name || "Buffer",
        person.bufferStartTime,
        person.bufferEndTime,
        person.bufferTeamMemberId,
      );
    }
    if (isPlanning) {
      pushGap(
        "planning",
        String(person.id || "planning"),
        person.planningActivity || person.name || "Planning",
        person.planningStartTime,
        person.planningEndTime,
        undefined,
      );
    }
  }

  return gaps.sort(
    (a, b) => minutesSinceMidnight(a.start) - minutesSinceMidnight(b.start),
  );
}

/** Services shown on a calendar lane card.
 * Multi-staff FL segments only include this column's assigned services.
 */
export function getCalendarCardServiceLines(
  event: CalendarEvent,
): CalendarCardServiceLine[] {
  const all = collectBookingServiceLines(event);
  const resourceId = String(event.resourceId ?? "").trim();
  if (!event.teamShared || !resourceId) return all;

  const mine = all.filter(
    (line) => String(line.teamMemberId ?? "").trim() === resourceId,
  );
  if (mine.length) return mine;

  // Shared segment remounted onto a visible host (partner column capped out):
  // keep one lane label so the card stays visible with the share indicator.
  if (all.length || event.title?.trim()) {
    return [
      {
        key: `${event.id}::shared-lane`,
        id: resourceId,
        name: event.title?.trim() || all[0]?.name || "Booking",
        start: event.start,
        end: event.end,
        teamMemberId: resourceId,
      },
    ];
  }
  return [];
}

/**
 * Week overview: one main card per client service (no guest / buffer / planning).
 * Each span uses that service's own start–end so cards are not stretched.
 */
export function getWeekOverviewMainServiceSpans(
  event: CalendarEvent,
): Array<{ key: string; start: string; end: string; name: string }> {
  const resourceId = String(event.resourceId ?? "");
  let services = (event.details?.services ?? []).filter(
    (service) => !String(service.guestId ?? "").trim(),
  );
  if (event.teamShared && resourceId) {
    services = services.filter((service) => {
      const teamId = assignedTeamId(service);
      return !teamId || teamId === resourceId;
    });
  }

  const spans = services
    .map((service, index) => {
      const start = service.startTime?.trim() || event.start;
      const end = service.endTime?.trim() || event.end;
      if (
        !start ||
        !end ||
        minutesSinceMidnight(end) <= minutesSinceMidnight(start)
      ) {
        return null;
      }
      const name = String(service.name ?? "").trim() || event.title;
      return {
        key: `${event.id}::week-svc-${service.id || index}`,
        start,
        end,
        name,
      };
    })
    .filter((span): span is NonNullable<typeof span> => Boolean(span));

  if (spans.length) return spans;

  return [
    {
      key: `${event.id}::week-main`,
      start: event.start,
      end: event.end,
      name: event.title,
    },
  ];
}

/** Gaps for this lane (buffer assigned to other staff is hidden on shared segments). */
export function getCalendarCardGapLines(
  event: CalendarEvent,
): CalendarCardGapLine[] {
  const all = collectBookingGapLines(event);
  const resourceId = String(event.resourceId ?? "");
  if (!event.teamShared || !resourceId) return all;

  // Never fall back to another member's gaps — that paints their buffer on this column.
  return all.filter(
    (gap) => !gap.teamMemberId || gap.teamMemberId === resourceId,
  );
}

function clampTimedRange(
  start: string,
  end: string,
  parentStartMin: number,
  parentEndMin: number,
) {
  let startMin = minutesSinceMidnight(start);
  let endMin = minutesSinceMidnight(end);
  if (!Number.isFinite(startMin)) startMin = parentStartMin;
  if (!Number.isFinite(endMin) || endMin <= startMin) {
    endMin = Math.min(parentEndMin, startMin + 1);
  }
  startMin = Math.max(parentStartMin, Math.min(startMin, parentEndMin - 1));
  endMin = Math.max(startMin + 1, Math.min(endMin, parentEndMin));
  return { startMin, endMin };
}

/**
 * Parent-card timeline:
 * - Services alternate left / right by chronological order
 * - Buffer / planning keep their own time slot (full-width reserved band)
 */
export function layoutCalendarCardTimeline(
  services: readonly CalendarCardServiceLine[],
  gaps: readonly CalendarCardGapLine[],
  parentStart: string,
  parentEnd: string,
): CalendarCardTimelineLayout[] {
  const parentStartMin = minutesSinceMidnight(parentStart);
  const parentEndMin = Math.max(
    parentStartMin + 1,
    minutesSinceMidnight(parentEnd),
  );
  const parentSpan = parentEndMin - parentStartMin;

  const serviceOrdered = [...services].sort(
    (a, b) =>
      minutesSinceMidnight(a.start) - minutesSinceMidnight(b.start) ||
      a.name.localeCompare(b.name),
  );

  const memberOrder: string[] = [];
  for (const line of serviceOrdered) {
    const id = String(line.teamMemberId || "").trim() || "__none__";
    if (!memberOrder.includes(id)) memberOrder.push(id);
  }
  const multiMember = memberOrder.length > 1;

  const serviceLayouts: CalendarCardTimelineLayout[] = serviceOrdered.map(
    (line) => {
      const { startMin, endMin } = clampTimedRange(
        line.start,
        line.end,
        parentStartMin,
        parentEndMin,
      );
      const topRatio = (startMin - parentStartMin) / parentSpan;
      const heightRatio = (endMin - startMin) / parentSpan;
      const memberKey = String(line.teamMemberId || "").trim() || "__none__";
      const memberColumn = multiMember
        ? Math.max(0, memberOrder.indexOf(memberKey))
        : 0;
      return {
        key: line.key,
        kind: "service" as const,
        name: line.name,
        start: line.start,
        end: line.end,
        teamMemberId: line.teamMemberId || undefined,
        teamMemberName: line.teamMemberName,
        topRatio: Math.max(0, Math.min(1, topRatio)),
        heightRatio: Math.max(0.03, Math.min(1 - topRatio, heightRatio)),
        // Same team member → same side; different members → their own column.
        column: multiMember ? memberColumn % 2 : 0,
        columnCount: multiMember ? Math.min(2, memberOrder.length) : 1,
      };
    },
  );

  const gapLayouts: CalendarCardTimelineLayout[] = gaps.map((gap) => {
    const { startMin, endMin } = clampTimedRange(
      gap.start,
      gap.end,
      parentStartMin,
      parentEndMin,
    );
    const topRatio = (startMin - parentStartMin) / parentSpan;
    const heightRatio = (endMin - startMin) / parentSpan;
    return {
      key: gap.key,
      kind: gap.kind,
      name: gap.name,
      start: gap.start,
      end: gap.end,
      topRatio: Math.max(0, Math.min(1, topRatio)),
      heightRatio: Math.max(0.02, Math.min(1 - topRatio, heightRatio)),
      column: 0,
      columnCount: 1,
    };
  });

  return [...serviceLayouts, ...gapLayouts].sort(
    (a, b) =>
      a.topRatio - b.topRatio ||
      (a.kind === "service" ? 1 : 0) - (b.kind === "service" ? 1 : 0),
  );
}

/** @deprecated Prefer layoutCalendarCardTimeline — kept for callers expecting services-only. */
export function layoutCalendarCardServiceLines(
  lines: readonly CalendarCardServiceLine[],
  parentStart: string,
  parentEnd: string,
): Array<
  CalendarCardServiceLine & {
    topRatio: number;
    heightRatio: number;
    column: number;
    columnCount: number;
  }
> {
  return layoutCalendarCardTimeline(lines, [], parentStart, parentEnd)
    .filter((block) => block.kind === "service")
    .map((block, index) => ({
      key: block.key,
      id: block.key,
      name: block.name,
      start: block.start,
      end: block.end,
      teamMemberId: "",
      topRatio: block.topRatio,
      heightRatio: block.heightRatio,
      column: index % 2,
      columnCount: 2,
    }));
}

function firstName(value: string | undefined) {
  const name = value?.trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
}

function avatarFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

/** Other assigned team members (not the current lane) with their services. */
export function getOtherAssignedTeamMembers(
  event: CalendarEvent,
  options?: {
    resources?: readonly CalendarResource[];
    nameById?: ReadonlyMap<string, string>;
  },
): CalendarCardTeamMemberGroup[] {
  const currentId = String(event.resourceId ?? "");
  const lines = collectBookingServiceLines(event);
  const byId = new Map<string, CalendarCardTeamMemberGroup>();
  const resourceById = new Map(
    (options?.resources ?? []).map((resource) => [
      String(resource.id),
      resource,
    ]),
  );

  const ensureGroup = (id: string, hintName?: string) => {
    let group = byId.get(id);
    if (group) return group;
    const resource = resourceById.get(id);
    const name =
      firstName(resource?.name) ||
      firstName(options?.nameById?.get(id)) ||
      firstName(hintName) ||
      firstName(
        event.sharedTeamMemberNames?.find((label) => Boolean(label)),
      ) ||
      "Team";
    group = {
      id,
      name,
      avatarText: resource?.avatarText || avatarFromName(name),
      photoSrc: resource?.photoSrc,
      services: [],
    };
    byId.set(id, group);
    return group;
  };

  for (const line of lines) {
    const id = line.teamMemberId;
    if (!id || id === currentId) continue;
    const group = ensureGroup(id, line.teamMemberName);
    group.services.push({
      name: line.name,
      start: line.start,
      end: line.end,
    });
  }

  // Shared metadata / ids without timed lines still need avatars on the card.
  if (
    (event.teamShared || (event.sharedTeamMemberNames?.length ?? 0) > 1) &&
    !byId.size
  ) {
    for (const id of collectEventTeamMemberIds(event)) {
      if (id === currentId) continue;
      ensureGroup(id);
    }
    for (const resource of options?.resources ?? []) {
      const id = String(resource.id);
      if (id === currentId || byId.has(id)) continue;
      if (
        !event.sharedTeamMemberNames?.some((label) => {
          const first = firstName(label).toLowerCase();
          return first && firstName(resource.name).toLowerCase() === first;
        })
      ) {
        continue;
      }
      ensureGroup(id);
    }
  }

  return [...byId.values()];
}
