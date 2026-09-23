/**
 * Run with: npx --yes tsx src/app/clients/booking/clientBookingDraftCache.test.ts
 */
import assert from "node:assert/strict";
import { mergeClientBookingDraftRichness } from "./clientBookingDraftCache";
import type { ClientBookingDraft } from "../../../components/common/client-booking/types";

const baseDraft = (): ClientBookingDraft => ({
  selectedDateISO: "2026-09-08",
  selectedTime: "11:15 AM",
  combineServices: true,
  total: 246,
  people: [
    { id: "p-requester", name: "alizaCompany", isRequester: true },
    { id: "model-2", name: "umer", participantType: "model" },
  ],
  services: [],
});

const apiDraft: ClientBookingDraft = {
  ...baseDraft(),
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: null,
    },
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: "model-2",
    },
  ],
};

const sessionDraft: ClientBookingDraft = {
  ...baseDraft(),
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: "model-2",
    },
  ],
};

const merged = mergeClientBookingDraftRichness(apiDraft, sessionDraft);
assert.equal(merged.services.length, 2);
assert.equal(merged.services[0]?.guestId ?? null, null);
assert.equal(merged.services[1]?.guestId, "model-2");

// Session must not re-append lines the API already dropped (cancelled/removed).
const apiWithoutGuest: ClientBookingDraft = {
  ...baseDraft(),
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
      guestId: null,
    },
  ],
};
const staleSessionWithCancelled: ClientBookingDraft = {
  ...baseDraft(),
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
      guestId: "model-2",
    },
  ],
};
const noStaleLines = mergeClientBookingDraftRichness(
  apiWithoutGuest,
  staleSessionWithCancelled,
);
assert.equal(noStaleLines.services.length, 1);
assert.equal(noStaleLines.services[0]?.id, "svc-umar");
assert.equal(noStaleLines.services[0]?.guestId ?? null, null);

const omittedGuestId: ClientBookingDraft = {
  ...baseDraft(),
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      durationMins: 60,
      price: 11,
    },
  ],
};
const filled = mergeClientBookingDraftRichness(omittedGuestId, sessionDraft);
assert.equal(filled.services[0]?.guestId ?? null, null);
// API owns the line set — session no longer invents missing guest rows.
assert.equal(filled.services.length, 1);
assert.equal(filled.services.some((row) => row.guestId === "model-2"), false);

console.log("clientBookingDraftCache.test.ts: all assertions passed");
