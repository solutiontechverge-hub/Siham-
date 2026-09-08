/**
 * Run with: npx --yes tsx src/components/common/calendar/buildActivityComparison.test.ts
 */
import assert from "node:assert/strict";
import { buildActivityComparison } from "./buildActivityComparison";

const guestRename = buildActivityComparison({
  mode: "er",
  originalGuestNames: ["Ali"],
  newGuestNames: ["umerarshad"],
});

assert.ok(guestRename);
assert.equal(guestRename.mode, "er");
assert.equal(guestRename.baselineCaption, "Original Confirmed booking");
assert.equal(guestRename.proposedCaption, "Proposed changes");
assert.equal(guestRename.rows.length, 1);
assert.deepEqual(guestRename.rows[0], {
  id: "guests",
  label: "Guest names",
  originalValue: "Ali",
  newValue: "umerarshad",
  changeKind: "changed",
});

const addedGuest = buildActivityComparison({
  mode: "er",
  originalGuestNames: [],
  newGuestNames: ["umerarshad"],
});
assert.equal(addedGuest?.rows[0]?.label, "Guest names");
assert.equal(addedGuest?.rows[0]?.originalValue, "—");
assert.equal(addedGuest?.rows[0]?.newValue, "umerarshad");
assert.equal(addedGuest?.rows[0]?.changeKind, "added");

const serviceEdit = buildActivityComparison({
  mode: "er",
  originalServices: [
    {
      id: "cut",
      name: "Haircut",
      price: 45,
      durationMins: 45,
      startTime: "10:00",
      endTime: "10:45",
    },
  ],
  currentServices: [
    {
      id: "cut",
      name: "Haircut",
      price: 55,
      durationMins: 60,
      startTime: "10:00",
      endTime: "11:00",
    },
  ],
  editedServiceIds: ["cut"],
});
assert.equal(serviceEdit?.rows[0]?.label, "Haircut");
assert.equal(
  serviceEdit?.rows[0]?.originalValue,
  "Haircut · 45 min · 45.00 EUR · 10:00–10:45",
);
assert.equal(
  serviceEdit?.rows[0]?.newValue,
  "Haircut · 60 min · 55.00 EUR · 10:00–11:00",
);
assert.equal(serviceEdit?.rows[0]?.changeKind, "changed");

const removedService = buildActivityComparison({
  mode: "er",
  originalServices: [
    { id: "cut", name: "Haircut", price: 45, durationMins: 45 },
  ],
  currentServices: [],
  cancelledServiceIds: ["cut"],
});
assert.equal(removedService?.rows[0]?.label, "Haircut");
assert.equal(removedService?.rows[0]?.newValue, "—");
assert.equal(removedService?.rows[0]?.changeKind, "removed");

console.log("buildActivityComparison.test.ts passed");
