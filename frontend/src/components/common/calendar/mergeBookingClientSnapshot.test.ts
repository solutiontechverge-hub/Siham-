/**
 * Run with: npx --yes tsx src/components/common/calendar/mergeBookingClientSnapshot.test.ts
 */
import assert from "node:assert/strict";
import {
  mergeBookingClientSnapshots,
  slimClientSnapshotForLocationDetails,
} from "./mergeBookingClientSnapshot";

const notesThin = {
  people: [{ id: "p-requester", name: "Client", isRequester: true as const }],
  services: [
    { id: "svc-1", name: "lash", price: 10, durationMins: 15, guestId: null },
  ],
};

const locationRich = {
  people: [
    { id: "p-requester", name: "Client", isRequester: true as const },
    { id: "model-1", name: "Ayesha", participantType: "model" as const },
    {
      id: "p-planning",
      name: "Planning",
      participantType: "planning" as const,
      planningActivity: "Prep",
      planningDuration: "30 mins",
      planningStartTime: "9:00 AM",
      planningEndTime: "9:30 AM",
    },
  ],
  services: [
    { id: "svc-1", name: "lash", price: 10, durationMins: 15, guestId: null },
    {
      id: "svc-2",
      name: "brow",
      price: 20,
      durationMins: 20,
      guestId: "model-1",
    },
  ],
};

const merged = mergeBookingClientSnapshots(notesThin, locationRich);
assert.equal(
  (merged?.people ?? []).some((p) => p.participantType === "model"),
  true,
);
assert.equal(
  (merged?.people ?? []).some((p) => p.participantType === "planning"),
  true,
);
assert.equal(
  (merged?.services ?? []).some((s) => s.guestId === "model-1"),
  true,
);

const slim = slimClientSnapshotForLocationDetails({
  ...locationRich,
  projectDetails: {
    description: "hello",
    uploads: [{ id: "u1", name: "a.jpg", url: "https://x/a.jpg" }],
  },
});
assert.equal(slim.projectDetails?.uploads.length, 0);
assert.equal(slim.projectDetails?.description, "hello");
assert.equal((slim.people ?? []).length, 3);

console.log("mergeBookingClientSnapshot.test.ts: all assertions passed");
