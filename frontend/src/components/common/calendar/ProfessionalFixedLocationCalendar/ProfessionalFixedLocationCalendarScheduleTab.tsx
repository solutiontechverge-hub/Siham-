"use client";

import * as React from "react";
import CalendarSchedulePanel from "../CalendarSchedulePanel";
import {
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import {
  addDaysIso,
  blockTitleFromDraft,
  blockedCalendarBlockId,
  buildBlocksFromDraft,
  calendarEntryIdFromBlockId,
} from "../calendar.utils";
import type { CalendarBlock } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  locationToApi,
  toDateTimeInput,
} from "./useProfessionalFixedLocationCalendar.helpers";
import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarScheduleTabProps = Pick<
  Vm,
  | "activeDateIso"
  | "blocks"
  | "data"
  | "events"
  | "isSaving"
  | "onCreateCalendarEntry"
  | "onDeleteCalendarEntry"
  | "persistAvailabilitySettings"
  | "persistEventStatus"
  | "scheduleHydratedRef"
  | "scheduleResourceFilter"
  | "scheduleRows"
  | "setActiveDateIso"
  | "setBlocks"
  | "setEvents"
  | "setScheduleResourceFilter"
  | "setScheduleRows"
  | "showSnackbar"
>;

export default function ProfessionalFixedLocationCalendarScheduleTab(
  props: ProfessionalFixedLocationCalendarScheduleTabProps,
) {
  const {
    activeDateIso,
    blocks,
    data,
    events,
    isSaving,
    onCreateCalendarEntry,
    onDeleteCalendarEntry,
    persistAvailabilitySettings,
    persistEventStatus,
    scheduleHydratedRef,
    scheduleResourceFilter,
    scheduleRows,
    setActiveDateIso,
    setBlocks,
    setEvents,
    setScheduleResourceFilter,
    setScheduleRows,
    showSnackbar,
  } = props;

  return (
<CalendarSchedulePanel
  activeDateIso={activeDateIso}
  availableLocations={data.supportedLocations}
  blocks={blocks}
  isSaving={isSaving}
  onActiveDateChange={setActiveDateIso}
  onCreateBlockedTime={async (draft) => {
    const blockTitle = blockTitleFromDraft(draft);
    if (!onCreateCalendarEntry) {
      setBlocks((prev) => [
        ...prev,
        ...buildBlocksFromDraft(draft, draft.teamIds),
      ]);
      showSnackbar({
        severity: "success",
        message: "Blocked time added.",
      });
      return;
    }

    const createdEntries: Array<{ teamId: string; entryId: string }> =
      [];
    for (const teamId of draft.teamIds) {
      for (const location of draft.locations) {
        const entry = await onCreateCalendarEntry({
          team_member_id: String(teamId).trim() || null,
          status: "blocked",
          title: blockTitle,
          blocked_time_start: toDateTimeInput(
            draft.dateFrom,
            draft.startTime,
          ),
          blocked_time_end: toDateTimeInput(
            draft.dateTo || draft.dateFrom,
            draft.endTime,
          ),
          start_date: draft.dateFrom,
          end_date: draft.dateTo || draft.dateFrom,
          location_type: locationToApi(location),
          notes:
            `${draft.dayFrom}${draft.dayTo ? ` - ${draft.dayTo}` : ""}`.trim() ||
            null,
        });
        if (entry?.id) {
          createdEntries.push({
            teamId: String(teamId),
            entryId: String(entry.id),
          });
        }
      }
    }

    const nextBlocks: CalendarBlock[] = [];
    const seen = new Set<string>();
    for (const { teamId, entryId } of createdEntries) {
      let cursor = draft.dateFrom;
      const endDate = draft.dateTo || draft.dateFrom;
      while (cursor <= endDate) {
        const key = `${entryId}|${teamId}|${cursor}`;
        if (!seen.has(key)) {
          seen.add(key);
          nextBlocks.push({
            id: blockedCalendarBlockId(entryId, cursor),
            resourceId: teamId,
            date: cursor,
            start: draft.startTime,
            end: draft.endTime,
            title: blockTitle,
            kind: "unavailable",
          });
        }
        cursor = addDaysIso(cursor, 1);
      }
    }

    setBlocks((prev) => {
      const replaceKeys = new Set(
        nextBlocks.map(
          (block) =>
            `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
        ),
      );
      const kept = prev.filter(
        (block) =>
          !replaceKeys.has(
            `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
          ),
      );
      return [...kept, ...nextBlocks];
    });
    if (createdEntries.length === 0) {
      showSnackbar({
        severity: "error",
        message: "Unable to save blocked time. Please try again.",
      });
      return;
    }
    showSnackbar({
      severity: "success",
      message: "Blocked time added.",
    });
  }}
  onDeleteBlockedEntry={
    onDeleteCalendarEntry
      ? async (idOrBlockId) => {
          const entryId =
            calendarEntryIdFromBlockId(idOrBlockId) ??
            (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              idOrBlockId,
            )
              ? idOrBlockId
              : null);

          if (entryId) {
            await onDeleteCalendarEntry(entryId);
          }

          setBlocks((prev) =>
            prev.filter((block) => {
              const blockEntryId = calendarEntryIdFromBlockId(block.id);
              if (entryId && blockEntryId === entryId) return false;
              if (block.id === idOrBlockId) return false;
              if (
                !entryId &&
                block.id.replace(/^blk-/, "") ===
                  idOrBlockId.replace(/^blk-/, "")
              ) {
                return false;
              }
              return true;
            }),
          );
        }
      : undefined
  }
  onSaveScheduleRows={async (rows) => {
    scheduleHydratedRef.current = true;
    setScheduleRows(rows);
    await persistAvailabilitySettings({ scheduleAvailability: rows });
    showSnackbar({
      severity: "success",
      message: "Availability saved.",
    });
  }}
  resources={data.resources}
  scheduleRows={scheduleRows}
  selectedResourceIds={scheduleResourceFilter}
  onSelectedResourceIdsChange={setScheduleResourceFilter}
  activeBookings={events.map((event) => ({
    id: event.id,
    resourceId: event.resourceId,
    date: event.date,
    start: event.start,
    end: event.end,
    prepaid: event.details?.prepaymentStatus === "confirmed",
    status: event.status,
  }))}
  onCancelBookingsInSlot={async (bookingIds) => {
    for (const eventId of bookingIds) {
      const current = events.find((event) => event.id === eventId);
      const nextDetails = {
        ...(current?.details ?? {}),
        refunded: Boolean(current?.details?.prepaymentStatus === "confirmed"),
      };
      const nextNotes = serializeCalendarEntryNotes(
        nextDetails.internalNote ?? "",
        nextDetails,
        parseStoredEbrFromNotes(current?.notes),
        parseStoredErFromNotes(current?.notes),
      );
      await persistEventStatus(eventId, "Cancelled", { notes: nextNotes });
    }
    setEvents((prev) =>
      prev.map((event) =>
        bookingIds.includes(event.id)
          ? {
              ...event,
              status: "Cancelled",
              details: {
                ...(event.details ?? {}),
                refunded:
                  event.details?.prepaymentStatus === "confirmed",
              },
            }
          : event,
      ),
    );
  }}
/>
  );
}
