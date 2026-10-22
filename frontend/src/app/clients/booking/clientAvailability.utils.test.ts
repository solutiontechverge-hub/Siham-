/**
 * Run with (from frontend/):
 *   $env:NODE_PATH=(Resolve-Path .\node_modules).Path; npx --yes tsx src/app/clients/booking/clientAvailability.utils.test.ts
 */
import assert from "node:assert/strict";
import {
  FIXED_LOCATION_MAX_DISTINCT_TEAM_MEMBERS,
  autoAssignServicesByAvailability,
  filterMembersNotOnLeave,
  filterServicesOfferedByAvailableMembers,
  isMemberOnLeave,
  memberBookedPercent,
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
  // Blanks stay null — backend createBooking owns free-TM fill.
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members, {}),
    services: fourServices,
    candidateMemberIds: ["a", "b", "c", "d"],
    fallbackCatalogIds: ["s1", "s2", "s3", "s4"],
    startMin: 10 * 60,
  });
  assert.equal(
    assigned.every((row) => (row.teamMemberId ?? null) === null),
    true,
    "FL multi leaves blanks null for backend",
  );
  assert.ok(
    FIXED_LOCATION_MAX_DISTINCT_TEAM_MEMBERS >= 1,
    "cap constant still exported",
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
  // Blank row: frontend does not invent a free peer (backend does).
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members.slice(0, 2), {
      a: [{ startMin: 10 * 60, endMin: 11 * 60 }],
    }),
    services: [{ id: "1", catalogServiceId: "s1", durationMins: 60 }],
    candidateMemberIds: ["a", "b"],
    fallbackCatalogIds: ["s1"],
    startMin: 10 * 60,
  });
  assert.equal(
    assigned[0]?.teamMemberId ?? null,
    null,
    "blank stays null even when a free peer exists",
  );
}

{
  // Pre-stamped busy TM must clear; frontend does not swap in another TM.
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
    assigned[0]?.teamMemberId ?? null,
    null,
    "combine: busy pre-assign cleared to null",
  );
  assert.equal(
    assigned[1]?.teamMemberId ?? null,
    null,
    "combine: both cleared when shared pick is busy",
  );
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
  assert.equal(
    assigned.every((row) => (row.teamMemberId ?? null) === null),
    true,
    "DL shared mode leaves blanks null for backend",
  );
}

{
  // Keep free picks; blank 4th stays null (no frontend cap-fill).
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
  assert.equal(assigned[0]?.teamMemberId, "a");
  assert.equal(assigned[1]?.teamMemberId, "b");
  assert.equal(assigned[2]?.teamMemberId, "c");
  assert.equal(
    assigned[3]?.teamMemberId ?? null,
    null,
    "blank 4th stays null for backend",
  );
}

{
  // Optional per-service pick: keep free client choice; leave blanks for backend.
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(members.slice(0, 3), {
      a: [{ startMin: 10 * 60, endMin: 11 * 60 }],
    }),
    services: [
      {
        id: "1",
        catalogServiceId: "s1",
        durationMins: 30,
        teamMemberId: "b",
      },
      { id: "2", catalogServiceId: "s2", durationMins: 30 },
    ],
    candidateMemberIds: ["a", "b", "c"],
    fallbackCatalogIds: ["s1", "s2"],
    startMin: 10 * 60,
  });
  assert.equal(assigned[0]?.teamMemberId, "b", "keep free client pick");
  assert.equal(
    assigned[1]?.teamMemberId ?? null,
    null,
    "blank service stays null for backend assign",
  );
}

{
  // Combine + multi-person: keep a TM who only performs that row's service.
  // (canPerformAll used to wipe Guest eyelash when CLIENT also has other services.)
  const specialist = [
    { id: "aliza", name: "aliza", assignedServiceIds: ["eyelash"] },
    { id: "saad", name: "saad", assignedServiceIds: ["s1", "eyelash"] },
  ];
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(specialist, {}),
    services: [
      {
        id: "client-s1",
        catalogServiceId: "s1",
        durationMins: 1,
        teamMemberId: null,
      },
      {
        id: "guest-lash",
        catalogServiceId: "eyelash",
        durationMins: 11,
        teamMemberId: "aliza",
      },
    ],
    candidateMemberIds: ["aliza", "saad"],
    fallbackCatalogIds: ["s1", "eyelash"],
    startMin: 9 * 60,
    assignOneMemberForAll: true,
    sharedWindowMins: 11,
  });
  assert.equal(
    assigned[1]?.teamMemberId,
    "aliza",
    "combine: keep specialist pick for that service",
  );
  assert.equal(
    assigned[0]?.teamMemberId ?? null,
    null,
    "combine: blank sibling stays null",
  );
}

