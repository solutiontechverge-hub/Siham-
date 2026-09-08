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

const companyContactDraft: ClientBookingDraft = {
  ...draft,
  people: [
    { id: "p-requester", name: "Company Legal", isRequester: true },
    { id: "contact-1", name: "Contact Person" },
    { id: "model-1", name: "Ayesha", participantType: "model" },
  ],
  services: [
    {
      id: "svc-contact",
      name: "Company service",
      durationMins: 30,
      price: 40,
      guestId: "contact-1",
    },
    {
      id: "svc-empty",
      name: "Unassigned service",
      durationMins: 15,
      price: 10,
      guestId: "",
    },
    {
      id: "svc-model",
      name: "Nail art",
      durationMins: 15,
      price: 30,
      guestId: "model-1",
    },
  ],
};
const companySections = buildBookingSummarySections(companyContactDraft);
const companyRequester = companySections.find(
  (section) => section.participantType === "requester",
);
const companyModel = companySections.find(
  (section) => section.participantType === "model",
);
assert.equal(
  companyRequester?.items.some((item) => item.id === "svc-contact"),
  true,
);
assert.equal(
  companyRequester?.items.some((item) => item.id === "svc-empty"),
  true,
);
assert.equal(
  companyModel?.items.some((item) => item.id === "svc-model"),
  true,
);
assert.equal(
  companySections.some(
    (section) =>
      section.participantType === "guest" &&
      section.participantId === "contact-1",
  ),
  false,
);
assert.equal(companyModel?.title, "Ayesha");

const sharedCatalogDraft: ClientBookingDraft = {
  ...draft,
  combineServices: true,
  people: [
    { id: "p-requester", name: "alizaCompany", isRequester: true },
    { id: "model-1", name: "ali", participantType: "model" },
    { id: "model-2", name: "umer", participantType: "model" },
  ],
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: null,
    },
    {
      id: "svc-lash",
      name: "eyelash",
      durationMins: 11,
      price: 111,
      guestId: null,
    },
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: "model-1",
    },
    {
      id: "svc-lash",
      name: "eyelash",
      durationMins: 11,
      price: 111,
      guestId: "model-1",
    },
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: "model-2",
    },
    {
      id: "svc-lash",
      name: "eyelash",
      durationMins: 11,
      price: 111,
      guestId: "model-2",
    },
  ],
  products: [
    {
      id: "prod-hrr",
      name: "hrr",
      price: 2,
      quantity: 1,
      guestId: null,
    },
  ],
};
const sharedSections = buildBookingSummarySections(sharedCatalogDraft);
const sharedRequester = sharedSections.find(
  (section) => section.participantType === "requester",
);
const sharedModels = sharedSections.filter(
  (section) => section.participantType === "model",
);
assert.equal(sharedRequester?.items.length, 2);
assert.equal(
  sharedRequester?.items.some((item) => item.name === "Muhammad umer arshad"),
  true,
);
assert.equal(
  sharedRequester?.items.some((item) => item.name === "eyelash"),
  true,
);
assert.equal(sharedModels.length, 2);
assert.equal(sharedModels[0]?.title, "ali");
assert.equal(sharedModels[1]?.title, "umer");
assert.equal(sharedModels[0]?.items.length, 2);
assert.equal(sharedModels[1]?.items.length, 2);

const duplicatedRequesterDraft: ClientBookingDraft = {
  ...draft,
  combineServices: true,
  people: [
    { id: "p-requester", name: "alizaCompany", isRequester: true },
    { id: "contact-1", name: "umer" },
  ],
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: null,
      startTime: "12:00 AM",
    },
    {
      id: "svc-lash",
      name: "eyelash",
      durationMins: 11,
      price: 111,
      guestId: null,
      startTime: "12:00 AM",
    },
    {
      id: "profile-svc-svc-umar-0",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: "p-requester",
      startTime: "1:00 AM",
    },
    {
      id: "profile-svc-svc-lash-1",
      name: "eyelash",
      durationMins: 11,
      price: 111,
      guestId: "contact-1",
      startTime: "2:00 AM",
    },
  ],
};
const duplicatedSections = buildBookingSummarySections(duplicatedRequesterDraft);
const duplicatedRequester = duplicatedSections.find(
  (section) => section.participantType === "requester",
);
assert.equal(duplicatedRequester?.items.length, 2);

console.log("buildBookingSummarySections.test.ts: all assertions passed");
