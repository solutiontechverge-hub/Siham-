/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingRequestNegotiation.tags.test.ts
 */
import assert from "node:assert/strict";
import {
  allowComputedServiceAddCancelTags,
  detectProductLineChanges,
  detectServiceLineChanges,
  detectSilentUpdatedFields,
  hasServiceReorderOnly,
  isAwaitingClientChangeApproval,
  isAwaitingIncomingClientEdit,
  isSilentSafeBookingChange,
  resolveLineChangeTags,
} from "./bookingRequestNegotiation";

const original = [
  {
    id: "cut",
    name: "Haircut",
    price: 40,
    durationMins: 30,
    startTime: "10:00",
    endTime: "10:30",
  },
];
const current = [
  {
    id: "cut",
    name: "Haircut",
    price: 45,
    durationMins: 30,
    startTime: "10:00",
    endTime: "10:30",
  },
  {
    id: "color",
    name: "Color",
    price: 80,
    durationMins: 60,
    startTime: "10:30",
    endTime: "11:30",
  },
];

const lineChanges = detectServiceLineChanges(original, current);
assert.deepEqual(lineChanges.edited, ["cut"]);
assert.deepEqual(lineChanges.added, ["color"]);
assert.deepEqual(lineChanges.cancelled, []);

// teamMemberId vs staffResourceId is the same assignee — not Edited.
assert.deepEqual(
  detectServiceLineChanges(
    [
      {
        id: "cut",
        name: "Haircut",
        price: 40,
        durationMins: 30,
        startTime: "10:00",
        endTime: "10:30",
        teamMemberId: "tm-ali",
      },
    ],
    [
      {
        id: "cut",
        name: "Haircut",
        price: 40,
        durationMins: 30,
        startTime: "10:00",
        endTime: "10:30",
        staffResourceId: "tm-ali",
      },
    ],
  ).edited,
  [],
);

// Real staff change still counts as Edited.
assert.deepEqual(
  detectServiceLineChanges(
    [
      {
        id: "cut",
        name: "Haircut",
        price: 40,
        durationMins: 30,
        startTime: "10:00",
        endTime: "10:30",
        teamMemberId: "tm-ali",
      },
    ],
    [
      {
        id: "cut",
        name: "Haircut",
        price: 40,
        durationMins: 30,
        startTime: "10:00",
        endTime: "10:30",
        staffResourceId: "tm-aliza",
      },
    ],
  ).edited,
  ["cut"],
);

// Client + guest sharing the same catalog service id are distinct lines.
{
  const sharedOriginal = [
    {
      id: "cut",
      name: "Haircut",
      price: 40,
      durationMins: 30,
      startTime: "10:00",
      endTime: "10:30",
      teamMemberId: "tm-ali",
    },
    {
      id: "color",
      name: "Color",
      price: 80,
      durationMins: 60,
      startTime: "10:30",
      endTime: "11:30",
      staffResourceId: "tm-bob",
    },
    {
      id: "cut",
      name: "Haircut",
      price: 40,
      durationMins: 30,
      startTime: "10:00",
      endTime: "10:30",
      teamMemberId: "tm-ali",
      guestId: "g-umer",
    },
    {
      id: "color",
      name: "Color",
      price: 80,
      durationMins: 60,
      startTime: "10:30",
      endTime: "11:30",
      staffResourceId: "tm-bob",
      guestId: "g-umer",
    },
  ];
  const sharedCurrent = [
    {
      id: "cut",
      name: "Haircut",
      price: 40,
      durationMins: 30,
      startTime: "10:00",
      endTime: "10:30",
      staffResourceId: "tm-ali",
    },
    {
      id: "color",
      name: "Color",
      price: 80,
      durationMins: 60,
      startTime: "10:30",
      endTime: "11:30",
      teamMemberId: "tm-bob",
    },
    {
      id: "cut",
      name: "Haircut",
      price: 40,
      durationMins: 30,
      startTime: "10:00",
      endTime: "10:30",
      staffResourceId: "tm-ali",
      guestId: "g-umer",
    },
    {
      id: "color",
      name: "Color",
      price: 80,
      durationMins: 60,
      startTime: "10:30",
      endTime: "11:30",
      teamMemberId: "tm-bob",
      guestId: "g-umer",
    },
  ];
  assert.deepEqual(
    detectServiceLineChanges(sharedOriginal, sharedCurrent).edited,
    [],
    "multi-guest shared catalog ids + staff field swap must not false-Edited",
  );
  assert.deepEqual(
    detectServiceLineChanges(sharedOriginal, [
      sharedCurrent[0],
      sharedCurrent[1],
      { ...sharedCurrent[2], price: 55 },
      sharedCurrent[3],
    ]).edited,
    ["cut"],
    "real guest price change is Edited",
  );
}

