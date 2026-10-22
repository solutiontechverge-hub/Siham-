/**
 * Run with: node --test src/helpers/financeEmailTemplates.refund.test.js
 * (from MollureFrontend/backend)
 */
import assert from "node:assert/strict";
import test from "node:test";
import { buildRefundCompletedEmail } from "./financeEmailTemplates.js";

test("refund email includes amount, method, type, items, reason", () => {
  const { html, text } = buildRefundCompletedEmail({
    clientName: "aliza",
    salonName: "Mollure Salon",
    amount: 58.25,
    bookingId: "ol1792511231187XMQ3R7",
    documentNumber: "CR-123456",
    refundMode: "item",
    refundMethod: "Online Direct",
    refundReason: "Client Request",
    refundItems: [
      { name: "eyelash", amount: 111 },
      { name: "Muhammad umer arshad", amount: 11 },
    ],
  });

  assert.match(html, /Payment refunded/);
  assert.match(html, /€58\.25/);
  assert.match(html, /By item/);
  assert.match(html, /Online Direct/);
  assert.match(html, /eyelash/);
  assert.match(html, /Client Request/);
  assert.match(html, /ol1792511231187XMQ3R7/);
  assert.match(text, /Refund type: By item/);
  assert.match(text, /Refund method: Online Direct/);
  assert.match(text, /Items: eyelash/);
});

test("refund email by amount omits item list", () => {
  const { html, text } = buildRefundCompletedEmail({
    clientName: "aliza",
    salonName: "Salon",
    amount: 58.25,
    bookingId: "BK-1",
    refundMode: "amount",
    refundMethod: "Online transfer / bank",
    refundItems: [{ name: "Refund", amount: 58.25 }],
  });

  assert.match(html, /By amount/);
  assert.match(html, /Online transfer \/ bank/);
  assert.doesNotMatch(html, /Refunded items/);
  assert.doesNotMatch(text, /^Items:/m);
});
