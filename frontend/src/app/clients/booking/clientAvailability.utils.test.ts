/**
 * Run with (from frontend/):
 *   $env:NODE_PATH=(Resolve-Path .\node_modules).Path; npx --yes tsx src/app/clients/booking/clientAvailability.utils.test.ts
 */
import assert from "node:assert/strict";
import {
  FIXED_LOCATION_MAX_DISTINCT_TEAM_MEMBERS,
  autoAssignServicesByAvailability,
  type SetupAvailabilitySnapshot,
} from "./clientAvailability.utils";

const DATE = "2026-09-14";

function openOverride(memberId: string): SetupAvailabilitySnapshot["dateOverrides"][number] {
  return {
    id: `ov-${memberId}`,
    resourceId: memberId,
    date: DATE,
    locations: ["FL"],
    shifts: [{ start: "09:00", end: "17:00" }],
  };
}

function makeSnapshot(
  teamMembers: SetupAvailabilitySnapshot["teamMembers"],
  busyByMember: SetupAvailabilitySnapshot["busyByMember"],
): SetupAvailabilitySnapshot {
  return {
    date: DATE,
    location: "FL",
    slotStepMinutes: 15,
    scheduleAvailability: [],
    dateOverrides: teamMembers.map((m) => openOverride(m.id)),
    teamMembers,
    busyByMember,
  };
}

const members = [
  { id: "a", name: "A", assignedServiceIds: ["s1", "s2", "s3", "s4"] },
  { id: "b", name: "B", assignedServiceIds: ["s1", "s2", "s3", "s4"] },
  { id: "c", name: "C", assignedServiceIds: ["s1", "s2", "s3", "s4"] },
  { id: "d", name: "D", assignedServiceIds: ["s1", "s2", "s3", "s4"] },
];

const fourServices = [
  { id: "1", catalogServiceId: "s1", durationMins: 30 },
  { id: "2", catalogServiceId: "s2", durationMins: 30 },
  { id: "3", catalogServiceId: "s3", durationMins: 30 },
  { id: "4", catalogServiceId: "s4", durationMins: 30 },
];

{
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members, {}),
    services: fourServices,
    candidateMemberIds: ["a", "b", "c", "d"],
    fallbackCatalogIds: ["s1", "s2", "s3", "s4"],
    startMin: 10 * 60,
  });
  const distinct = new Set(
    assigned.map((row) => row.teamMemberId).filter(Boolean),
  );
  assert.equal(
    distinct.size <= FIXED_LOCATION_MAX_DISTINCT_TEAM_MEMBERS,
    true,
    "FL multi must cap distinct members at 3",
  );
  assert.equal(
    assigned.every((row) => row.teamMemberId),
    true,
    "FL multi must assign every service when candidates exist",
  );
}

{
  // Nobody free at 10:00 — must not assign a blocked/busy TM.
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members.slice(0, 3), {
      a: [{ startMin: 9 * 60, endMin: 17 * 60 }],
      b: [
        { startMin: 9 * 60, endMin: 12 * 60 },
        { startMin: 10 * 60, endMin: 11 * 60 },
      ],
      c: [{ startMin: 10 * 60, endMin: 11 * 60 }],
    }),
    services: [{ id: "1", catalogServiceId: "s1", durationMins: 60 }],
    candidateMemberIds: ["a", "b", "c"],
    fallbackCatalogIds: ["s1"],
    startMin: 10 * 60,
  });
  assert.equal(
    assigned[0]?.teamMemberId,
    null,
    "when nobody free, leave unassigned (do not pick blocked TM)",
  );
}

{
  // Blocked member excluded; free peer is chosen.
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members.slice(0, 2), {
      a: [{ startMin: 10 * 60, endMin: 11 * 60 }],
    }),
    services: [{ id: "1", catalogServiceId: "s1", durationMins: 60 }],
    candidateMemberIds: ["a", "b"],
    fallbackCatalogIds: ["s1"],
    startMin: 10 * 60,
  });
  assert.equal(assigned[0]?.teamMemberId, "b", "assign free TM when peer is blocked");
}

{
  // Pre-stamped busy TM must not stick when Combine Services shares one window.
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members.slice(0, 2), {
      a: [{ startMin: 9 * 60, endMin: 12 * 60 }],
    }),
    services: [
      {
        id: "1",
        catalogServiceId: "s1",
        durationMins: 15,
        teamMemberId: "a",
      },
      {
        id: "2",
        catalogServiceId: "s2",
        durationMins: 15,
        teamMemberId: "a",
      },
    ],
    candidateMemberIds: ["a", "b"],
    fallbackCatalogIds: ["s1", "s2"],
    startMin: 9 * 60,
    assignOneMemberForAll: true,
    sharedWindowMins: 15,
  });
  assert.equal(
    assigned[0]?.teamMemberId,
    "b",
    "combine: busy pre-assign cleared, free peer used",
  );
  assert.equal(assigned[1]?.teamMemberId, "b", "combine: both services share free TM");
}

{
  // Member with no working hours (empty overrides) must not be auto-assigned.
  const noSchedule = makeSnapshot(
    [{ id: "a", name: "A", assignedServiceIds: ["s1"] }],
    {},
  );
  noSchedule.dateOverrides = [];
  const assigned = autoAssignServicesByAvailability({
    snapshot: noSchedule,
    services: [
      { id: "1", catalogServiceId: "s1", durationMins: 15, teamMemberId: "a" },
    ],
    candidateMemberIds: ["a"],
    fallbackCatalogIds: ["s1"],
    startMin: 9 * 60,
  });
  assert.equal(
    assigned[0]?.teamMemberId,
    null,
    "no-schedule member must not stay auto-assigned",
  );
}

{
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members, {}),
    services: fourServices,
    candidateMemberIds: ["a", "b", "c", "d"],
    fallbackCatalogIds: ["s1", "s2", "s3", "s4"],
    startMin: 10 * 60,
    assignOneMemberForAll: true,
  });
  const ids = assigned.map((row) => row.teamMemberId);
  assert.equal(new Set(ids).size, 1, "DL stays single shared member");
  assert.ok(ids[0], "DL assigns a member when free");
}

{
  // Cap reuse: with 3 already used and a 4th service, stay within those 3.
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members, {}),
    services: [
      { id: "1", catalogServiceId: "s1", durationMins: 30, teamMemberId: "a" },
      { id: "2", catalogServiceId: "s2", durationMins: 30, teamMemberId: "b" },
      { id: "3", catalogServiceId: "s3", durationMins: 30, teamMemberId: "c" },
      { id: "4", catalogServiceId: "s4", durationMins: 30 },
    ],
    candidateMemberIds: ["a", "b", "c", "d"],
    fallbackCatalogIds: ["s1", "s2", "s3", "s4"],
    startMin: 10 * 60,
  });
  assert.ok(
    assigned[3]?.teamMemberId &&
      ["a", "b", "c"].includes(assigned[3].teamMemberId),
    "4th service must stay within existing 3",
  );
  assert.equal(
    new Set(assigned.map((r) => r.teamMemberId)).has("d"),
    false,
    "must not introduce a 4th distinct member",
  );
}

console.log("clientAvailability.utils.test.ts: ok");