// HH:mm vs HH:mm:ss and string price are the same content — not Edited.
assert.deepEqual(
  detectServiceLineChanges(
    [
      {
        id: "cut",
        name: "Haircut",
        price: "40" as unknown as number,
        durationMins: 30,
        startTime: "10:00:00",
        endTime: "10:30:00",
        teamMemberId: "tm-ali",
      },
    ],
    [
      {
        id: "cut",
        name: "Haircut",
        price: 40,
        durationMins: 30,
        startTime: "10:00",
        endTime: "10:30",
        staffResourceId: "tm-ali",
      },
    ],
  ).edited,
  [],
);

const removed = detectServiceLineChanges(current, original);
assert.deepEqual(removed.cancelled, ["color"]);

assert.deepEqual(
  resolveLineChangeTags("cut", {
    editedIds: ["cut"],
    addedIds: ["color"],
    cancelledIds: ["old"],
  }),
  ["edited"],
);
assert.deepEqual(
  resolveLineChangeTags("color", {
    editedIds: ["cut"],
    addedIds: ["color"],
    cancelledIds: ["old"],
    awaitingApproval: true,
  }),
  ["added", "pending"],
);
assert.deepEqual(
  resolveLineChangeTags("old", {
    editedIds: ["cut"],
    addedIds: ["color"],
    cancelledIds: ["old"],
    awaitingApproval: true,
  }),
  ["cancelled", "pending"],
);
assert.deepEqual(
  resolveLineChangeTags("untouched", {
    editedIds: ["cut"],
    addedIds: ["color"],
    cancelledIds: ["old"],
    awaitingApproval: true,
  }),
  [],
);

assert.equal(
  isAwaitingClientChangeApproval(
    { lastEditedBy: "professional", responseStatus: "suggestion_for_change" },
    null,
  ),
  true,
);
assert.equal(
  isAwaitingClientChangeApproval(null, {
    lastEditedBy: "professional",
    status: "suggested",
  }),
  true,
);
assert.equal(
  isAwaitingClientChangeApproval(
    { lastEditedBy: "professional" },
    { lastEditedBy: "client", status: "suggested" },
  ),
  false,
);

assert.equal(
  isAwaitingIncomingClientEdit({
    status: "Requested",
    bookingScenario: "EBR",
    details: { lastEditedBy: "client" },
  }),
  true,
);
assert.equal(
  isAwaitingIncomingClientEdit({
    status: "Confirmed",
    bookingScenario: "ER",
    details: { requestDirection: "incoming" },
  }),
  true,
);
assert.equal(
  isAwaitingIncomingClientEdit({
    status: "Requested",
    bookingScenario: "BR",
    details: { lastEditedBy: "client" },
  }),
  false,
);
assert.equal(
  isAwaitingIncomingClientEdit({
    status: "Requested",
    bookingScenario: "EBR",
    details: { lastEditedBy: "professional" },
  }),
  false,
);

const productChanges = detectProductLineChanges(
  [{ id: "p1", name: "Oil", price: 10, quantity: 1 }],
  [
    { id: "p1", name: "Oil", price: 12, quantity: 1 },
    { id: "p2", name: "Mask", price: 8, quantity: 1 },
  ],
);
assert.deepEqual(productChanges.edited, ["p1"]);
assert.deepEqual(productChanges.added, ["p2"]);

const guestA = {
  id: "g-model",
  name: "ali",
  email: "",
  phoneCode: "+31",
  phoneNumber: "612345678",
  participantType: "model" as const,
  services: [
    {
      id: "eyelash",
      name: "eyelash",
      price: 111,
      durationMins: 11,
      startTime: "12:15",
      endTime: "12:26",
      guestId: "g-model",
    },
  ],
  products: [],
};

