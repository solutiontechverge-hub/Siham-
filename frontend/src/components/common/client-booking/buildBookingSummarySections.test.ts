/**
 * Run with: npx --yes tsx src/components/common/client-booking/buildBookingSummarySections.test.ts
 */
import assert from "node:assert/strict";
import {
  bookingParticipantDisplayHeading,
  buildBookingSummarySections,
  planningScheduleMeta,
} from "./buildBookingSummarySections";
import type { ClientBookingDraft } from "./types";

const draft: ClientBookingDraft = {
  selectedDateISO: "2026-09-07",
  selectedTime: "10:00 AM",
  combineServices: false,
  total: 200,
  people: [
    { id: "p-requester", name: "Client Co", isRequester: true },
    { id: "guest-1", name: "Sara Guest", participantType: "guest" },
    { id: "model-1", name: "Ayesha", participantType: "model" },
    {
      id: "p-planning",
      name: "Planning",
      participantType: "planning",
      planningActivity: "Look prep",
      planningDuration: "30 mins",
    },
    {
      id: "p-buffer",
      name: "Prep hold",
      participantType: "buffer",
      bufferStartTime: "11:00 AM",
      bufferEndTime: "11:15 AM",
    },
  ],
  services: [
    {
      id: "svc-main",
      name: "Face makeup",
      durationMins: 30,
      price: 80,
      guestId: null,
    },
    {
      id: "svc-guest",
      name: "Hair style",
      durationMins: 20,
      price: 40,
      guestId: "guest-1",
    },
    {
      id: "svc-model",
      name: "Nail art",
      durationMins: 15,
      price: 30,
      guestId: "model-1",
    },
  ],
  products: [
    {
      id: "prod-guest",
      name: "Guest kit",
      price: 12,
      quantity: 1,
      guestId: "guest-1",
    },
  ],
};

const sections = buildBookingSummarySections(draft);
const types = sections.map((section) => section.participantType);

assert.equal(types.includes("requester"), true);
assert.equal(types.includes("guest"), true);
assert.equal(types.includes("planning"), true);
assert.equal(types.includes("model"), true);

assert.equal(types.includes("buffer"), true);

assert.deepEqual(types, ["requester", "guest", "model", "planning", "buffer"]);

const guestSection = sections.find((section) => section.participantType === "guest");
assert.equal(guestSection?.title.includes("Sara") || guestSection?.title === "Sara Guest", true);
assert.equal(guestSection?.items.some((item) => item.id === "svc-guest"), true);

const planningSection = sections.find(
  (section) => section.participantType === "planning",
);
assert.equal(planningSection?.planningItem?.activity, "Look prep");
assert.equal(
  bookingParticipantDisplayHeading(guestSection!),
  "Guest",
);
assert.equal(
  bookingParticipantDisplayHeading(
    sections.find((section) => section.participantType === "model")!,
  ),
  "Model",
);
assert.equal(
  bookingParticipantDisplayHeading(planningSection!),
  "Planning Details",
);

const bufferSection = sections.find(
  (section) => section.participantType === "buffer",
);
assert.equal(
  bookingParticipantDisplayHeading(bufferSection!),
  "Buffer",
);
const bufferMeta = planningScheduleMeta(bufferSection!);
assert.equal(Boolean(bufferMeta.timeRange), true);
assert.equal(bufferMeta.durationLabel, "15 Mins");

const planningMeta = planningScheduleMeta(planningSection!);
assert.equal(Boolean(planningMeta.timeRange), true);
assert.equal(planningMeta.durationLabel, "30 Mins");

const requesterItems =
  sections.find((section) => section.participantType === "requester")?.items ??
  [];
assert.equal(
  requesterItems.some((item) => item.id === "svc-main"),
  true,
);

const duplicatePlanningDraft: ClientBookingDraft = {
  ...draft,
  people: [
    ...(draft.people ?? []),
    {
      id: "p-planning-dup-1",
      name: "Planning",
      participantType: "planning",
      planningActivity: "Look prep",
      planningDuration: "30 mins",
    },
    {
      id: "p-planning-dup-2",
      name: "Planning",
      participantType: "planning",
      planningActivity: "Look prep",
      planningDuration: "30 mins",
    },
  ],
};
const dedupedPlanning = buildBookingSummarySections(duplicatePlanningDraft).filter(
  (section) => section.participantType === "planning",
);
assert.equal(dedupedPlanning.length, 1);

console.log("buildBookingSummarySections.test.ts: all assertions passed");
