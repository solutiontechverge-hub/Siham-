import * as React from "react";
import type { CalendarBlock } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  addDaysIso,
  blockTitleFromDraft,
  buildBlocksFromDraft,
  blockedCalendarBlockId,
  type BlockTimeDraft,
} from "../calendar.utils";
import {
  locationToApi,
  toDateTimeInput,
} from "./useProfessionalFixedLocationCalendar.helpers";
import type { ProfessionalFixedLocationCalendarProps } from "./useProfessionalFixedLocationCalendar.types";

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

export type UseProfessionalFixedLocationCalendarPersistOverviewBlockedTimeArgs =
  {
    showSnackbar: ShowSnackbar;
    setActiveDateIso: React.Dispatch<React.SetStateAction<string>>;
    setSelectedResourceId: React.Dispatch<React.SetStateAction<string>>;
    onCreateCalendarEntry: ProfessionalFixedLocationCalendarProps["onCreateCalendarEntry"];
    setBlocks: React.Dispatch<React.SetStateAction<readonly CalendarBlock[]>>;
    setBlockTimeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };

/** Overview block-time persist (ponytail: deps bag; semantics unchanged). */
export function useProfessionalFixedLocationCalendarPersistOverviewBlockedTime(
  args: UseProfessionalFixedLocationCalendarPersistOverviewBlockedTimeArgs,
) {
  const {
    showSnackbar,
    setActiveDateIso,
    setSelectedResourceId,
    onCreateCalendarEntry,
    setBlocks,
    setBlockTimeOpen,
  } = args;

  const persistOverviewBlockedTime = async (draft: BlockTimeDraft) => {
    const blockTitle = blockTitleFromDraft(draft) || "Blocked time";
    const optimisticBlocks = buildBlocksFromDraft(draft, draft.teamIds);
    if (!optimisticBlocks.length) {
      showSnackbar({
        severity: "warning",
        message:
          "No dates matched your selection. Check the date range and day filters.",
      });
      return;
    }

    setActiveDateIso(draft.dateFrom);
    if (draft.teamIds.length === 1) {
      setSelectedResourceId(draft.teamIds[0]);
    }

    if (!onCreateCalendarEntry) {
      setBlocks((prev) => {
        const seen = new Set(
          prev.map(
            (block) =>
              `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
          ),
        );
        const unique = optimisticBlocks.filter((block) => {
          const key = `${block.resourceId}-${block.date}-${block.start}-${block.end}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return [...prev, ...unique];
      });
      setBlockTimeOpen(false);
      showSnackbar({ severity: "success", message: "Blocked time added." });
      return;
    }

    try {
      const createdEntries: Array<{ teamId: string; entryId: string }> = [];
      for (const teamId of draft.teamIds) {
        const teamMemberId = String(teamId).trim() || null;
        for (const location of draft.locations) {
          const entry = await onCreateCalendarEntry({
            team_member_id: teamMemberId,
            status: "blocked",
            title: blockTitle,
            blocked_time_start: toDateTimeInput(draft.dateFrom, draft.startTime),
            blocked_time_end: toDateTimeInput(
              draft.dateTo || draft.dateFrom,
              draft.endTime,
            ),
            start_date: draft.dateFrom,
            end_date: draft.dateTo || draft.dateFrom,
            location_type: locationToApi(location),
            notes:
              `${draft.dayFrom || ""}${draft.dayTo ? ` - ${draft.dayTo}` : ""}`.trim() ||
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
      setBlockTimeOpen(false);
      if (createdEntries.length === 0) {
        showSnackbar({
          severity: "error",
          message: "Unable to save blocked time. Please try again.",
        });
        return;
      }
      showSnackbar({ severity: "success", message: "Blocked time added." });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to save blocked time. Please try again.",
      });
    }
  };

  return { persistOverviewBlockedTime };
}