assert.equal(
  isSilentSafeBookingChange({
    previousServices: original,
    currentServices: original,
    previousGuests: [guestA],
    currentGuests: [{ ...guestA, name: "ali khan" }],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "600000000",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  true,
);

assert.equal(
  isSilentSafeBookingChange({
    previousServices: original,
    currentServices: original,
    previousGuests: [guestA],
    currentGuests: [guestA],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "611111111",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  true,
);

assert.equal(
  isSilentSafeBookingChange({
    previousServices: [
      { ...original[0], startTime: "10:00", endTime: "10:30" },
      {
        id: "color",
        name: "Color",
        price: 80,
        durationMins: 60,
        startTime: "10:30",
        endTime: "11:30",
      },
    ],
    currentServices: [
      {
        id: "color",
        name: "Color",
        price: 80,
        durationMins: 60,
        startTime: "10:00",
        endTime: "11:00",
      },
      { ...original[0], startTime: "11:00", endTime: "11:30" },
    ],
    previousGuests: [guestA],
    currentGuests: [guestA],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "600000000",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  true,
);

assert.equal(
  isSilentSafeBookingChange({
    previousServices: original,
    currentServices: [{ ...original[0], price: 55 }],
    previousGuests: [guestA],
    currentGuests: [{ ...guestA, name: "ali khan" }],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "600000000",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  false,
);

const guestReorderPrev = [
  {
    ...guestA,
    services: [
      guestA.services[0],
      {
        id: "brow",
        name: "brow",
        price: 40,
        durationMins: 20,
        startTime: "12:26",
        endTime: "12:46",
        guestId: "g-model",
      },
    ],
  },
];
const guestReorderNext = [
  {
    ...guestReorderPrev[0],
    services: [
      guestReorderPrev[0].services[1],
      {
        ...guestReorderPrev[0].services[0],
        startTime: "12:15",
        endTime: "12:26",
      },
    ],
  },
];
assert.equal(
  hasServiceReorderOnly({
    previousServices: original,
    currentServices: original,
    previousGuests: guestReorderPrev,
    currentGuests: guestReorderNext,
  }),
  true,
);

// Drawer compares client-only selectedServices vs notes.services that already
// include guest lines — that must still count as a silent phone change.
assert.equal(
  isSilentSafeBookingChange({
    previousServices: [...original, { ...guestA.services[0] }],
    currentServices: original,
    previousGuests: [guestA],
    currentGuests: [guestA],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "611111111",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  true,
);

// Approval-required content + phone → Edit Request lane, not Updated.
assert.equal(
  isSilentSafeBookingChange({
    previousServices: original,
    currentServices: [{ ...original[0], price: 55 }],
    previousGuests: [guestA],
    currentGuests: [guestA],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "611111111",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  false,
);

assert.deepEqual(
  resolveLineChangeTags("cut", {
    editedIds: ["cut"],
    awaitingApproval: true,
  }),
  ["edited", "pending"],
);

// Guest name only must stay silent even when notes products are flattened
// (client + unique + guest) and the drawer sends catalog + unique only.
assert.equal(
  isSilentSafeBookingChange({
    previousServices: [...original, { ...guestA.services[0] }],
    currentServices: original,
    previousGuests: [guestA],
    currentGuests: [{ ...guestA, name: "ali khan" }],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "600000000",
    previousProducts: [
      { id: "oil", name: "Oil", price: 10, quantity: 1, unitPrice: 10 },
      {
        id: "oil",
        name: "Oil",
        price: 10,
        quantity: 1,
        unitPrice: 10,
        guestId: "g-model",
      },
    ],
    currentProducts: [
      { id: "oil", name: "Oil", price: 10, quantity: 1, unitPrice: 10 },
    ],
    scheduleChanged: false,
  }),
  true,
);

// Desired-location model lives in clientSnapshot.people, not notes.guests.
assert.equal(
  isSilentSafeBookingChange({
    previousServices: [...original, { ...guestA.services[0] }],
    currentServices: original,
    previousGuests: [],
    currentGuests: [{ ...guestA, name: "ali khan" }],
    previousPeople: [
      { id: "g-model", name: "ali", participantType: "model" },
    ],
    currentPeople: [
      { id: "g-model", name: "ali khan", participantType: "model" },
    ],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "600000000",
    previousProducts: [],
    currentProducts: [],
    scheduleChanged: false,
  }),
  true,
);

assert.deepEqual(
  detectSilentUpdatedFields({
    snapshot: {
      phoneCode: "+31",
      phoneNumber: "600000000",
      guests: [guestA],
      services: original,
    },
    currentPhoneCode: "+31",
    currentPhoneNumber: "600000000",
    currentGuests: [{ ...guestA, name: "ali khan" }],
    currentServices: original,
  }),
  { phoneUpdated: false, guestIds: ["g-model"], serviceIds: [] },
);

assert.deepEqual(
  detectSilentUpdatedFields({
    snapshot: {
      phoneCode: "+31",
      phoneNumber: "600000000",
      guests: [guestA],
      services: original,
    },
    currentPhoneCode: "+31",
    currentPhoneNumber: "611111111",
    currentGuests: [guestA],
    currentServices: original,
  }),
  { phoneUpdated: true, guestIds: [], serviceIds: [] },
);

assert.deepEqual(
  detectSilentUpdatedFields({
    snapshot: {
      phoneCode: "+31",
      phoneNumber: "600000000",
      guests: guestReorderPrev,
      services: original,
    },
    currentPhoneCode: "+31",
    currentPhoneNumber: "600000000",
    currentGuests: guestReorderNext,
    currentServices: original,
  }).serviceIds.sort(),
  ["brow", "eyelash"],
);

assert.deepEqual(
  detectSilentUpdatedFields({
    snapshot: {
      phoneCode: "+31",
      phoneNumber: "600000000",
      guests: [],
      people: [{ id: "g-model", name: "ali", participantType: "model" }],
      services: original,
    },
    currentPhoneCode: "+31",
    currentPhoneNumber: "600000000",
    currentGuests: [{ ...guestA, name: "umerarshad" }],
    currentPeople: [
      { id: "g-model", name: "umerarshad", participantType: "model" },
    ],
    currentServices: original,
  }),
  { phoneUpdated: false, guestIds: ["g-model"], serviceIds: [] },
);

assert.deepEqual(
  detectSilentUpdatedFields({
    snapshot: null,
    currentPhoneCode: "+31",
    currentPhoneNumber: "611111111",
    currentGuests: [{ ...guestA, name: "ali khan" }],
    currentServices: original,
  }),
  { phoneUpdated: false, guestIds: [], serviceIds: [] },
);

assert.equal(
  isSilentSafeBookingChange({
    previousServices: original,
    currentServices: original,
    previousGuests: [
      {
        ...guestReorderPrev[0],
        products: [
          {
            id: "hrr",
            name: "hrr",
            price: 2,
            quantity: 1,
            unitPrice: 22,
            guestId: "g-model",
          },
        ],
      },
    ],
    currentGuests: [
      {
        ...guestReorderNext[0],
        name: "umer arshad",
        products: [
          {
            id: "hrr",
            name: "hrr",
            price: 2,
            quantity: 1,
            unitPrice: 22,
            guestId: "g-model",
          },
        ],
      },
    ],
    previousPhoneCode: "+31",
    currentPhoneCode: "+31",
    previousPhoneNumber: "600000000",
    currentPhoneNumber: "600000000",
    previousProducts: [
      { id: "oil", name: "Oil", price: 10, quantity: 1, unitPrice: 10 },
    ],
    currentProducts: [
      { id: "oil", name: "Oil", price: 10, quantity: 1, unitPrice: 10 },
    ],
    scheduleChanged: false,
  }),
  true,
);

{
  const fields = detectSilentUpdatedFields({
    snapshot: {
      phoneCode: "+31",
      phoneNumber: "600000000",
      guests: guestReorderPrev,
      services: original,
    },
    currentPhoneCode: "+31",
    currentPhoneNumber: "600000000",
    currentGuests: [
      {
        ...guestReorderNext[0],
        name: "umer arshad",
      },
    ],
    currentServices: original,
  });
  assert.equal(fields.phoneUpdated, false);
  assert.deepEqual(fields.guestIds, ["g-model"]);
  assert.deepEqual(fields.serviceIds.slice().sort(), ["brow", "eyelash"]);
}

// Create / view: no computed Added. Edit existing: allow computed Added.
assert.equal(
  allowComputedServiceAddCancelTags({
    hasExistingBooking: false,
    isEditingExisting: false,
    awaitingLineApproval: false,
  }),
  false,
  "new booking create must not use computed Added",
);
assert.equal(
  allowComputedServiceAddCancelTags({
    hasExistingBooking: true,
    isEditingExisting: false,
    awaitingLineApproval: false,
  }),
  false,
  "view-after-create must not use computed Added",
);
assert.equal(
  allowComputedServiceAddCancelTags({
    hasExistingBooking: true,
    isEditingExisting: true,
    awaitingLineApproval: false,
  }),
  true,
  "edit existing may use computed Added",
);
{
  // Incomplete create-era original (client only) would false-Add guest lines.
  const createEraOriginal = [
    {
      id: "cut",
      name: "Haircut",
      price: 40,
      durationMins: 30,
      startTime: "10:00",
      endTime: "10:30",
    },
  ];
  const createEraCurrent = [
    ...createEraOriginal,
    {
      id: "cut",
      name: "Haircut",
      price: 40,
      durationMins: 30,
      startTime: "10:30",
      endTime: "11:00",
      guestId: "g-umer",
    },
  ];
  assert.deepEqual(
    detectServiceLineChanges(createEraOriginal, createEraCurrent).added,
    ["cut"],
    "incomplete original false-Adds guest catalog id — drawer must gate this",
  );
  assert.equal(
    allowComputedServiceAddCancelTags({
      hasExistingBooking: true,
      isEditingExisting: false,
      awaitingLineApproval: false,
    }),
    false,
  );
}

console.log("bookingRequestNegotiation.tags.test.ts passed");
