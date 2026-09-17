/**
 * Run with:
 * npx --yes tsx src/components/common/calendar/ProfessionalFixedLocationCalendar/useProfessionalFixedLocationCalendar.helpers.staffAssign.test.ts
 */
import assert from "node:assert/strict";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import { assignStaffToPickedServices } from "./useProfessionalFixedLocationCalendar.helpers.staffAssign";

type Interval = { startMin: number; endMin: number };

function line(
  partial: Partial<BookingServiceLineItem> & Pick<BookingServiceLineItem, "id">,
): BookingServiceLineItem {
  return {
    name: partial.name ?? partial.id,
    price: 10,
    durationMins: 60,
    ...partial,
  };
}

/** All members free; pick order = occupancy rank (ali lowest). */
function makePicker(order: readonly string[]) {
  const calls: Array<{
    startMin: number;
    avoid?: readonly string[];
    only?: readonly string[];
    extraBusy?: ReadonlyMap<string, readonly Interval[]>;
  }> = [];
  const pickMostAvailableTeamMemberId = (
    _dateIso: string,
    startMin: number,
    durationMins: number,
    extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>,
    options?: {
      preferMemberIds?: readonly string[];
      avoidMemberIds?: readonly string[];
      onlyMemberIds?: readonly string[];
    },
  ): string => {
    calls.push({
      startMin,
      avoid: options?.avoidMemberIds,
      only: options?.onlyMemberIds,
      extraBusy: extraBusyByMember,
    });
    const endMin = startMin + durationMins;
    const avoid = new Set((options?.avoidMemberIds ?? []).map(String));
    const only = options?.onlyMemberIds?.length
      ? new Set(options.onlyMemberIds.map(String))
      : null;
    const pool = only
      ? order.filter((id) => only.has(id))
      : [...order];
    const isFree = (id: string) => {
      const busy = extraBusyByMember?.get(id) ?? [];
      return !busy.some(
        (interval) => startMin < interval.endMin && endMin > interval.startMin,
      );
    };
    const freeOther = pool.find((id) => !avoid.has(id) && isFree(id));
    if (freeOther) return freeOther;
    const free = pool.find(isFree);
    if (free) return free;
    return pool[0] ?? "";
  };
  return { pickMostAvailableTeamMemberId, calls };
}

{
  const { pickMostAvailableTeamMemberId, calls } = makePicker([
    "ali",
    "bob",
    "cara",
  ]);
  const picked = [
    line({ id: "s1", startTime: "10:45", durationMins: 11 }),
    line({ id: "s2", startTime: "10:56", durationMins: 60 }),
    line({ id: "s3", startTime: "11:56", durationMins: 60 }),
  ];
  assignStaffToPickedServices({
    pickedServices: picked,
    currentServices: [],
    dateIso: "2026-09-15",
    slotStart: "10:45",
    slotLocation: "FL",
    resourceCount: 3,
    pickMostAvailableTeamMemberId,
  });
  assert.equal(picked[0].staffResourceId, "ali");
  assert.equal(picked[1].staffResourceId, "bob");
  assert.equal(picked[2].staffResourceId, "cara");
  assert.deepEqual(calls[1]?.avoid, ["ali"]);
  assert.deepEqual(calls[2]?.avoid, ["ali", "bob"]);
}

{
  const { pickMostAvailableTeamMemberId } = makePicker(["ali", "bob", "cara"]);
  const picked = [
    line({ id: "s2", startTime: "10:56", durationMins: 60 }),
  ];
  assignStaffToPickedServices({
    pickedServices: picked,
    currentServices: [],
    draftSiblingServices: [
      line({
        id: "s1",
        startTime: "10:45",
        durationMins: 11,
        staffResourceId: "ali",
      }),
    ],
    dateIso: "2026-09-15",
    slotStart: "10:45",
    slotLocation: "FL",
    resourceCount: 3,
    pickMostAvailableTeamMemberId,
  });
  assert.equal(
    picked[0].staffResourceId,
    "bob",
    "draft sibling busy + spread should skip ali when bob is free",
  );
}

{
  const { pickMostAvailableTeamMemberId } = makePicker(["ali", "bob"]);
  const picked = [
    line({ id: "s1", startTime: "10:00", durationMins: 30 }),
    line({ id: "s2", startTime: "10:30", durationMins: 30 }),
  ];
  assignStaffToPickedServices({
    pickedServices: picked,
    currentServices: [],
    dateIso: "2026-09-15",
    slotStart: "10:00",
    slotLocation: "DL",
    resourceCount: 2,
    pickMostAvailableTeamMemberId,
  });
  assert.equal(picked[0].staffResourceId, "ali");
  assert.equal(picked[1].staffResourceId, "ali");
}

console.log("staffAssign tests passed");
