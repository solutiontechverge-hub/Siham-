/**
 * Run with: node src/services/bookingEmail.recipients.test.js
 */
import assert from "node:assert/strict";
import {
  extractCalendarClientEmail,
  extractCalendarRecipientEmails,
} from "./bookingEmail.service.js";

const notes = `Booking note
---mollure-meta---
${JSON.stringify({
  clientEmail: "primary@example.com",
  isGuest: true,
  guests: [
    { id: "g1", name: "Extra", email: "guest2@example.com" },
    { id: "g2", name: "NoMail" },
  ],
  clientSnapshot: {
    people: [{ id: "p1", email: "person@example.com", isRequester: false }],
  },
})}`;

assert.equal(
  extractCalendarClientEmail("Someone", notes),
  "primary@example.com",
);

const recipients = extractCalendarRecipientEmails("Someone", notes);
assert.deepEqual(recipients, [
  "primary@example.com",
  "guest2@example.com",
  "person@example.com",
]);

assert.deepEqual(extractCalendarRecipientEmails("", "no meta"), []);

console.log("bookingEmail recipients: ok");