{
  // Guest path: skill id-space mismatch must not wipe a free explicit pick.
  // (assignedServiceIds often use a different UUID than row.catalogServiceId.)
  const specialist = [
    {
      id: "aliza",
      name: "aliza",
      assignedServiceIds: ["other-skill-uuid"],
    },
  ];
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(specialist, {}),
    services: [
      {
        id: "guest-lash",
        catalogServiceId: "eyelash-catalog-uuid",
        durationMins: 11,
        teamMemberId: "aliza",
      },
    ],
    candidateMemberIds: ["aliza"],
    fallbackCatalogIds: ["eyelash-catalog-uuid"],
    startMin: 9 * 60,
    assignOneMemberForAll: true,
    sharedWindowMins: 11,
  });
  assert.equal(
    assigned[0]?.teamMemberId,
    "aliza",
    "combine: keep free Guest pick even when skill ids do not match",
  );
}

{
  // Duplicate catalog line ids (CLIENT + Guest): keep each pick by index.
  const roster = [
    { id: "aliza", name: "aliza", assignedServiceIds: ["eyelash"] },
  ];
  const assigned = autoAssignServicesByAvailability({
    snapshot: makeSnapshot(roster, {}),
    services: [
      {
        id: "lash",
        catalogServiceId: "eyelash",
        durationMins: 11,
        teamMemberId: null,
      },
      {
        id: "lash",
        catalogServiceId: "eyelash",
        durationMins: 11,
        teamMemberId: "aliza",
      },
    ],
    candidateMemberIds: ["aliza"],
    fallbackCatalogIds: ["eyelash"],
    startMin: 9 * 60,
    assignOneMemberForAll: true,
    sharedWindowMins: 11,
  });
  assert.equal(assigned[0]?.teamMemberId ?? null, null);
  assert.equal(
    assigned[1]?.teamMemberId,
    "aliza",
    "combine: duplicate ids keep Guest pick at its index",
  );
}

{
  const leaveOnly: SetupAvailabilitySnapshot = {
    date: DATE,
    location: "FL",
    slotStepMinutes: 15,
    scheduleAvailability: [],
    dateOverrides: [openOverride("b")],
    teamMembers: [
      { id: "a", name: "A", assignedServiceIds: ["s1"] },
      { id: "b", name: "B", assignedServiceIds: ["s2"] },
    ],
    busyByMember: {},
  };
  assert.equal(isMemberOnLeave(leaveOnly, "a"), true);
  assert.equal(isMemberOnLeave(leaveOnly, "b"), false);
  assert.deepEqual(
    filterMembersNotOnLeave(
      [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
      leaveOnly,
    ).map((m) => m.id),
    ["b"],
    "hide leave TMs from roster",
  );
  const kept = filterServicesOfferedByAvailableMembers(
    [
      { id: "s1", name: "Cut" },
      { id: "s2", name: "Color" },
    ],
    leaveOnly,
    ["a", "b"],
    ["s1", "s2"],
  );
  assert.deepEqual(
    kept.map((s) => s.id),
    ["s2"],
    "hide service when only leave TM offers it",
  );
  assert.equal(
    memberBookedPercent(leaveOnly, "a"),
    null,
    "no hours → null (empty track, no fake %)",
  );
  assert.equal(
    memberBookedPercent(leaveOnly, "b"),
    0,
    "hours + no busy → 0%",
  );
}

{
  // 09:00–17:00 = 480 mins; 120 busy → 25%
  const partial = makeSnapshot(
    [{ id: "a", name: "A", assignedServiceIds: ["s1"] }],
    { a: [{ startMin: 9 * 60, endMin: 11 * 60 }] },
  );
  assert.equal(memberBookedPercent(partial, "a"), 25);
}

console.log("clientAvailability.utils.test.ts: ok");
