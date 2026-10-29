/**
 * Run with: npx --yes tsx src/components/common/calendar/buildActivityComparison.test.ts
 */
import assert from "node:assert/strict";
import {
  activityComparisonSectionHeading,
  buildActivityComparison,
  groupActivityComparisonSections,
} from "./buildActivityComparison";
import { flattenBookingServices } from "./bookingRequestNegotiation";

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
assert.equal(guestRename.rows[0]?.id, "guests");
assert.equal(guestRename.rows[0]?.section, "guest");
assert.equal(guestRename.rows[0]?.sectionLabel, "Guest umerarshad");

const addedGuest = buildActivityComparison({
  mode: "er",
  originalGuestNames: [],
  newGuestNames: ["umerarshad"],
});
assert.equal(addedGuest?.rows[0]?.label, "Guest names");
assert.equal(addedGuest?.rows[0]?.originalValue, "—");
assert.equal(addedGuest?.rows[0]?.newValue, "umerarshad");
assert.equal(addedGuest?.rows[0]?.changeKind, "added");
assert.equal(addedGuest?.rows[0]?.section, "guest");

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
  clientName: "alizaCompany",
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
assert.equal(serviceEdit?.rows[0]?.section, "main_client");
assert.equal(serviceEdit?.rows[0]?.sectionLabel, "alizaCompany");

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
assert.equal(removedService?.rows[0]?.section, "main_client");
assert.equal(removedService?.rows[0]?.sectionLabel, "Client");

// Requester-tagged guestId must land under Client — not Guest (screenshot bug).
const requesterTaggedClient = buildActivityComparison({
  mode: "er",
  clientName: "alizaCompany",
  originalServices: [
    {
      id: "lash",
      name: "eyelash",
      price: 111,
      durationMins: 11,
      startTime: "12:41",
      endTime: "12:52",
      guestId: "p-requester",
    },
    {
      id: "cut",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      startTime: "11:41",
      endTime: "12:41",
      guestId: "p-requester",
    },
  ],
  currentServices: [
    {
      id: "cut",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      startTime: "12:30",
      endTime: "13:30",
      guestId: "p-requester",
    },
  ],
  editedServiceIds: ["cut"],
  cancelledServiceIds: ["lash"],
  participants: [
    { id: "p-requester", name: "alizaCompany", isRequester: true },
    { id: "guest-1", name: "umer", participantType: "guest" },
  ],
});
assert.ok(requesterTaggedClient);
const requesterById = Object.fromEntries(
  (requesterTaggedClient?.rows ?? []).map((row) => [row.id, row]),
);
assert.equal(requesterById["service-removed-p-requester:lash"]?.section, "main_client");
assert.equal(requesterById["service-removed-p-requester:lash"]?.sectionLabel, "alizaCompany");
assert.equal(requesterById["service-edited-p-requester:cut"]?.section, "main_client");
assert.equal(requesterById["service-edited-p-requester:cut"]?.sectionLabel, "alizaCompany");
assert.equal(
  groupActivityComparisonSections(requesterTaggedClient!.rows).map((g) => g.label).join("|"),
  "alizaCompany",
);

const groupedByPerson = buildActivityComparison({
  mode: "er",
  clientName: "alizaCompany",
  originalServices: [
    { id: "main-cut", name: "Haircut", price: 40, durationMins: 30 },
    {
      id: "lash",
      name: "eyelash",
      price: 25,
      durationMins: 20,
      guestId: "guest-1",
    },
    {
      id: "model-blow",
      name: "Blow dry",
      price: 30,
      durationMins: 30,
      guestId: "model-1",
    },
    {
      id: "plan-note",
      name: "Consult",
      price: 0,
      durationMins: 15,
      guestId: "plan-1",
    },
  ],
  currentServices: [
    { id: "main-cut", name: "Haircut", price: 50, durationMins: 45 },
    {
      id: "model-blow",
      name: "Blow dry",
      price: 35,
      durationMins: 40,
      guestId: "model-1",
    },
  ],
  editedServiceIds: ["main-cut", "model-blow"],
  cancelledServiceIds: ["lash", "plan-note"],
  participants: [
    { id: "p-requester", name: "alizaCompany", isRequester: true },
    { id: "guest-1", name: "umer", participantType: "guest" },
    { id: "model-1", name: "Ayesha", participantType: "model" },
    { id: "plan-1", name: "Planning", participantType: "planning" },
  ],
});
assert.ok(groupedByPerson);
const byId = Object.fromEntries(
  (groupedByPerson?.rows ?? []).map((row) => [row.id, row]),
);
assert.equal(byId["service-edited-:main-cut"]?.section, "main_client");
assert.equal(byId["service-edited-:main-cut"]?.sectionLabel, "alizaCompany");
assert.equal(byId["service-removed-guest-1:lash"]?.section, "guest");
assert.equal(byId["service-removed-guest-1:lash"]?.sectionLabel, "Guest umer");
assert.equal(byId["service-edited-model-1:model-blow"]?.section, "model");
assert.equal(byId["service-edited-model-1:model-blow"]?.sectionLabel, "Ayesha");
assert.equal(byId["service-removed-plan-1:plan-note"]?.section, "planning");
assert.equal(byId["service-removed-plan-1:plan-note"]?.sectionLabel, "Planning");

