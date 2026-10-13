/**
 * Run with: node src/helpers/financeInvoiceSettings.test.js
 *
 * Clock reset contract: reissue due date = dispatch calendar day + settings duration.
 */
import assert from "node:assert/strict";
import {
  addDaysIso,
  computePenaltyAmount,
  durationToDays,
  isAutomaticTrigger,
  isConfiguredPenaltyValue,
  isReminderTriggerDay,
  mergeInvoiceSettings,
  normalizePenaltyUnit,
  paymentTermPenaltiesInvalid,
  reminderTriggerDate,
  resolveDocumentPaymentTerms,
  resolveDocumentReminders,
  resolveOverdueReissueAction,
  resolveStoredDueDate,
  uniqueById,
} from "./financeInvoiceSettings.js";

const dispatchDay = "2026-10-13";
const dueDays = durationToDays("2", "Weeks");
assert.equal(dueDays, 14);
assert.equal(addDaysIso(dispatchDay, dueDays), "2026-10-27");

assert.equal(isAutomaticTrigger("Automatic"), true);
assert.equal(isAutomaticTrigger("Manual"), false);

// After final reissue → close; Manual banner only for the pending Manual stage.
assert.equal(
  resolveOverdueReissueAction(0, { firstReissueTrigger: "Manual" }),
  "manual",
);
assert.equal(
  resolveOverdueReissueAction(0, { firstReissueTrigger: "Automatic" }),
  "automatic",
);
assert.equal(
  resolveOverdueReissueAction(1, {
    firstReissueTrigger: "Automatic",
    secondReissueTrigger: "Manual",
  }),
  "manual",
);
assert.equal(resolveOverdueReissueAction(2, { secondReissueTrigger: "Manual" }), "close");
assert.equal(resolveOverdueReissueAction(3, {}), "close");

assert.equal(computePenaltyAmount(100, "20", "%"), 20);
assert.equal(computePenaltyAmount(100, "15", "fixed"), 15);
assert.equal(computePenaltyAmount(100, "", "%"), 0);
assert.equal(computePenaltyAmount(100, null, "fixed"), 0);
assert.equal(computePenaltyAmount(100, "abc", "%"), 0);
assert.equal(normalizePenaltyUnit("Percentage"), "%");
assert.equal(normalizePenaltyUnit("Fixed amount"), "fixed");
assert.equal(normalizePenaltyUnit(""), null);
assert.equal(isConfiguredPenaltyValue("10"), true);
assert.equal(isConfiguredPenaltyValue("0"), true);
assert.equal(isConfiguredPenaltyValue(""), false);
assert.equal(isConfiguredPenaltyValue("  "), false);
assert.equal(
  paymentTermPenaltiesInvalid({
    originalPenaltyValue: "",
    originalPenaltyUnit: "%",
  }),
  "Penalty value is required and cannot be blank.",
);
assert.equal(
  paymentTermPenaltiesInvalid({
    originalPenaltyValue: "10",
    originalPenaltyUnit: "weeks",
  }),
  "Penalty type must be Percentage (%) or Fixed amount.",
);
assert.equal(
  paymentTermPenaltiesInvalid({
    originalPenaltyValue: "10",
    originalPenaltyUnit: "%",
    firstReissuePenaltyValue: "20",
    firstReissuePenaltyUnit: "fixed",
    secondReissuePenaltyValue: "5",
    secondReissuePenaltyUnit: "%",
  }),
  null,
);
// merge heals blank legacy penalty values back to defaults
const healed = mergeInvoiceSettings({
  paymentTerms: { originalPenaltyValue: "", originalPenaltyUnit: "" },
});
assert.equal(healed.paymentTerms.originalPenaltyValue, "10");
assert.equal(healed.paymentTerms.originalPenaltyUnit, "%");

assert.deepEqual(
  uniqueById([
    { id: "a", price: "€10" },
    { id: "a", price: 99 },
    { id: "", price: 1 },
    { id: "b", price: 2 },
  ]),
  [
    { id: "a", price: "€10" },
    { id: "b", price: 2 },
  ],
);

const merged = mergeInvoiceSettings({
  products: [
    { id: "p1", name: "Shampoo", price: "€12,50", discountAmount: "1" },
    { id: "p1", name: "Dup", price: 99 },
  ],
});
assert.equal(merged.products.length, 1);
assert.equal(merged.products[0].price, 12.5);
assert.equal(merged.products[0].discountAmount, 1);

// Snapshot freeze: issue with terms A → change live settings → issued doc keeps A.
const frozenAtIssue = {
  originalDueValue: "2",
  originalDueUnit: "Weeks",
  firstReissueTrigger: "Manual",
};
const liveAfterEdit = {
  originalDueValue: "10",
  originalDueUnit: "Days",
  firstReissueTrigger: "Automatic",
};
const issuedDoc = {
  dueDate: "2026-10-27",
  issuedSnapshot: { invoiceSettings: { paymentTerms: frozenAtIssue } },
};
assert.deepEqual(
  resolveDocumentPaymentTerms(issuedDoc, liveAfterEdit),
  frozenAtIssue,
);
assert.notEqual(
  resolveDocumentPaymentTerms(issuedDoc, liveAfterEdit).originalDueUnit,
  liveAfterEdit.originalDueUnit,
);
assert.deepEqual(
  resolveDocumentPaymentTerms({ issuedSnapshot: {} }, liveAfterEdit),
  liveAfterEdit,
);

// Fixed stored due date: trigger = due − lead; never drifts with live terms.
const storedDue = resolveStoredDueDate("2026-10-27", null);
assert.equal(storedDue, "2026-10-27");
assert.equal(
  resolveStoredDueDate(null, "2026-10-27"),
  "2026-10-27",
);
assert.equal(reminderTriggerDate(storedDue, "3", "Days"), "2026-10-24");
assert.equal(reminderTriggerDate(storedDue, "1", "Weeks"), "2026-10-20");
// Same stored due + lead → same trigger regardless of calendar "today".
assert.equal(
  isReminderTriggerDay(storedDue, "3", "Days", new Date("2026-10-24T12:00:00Z")),
  true,
);
assert.equal(
  isReminderTriggerDay(storedDue, "3", "Days", new Date("2026-10-25T12:00:00Z")),
  false,
);
// Live payment-term edits must not move the reminder off the frozen due date.
assert.equal(
  reminderTriggerDate("2026-10-27", "3", "Days"),
  reminderTriggerDate(issuedDoc.dueDate, "3", "Days"),
);

const frozenReminders = {
  reminder1Value: "1",
  reminder1Unit: "Weeks",
  reminder2Value: "3",
  reminder2Unit: "Days",
};
const liveReminders = {
  reminder1Value: "5",
  reminder1Unit: "Days",
  reminder2Value: "1",
  reminder2Unit: "Weeks",
};
assert.deepEqual(
  resolveDocumentReminders(
    { issuedSnapshot: { invoiceSettings: { reminders: frozenReminders } } },
    liveReminders,
  ),
  frozenReminders,
);
assert.deepEqual(
  resolveDocumentReminders({ issuedSnapshot: {} }, liveReminders),
  liveReminders,
);

console.log("financeInvoiceSettings.test.js: ok");
