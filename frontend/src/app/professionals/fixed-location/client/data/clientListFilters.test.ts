/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/client/data/clientListFilters.test.ts
 */
import assert from "node:assert/strict";
import type { ClientRecord } from "./clientList";
import {
  matchesClientSearch,
  parseClientSearchQuery,
} from "./clientListFilters";

const base = {
  id: "1",
  email: "sara.j@example.com",
  phone: "1",
  totalSales: "€0",
  lastBooking: "—",
  tags: [] as ClientRecord["tags"],
  kind: "individual" as const,
  addedOn: "",
  bookingsCompleted: 0,
  averageBookingValue: "€0",
  recentServices: [],
  bookingHistory: [],
};

const withNames: ClientRecord = {
  ...base,
  name: "Sara Johnson",
  firstName: "Sara",
  lastName: "Johnson",
};

const displayOnly: ClientRecord = {
  ...base,
  email: "alex@example.com",
  name: "Alex Martin",
};

assert.equal(matchesClientSearch(withNames, ""), true);
assert.equal(matchesClientSearch(withNames, "sar"), true);
assert.equal(matchesClientSearch(withNames, "john"), true);
assert.equal(matchesClientSearch(withNames, "sara johnson"), true);
assert.equal(matchesClientSearch(withNames, "sara.j"), true);
assert.equal(matchesClientSearch(withNames, "alex"), false);
assert.equal(matchesClientSearch(withNames, "smith"), false);

assert.equal(matchesClientSearch(displayOnly, "ale"), true);
assert.equal(matchesClientSearch(displayOnly, "mar"), true);
assert.equal(matchesClientSearch(displayOnly, "alex@"), true);
assert.equal(matchesClientSearch(displayOnly, "sara"), false);

assert.equal(parseClientSearchQuery(new URLSearchParams("q=Sara%20Johnson")), "Sara Johnson");
assert.equal(parseClientSearchQuery(new URLSearchParams("q=Sara")), "Sara");
assert.equal(
  parseClientSearchQuery(new URLSearchParams("firstName=Ann&lastName=Lee")),
  "Ann Lee",
);
assert.equal(
  parseClientSearchQuery(new URLSearchParams("firstName=Ann&q=Preferred")),
  "Preferred",
);
assert.equal(parseClientSearchQuery(new URLSearchParams("")), "");

console.log("clientListFilters.test.ts: ok");
