/**
 * Run with: npx --yes tsx src/components/common/ClientPlatformTag.test.ts
 */
import assert from "node:assert/strict";
import { resolveClientPlatformTag } from "./ClientPlatformTag";
import { getTransactionClientTypeLabel } from "../../app/professionals/fixed-location/finance/data/transactions";
import { bookingClientTypeTag } from "./calendar/BookingClientTags";

// Individuals: no type tag (logo-only when Mollure)
assert.equal(resolveClientPlatformTag({ clientKind: "individual" }), null);
assert.equal(
  resolveClientPlatformTag({ clientKind: "individual", isMollure: true }),
  "mollure",
);
assert.equal(getTransactionClientTypeLabel("nonMollure"), null);
assert.equal(bookingClientTypeTag("individual"), null);

// Business: BC (internal state key remains "cc")
assert.equal(resolveClientPlatformTag({ clientKind: "company" }), "cc");
assert.equal(
  resolveClientPlatformTag({ clientKind: "company", isMollure: true }),
  "cc",
);
assert.equal(getTransactionClientTypeLabel("business"), "BC");
assert.equal(bookingClientTypeTag("company"), "BC");

// Mollure / guest
assert.equal(resolveClientPlatformTag({ isMollure: true }), "mollure");
assert.equal(resolveClientPlatformTag({ isGuest: true }), "guest");
assert.equal(getTransactionClientTypeLabel("mollure"), "M");
assert.equal(getTransactionClientTypeLabel("guest"), null);

console.log("ClientPlatformTag.test.ts: ok");
