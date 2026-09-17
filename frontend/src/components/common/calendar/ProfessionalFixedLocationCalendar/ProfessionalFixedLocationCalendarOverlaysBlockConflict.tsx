"use client";

import type { CalendarScheduleConflictKind } from "../CalendarScheduleConflictDialog";

import CalendarBlockTimeModal from "../CalendarBlockTimeModal";

import CalendarScheduleConflictDialog from "../CalendarScheduleConflictDialog";

import {
  findBookingsInTimeslot,
} from "../calendar-schedule.utils";

import {
  buildBlocksFromDraft,
} from "../calendar.utils";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarOverlaysBlockConflictBag = Pick<
  Vm,
  | "blockDraft"
  | "blockOverlapOpen"
  | "blockTimeOpen"
  | "closeBookingDrawer"
  | "data"
  | "events"
  | "pendingOverviewBlockRef"
  | "persistBookingFromDrawer"
  | "persistOverviewBlockedTime"
  | "setBlockDraft"
  | "setBlockOverlapOpen"
  | "setBlockTimeOpen"
  | "setStaffConflictMessage"
  | "setStaffConflictOpen"
  | "showSnackbar"
  | "staffConflictAckRef"
  | "staffConflictMessage"
  | "staffConflictOpen"
  | "teamLabelById"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarOverlaysBlockConflictBag;
};

export default function ProfessionalFixedLocationCalendarOverlaysBlockConflict({
  bag,
}: Props) {
  const {
    blockDraft,
    blockOverlapOpen,
    blockTimeOpen,
    closeBookingDrawer,
    data,
    events,
    pendingOverviewBlockRef,
    persistBookingFromDrawer,
    persistOverviewBlockedTime,
    setBlockDraft,
    setBlockOverlapOpen,
    setBlockTimeOpen,
    setStaffConflictMessage,
    setStaffConflictOpen,
    showSnackbar,
    staffConflictAckRef,
    staffConflictMessage,
    staffConflictOpen,
    teamLabelById,
  } = bag;

  return (
    <>
      <CalendarBlockTimeModal
        availableLocations={data.supportedLocations}
        draft={blockDraft}
        onApply={async () => {
          if (!blockDraft.title) {
            showSnackbar({
              severity: "warning",
              message: "Select a title.",
            });
            return;
          }
          if (!blockDraft.teamIds.length || !blockDraft.locations.length) {
            showSnackbar({
              severity: "warning",
              message: "Select team member and location.",
            });
            return;
          }
          const nextBlocks = buildBlocksFromDraft(
            blockDraft,
            blockDraft.teamIds,
          );
          if (!nextBlocks.length) {
            showSnackbar({
              severity: "warning",
              message:
                "No dates matched your selection. Check the date range and day filters.",
            });
            return;
          }
          const colliding = findBookingsInTimeslot(
            events.map((event) => ({
              id: event.id,
              resourceId: event.resourceId,
              date: event.date,
              start: event.start,
              end: event.end,
              status: event.status,
            })),
            blockDraft.teamIds,
            blockDraft.dateFrom,
            blockDraft.dateTo || blockDraft.dateFrom,
            blockDraft.startTime,
            blockDraft.endTime,
          );
          if (colliding.length) {
            pendingOverviewBlockRef.current = blockDraft;
            setBlockOverlapOpen(true);
            return;
          }
          await persistOverviewBlockedTime(blockDraft);
        }}
        onClose={() => setBlockTimeOpen(false)}
        open={blockTimeOpen}
        resources={data.resources}
        setDraft={setBlockDraft}
        teamLabelById={teamLabelById}
      />
      <CalendarScheduleConflictDialog
        open={blockOverlapOpen}
        kind={blockOverlapOpen ? "overlap_booking" : null}
        onClose={() => {
          setBlockOverlapOpen(false);
          pendingOverviewBlockRef.current = null;
        }}
        onConfirm={() => {
          const draft = pendingOverviewBlockRef.current;
          pendingOverviewBlockRef.current = null;
          setBlockOverlapOpen(false);
          if (!draft) return;
          void persistOverviewBlockedTime(draft);
        }}
      />
      <CalendarScheduleConflictDialog
        open={staffConflictOpen}
        kind={
          staffConflictOpen
            ? ("staff_double_book" satisfies CalendarScheduleConflictKind)
            : null
        }
        messageOverride={staffConflictMessage}
        onClose={() => {
          setStaffConflictOpen(false);
          setStaffConflictMessage(null);
          staffConflictAckRef.current = false;
        }}
        onConfirm={() => {
          staffConflictAckRef.current = true;
          setStaffConflictOpen(false);
          setStaffConflictMessage(null);
          void persistBookingFromDrawer().then((saved) => {
            if (saved) closeBookingDrawer();
          });
        }}
      />
    </>
  );
}
