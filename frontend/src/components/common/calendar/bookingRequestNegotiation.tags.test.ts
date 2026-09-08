/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingRequestNegotiation.tags.test.ts
 */
import assert from "node:assert/strict";
import {
  detectProductLineChanges,
  detectServiceLineChanges,
  isAwaitingClientChangeApproval,
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

console.log("bookingRequestNegotiation.tags.test.ts passed");
