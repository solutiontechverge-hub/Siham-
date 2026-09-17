import * as React from "react";
import type {
  CalendarBlock,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";

export type UseProfessionalFixedLocationCalendarOverviewSyncArgs = {
  overviewEvents: readonly CalendarEvent[];
  overviewBlocks: readonly CalendarBlock[];
  isEditingExisting: boolean;
};

/** Overview events/blocks local state + API sync (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarOverviewSync({
  overviewEvents,
  overviewBlocks,
  isEditingExisting,
}: UseProfessionalFixedLocationCalendarOverviewSyncArgs) {
  const [events, setEvents] = React.useState<readonly CalendarEvent[]>(() => [
    ...overviewEvents,
  ]);

  // Sync whenever overview payload changes (ids or content). Include notes/title
  // so client EBR time/service updates replace the grid without a page reload.
  const overviewEventKey = React.useMemo(
    () =>
      overviewEvents
        .map(
          (event) =>
            [
              event.id,
              event.date,
              event.start,
              event.end,
              event.status,
              event.title,
              event.bookingScenario ?? "",
              event.updatedAt ?? "",
              event.notes ?? "",
              // Client pay can change only this field while status/notes stay put.
              event.details?.prepaymentStatus ?? "",
              event.details?.services?.map((s) => s.id).join(",") ?? "",
            ].join(":"),
        )
        .join("|"),
    [overviewEvents],
  );
  React.useEffect(() => {
    if (isEditingExisting) return;
    setEvents([...overviewEvents]);
  }, [overviewEventKey, overviewEvents, isEditingExisting]);

  const [blocks, setBlocks] = React.useState<readonly CalendarBlock[]>(() => [
    ...overviewBlocks,
  ]);
  React.useEffect(() => {
    setBlocks((prev) => {
      const apiKeys = new Set(
        overviewBlocks.map(
          (block) =>
            `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
        ),
      );
      const localBlocks = prev.filter(
        (block) =>
          block.id.startsWith("blk-local-") &&
          !apiKeys.has(
            `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
          ),
      );
      return [...overviewBlocks, ...localBlocks];
    });
  }, [overviewBlocks]);

  return {
    events,
    setEvents,
    blocks,
    setBlocks,
    overviewEventKey,
  };
}
