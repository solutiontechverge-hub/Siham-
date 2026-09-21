/**
 * Run with: npx --yes tsx src/components/common/calendar/buildSalesOverviewCards.helpers.test.ts
 */
import assert from "node:assert/strict";
import { shouldShowAfterTreatmentCard } from "./buildSalesOverviewCards.helpers";

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: false,
    ended: true,
  }),
  false,
  "prepaid + clock ended alone must hide after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: true,
    isCompleted: false,
    ended: true,
  }),
  true,
  "prepaid + in progress shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: true,
    ended: true,
  }),
  true,
  "prepaid + completed shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: false,
    isInProgress: false,
    isCompleted: false,
    ended: true,
  }),
  true,
  "no prepay + ended still shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: false,
    ended: false,
    hasCollectedAfterTreatment: true,
  }),
  true,
  "already-collected after-treatment stays visible",
);

console.log("buildSalesOverviewCards.helpers.test.ts: all assertions passed");
