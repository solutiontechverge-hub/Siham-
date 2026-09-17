/**
 * Run with: npx --yes tsx src/components/common/calendar/teamMemberBookings.rank.test.ts
 */
import assert from "node:assert/strict";
import { rankResourcesForCalendarDay } from "./teamMemberBookings";

const resources = [
  { id: "umer", name: "Umer" },
  { id: "ali", name: "ali" },
  { id: "aliza", name: "aliza" },
  { id: "hama", name: "hama" },
] as const;

const occupancy: Record<string, number> = {
  umer: 0,
  ali: 0.3,
  aliza: 0.27,
  hama: 0.17,
};

const ranked = rankResourcesForCalendarDay(
  resources,
  (id) => occupancy[id] ?? 0,
);
assert.deepEqual(
  ranked.map((r) => r.id),
  ["ali", "aliza", "hama", "umer"],
);

const allFree = rankResourcesForCalendarDay(resources, () => 0);
assert.deepEqual(
  allFree.map((r) => r.id),
  ["ali", "aliza", "hama", "umer"],
);

const tiedBusy = rankResourcesForCalendarDay(resources, (id) =>
  id === "umer" ? 0 : 0.25,
);
assert.deepEqual(
  tiedBusy.map((r) => r.id),
  ["ali", "aliza", "hama", "umer"],
);

console.log("teamMemberBookings.rank.test.ts passed");