const groups = groupActivityComparisonSections(groupedByPerson!.rows);
assert.deepEqual(
  groups.map((g) => g.label),
  ["alizaCompany", "Guest umer", "Ayesha", "Planning"],
);
assert.equal(groups.every((g) => g.rows.length > 0), true);

// Same catalog ids on client + guest — both removals and both edits must appear.
const dualPersonSameCatalog = buildActivityComparison({
  mode: "er",
  clientName: "alizaCompany",
  originalServices: [
    {
      id: "cut",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      startTime: "11:41",
      endTime: "12:41",
      guestId: "p-requester",
    },
    {
      id: "lash",
      name: "eyelash",
      price: 111,
      durationMins: 11,
      startTime: "12:41",
      endTime: "12:52",
      guestId: "p-requester",
    },
    {
      id: "cut",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      startTime: "11:41",
      endTime: "12:41",
      guestId: "guest-1",
    },
    {
      id: "lash",
      name: "eyelash",
      price: 111,
      durationMins: 11,
      startTime: "12:41",
      endTime: "12:52",
      guestId: "guest-1",
    },
  ],
  currentServices: [
    {
      id: "cut",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      startTime: "12:30",
      endTime: "13:30",
      guestId: "p-requester",
    },
    {
      id: "cut",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      startTime: "12:00",
      endTime: "13:00",
      guestId: "guest-1",
    },
  ],
  currentProducts: [{ id: "hrr", name: "hrr", price: 2, guestId: "p-requester" }],
  editedServiceIds: ["cut"],
  cancelledServiceIds: ["lash"],
  editedProductIds: ["hrr"],
  originalProducts: [],
  participants: [
    { id: "p-requester", name: "alizaCompany", isRequester: true },
    { id: "guest-1", name: "umer", participantType: "guest" },
  ],
});
assert.ok(dualPersonSameCatalog);
const dualById = Object.fromEntries(
  (dualPersonSameCatalog?.rows ?? []).map((row) => [row.id, row]),
);
assert.equal(dualById["service-removed-p-requester:lash"]?.section, "main_client");
assert.equal(dualById["service-removed-p-requester:lash"]?.sectionLabel, "alizaCompany");
assert.equal(dualById["service-edited-p-requester:cut"]?.section, "main_client");
assert.equal(dualById["service-edited-p-requester:cut"]?.sectionLabel, "alizaCompany");
assert.equal(dualById["product-added-p-requester:hrr"]?.section, "main_client");
assert.equal(dualById["service-removed-guest-1:lash"]?.section, "guest");
assert.equal(dualById["service-removed-guest-1:lash"]?.sectionLabel, "Guest umer");
assert.equal(dualById["service-edited-guest-1:cut"]?.section, "guest");
assert.equal(dualById["service-edited-guest-1:cut"]?.sectionLabel, "Guest umer");

const dualGroups = groupActivityComparisonSections(dualPersonSameCatalog!.rows);
assert.deepEqual(
  dualGroups.map((g) => g.label),
  ["alizaCompany", "Guest umer"],
);
assert.equal(dualGroups[0]?.rows.length, 3);
assert.equal(dualGroups[1]?.rows.length, 2);
// Section headings must be person names — never a service title.
for (const g of dualGroups) {
  assert.notEqual(g.label, "Muhammad umer arshad");
  assert.notEqual(g.label, "eyelash");
  assert.notEqual(g.label, "hrr");
}

assert.equal(activityComparisonSectionHeading("guest", "Guest umer"), "Guest umer");
assert.equal(activityComparisonSectionHeading("guest", "Ali"), "Guest Ali");
assert.equal(activityComparisonSectionHeading("main_client", ""), "Client");

// flatten must keep requester-tagged client lines when nested guest services exist.
const flat = flattenBookingServices({
  services: [
    { id: "cut", name: "Cut", price: 10, durationMins: 30, guestId: "p-requester" },
    { id: "lash", name: "eyelash", price: 20, durationMins: 10, guestId: "guest-1" },
  ],
  guests: [
    {
      id: "guest-1",
      name: "umer",
      services: [
        { id: "lash", name: "eyelash", price: 20, durationMins: 10, guestId: "guest-1" },
      ],
      products: [],
    },
  ],
});
assert.equal(flat.some((s) => s.id === "cut" && s.guestId === "p-requester"), true);
assert.equal(flat.filter((s) => s.id === "lash").length, 1);

console.log("buildActivityComparison.test.ts passed");
