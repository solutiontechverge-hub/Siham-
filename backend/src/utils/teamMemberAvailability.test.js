/**
 * Run with: node src/utils/teamMemberAvailability.test.js
 */
import assert from "node:assert/strict";
import {
  intervalsOverlap,
  pickFreeTeamMemberId,
  wallClockDateFromValue,
  wallClockTimeToMinutes,
} from "./teamMemberAvailability.js";

assert.equal(wallClockTimeToMinutes("2026-10-15T09:00:00"), 9 * 60);
assert.equal(wallClockTimeToMinutes("2026-10-15T09:30:00.000Z"), 9 * 60 + 30);
assert.equal(wallClockTimeToMinutes("2026-10-15 09:15:00"), 9 * 60 + 15);
assert.equal(wallClockTimeToMinutes("09:45"), 9 * 60 + 45);
assert.equal(wallClockTimeToMinutes(null), null);

// pg now returns timestamptz as strings; Date path still accepts local wall-clock.
const local = new Date(2026, 9, 15, 9, 30, 0);
assert.equal(wallClockTimeToMinutes(local), 9 * 60 + 30);
assert.equal(wallClockDateFromValue(local), "2026-10-15");
assert.equal(
  wallClockTimeToMinutes("2026-10-15T09:00:00.000Z"),
  9 * 60,
  "ISO string wall-clock (not local-shifted Date)",
);

assert.equal(
  intervalsOverlap(
    { startMin: 9 * 60, endMin: 9 * 60 + 30 },
    { startMin: 9 * 60 + 15, endMin: 10 * 60 },
  ),
  true,
);
assert.equal(
  intervalsOverlap(
    { startMin: 9 * 60, endMin: 9 * 60 + 30 },
    { startMin: 9 * 60 + 30, endMin: 10 * 60 },
  ),
  false,
);

{
  // pickFreeTeamMemberId: skips busy + provisional, respects assigned_services.
  const members = [
    { id: "busy", assigned_services: ["svc-1"] },
    { id: "wrong-skill", assigned_services: ["other"] },
    { id: "free", assigned_services: ["svc-1"] },
  ];
  const queryFn = async (sql, params) => {
    if (String(sql).includes("business_team_members")) {
      return { rows: members };
    }
    // isTeamMemberBusyInWindow bookings query
    if (String(sql).includes("FROM bookings")) {
      const memberId = params[2];
      if (memberId === "busy") {
        return {
          rows: [{ start_time: "2026-10-15T10:00:00", end_time: "2026-10-15T11:00:00" }],
        };
      }
      return { rows: [] };
    }
    return { rows: [] };
  };
  const picked = await pickFreeTeamMemberId(queryFn, {
    professionalProfileId: "prof-1",
    businessSetupId: "setup-1",
    date: "2026-10-15",
    startMin: 10 * 60,
    endMin: 10 * 60 + 30,
    serviceId: "svc-1",
    provisionalBusy: {},
  });
  assert.equal(picked, "free", "skips busy and wrong-skill members");
}

console.log("teamMemberAvailability.test.js: ok");
