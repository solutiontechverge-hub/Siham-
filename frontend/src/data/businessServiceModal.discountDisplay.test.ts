/**
 * Run with (from frontend/):
 *   $env:NODE_PATH=(Resolve-Path .\node_modules).Path; npx --yes tsx src/data/businessServiceModal.discountDisplay.test.ts
 */
import assert from "node:assert/strict";
import {
  formatBusinessServiceDiscountFeatureLabel,
  formatBusinessServiceDiscountTooltip,
} from "./businessServiceModal.data";

assert.equal(
  formatBusinessServiceDiscountFeatureLabel({
    discountType: "percent",
    discountAmount: "15",
  }),
  "15% Discount",
);
assert.equal(
  formatBusinessServiceDiscountFeatureLabel({
    discountType: "fixed",
    discountAmount: "5",
  }),
  "€5 Discount",
);
assert.equal(
  formatBusinessServiceDiscountTooltip({
    discountDescription: "Spring sale",
    discountStartDate: "2026-03-01",
    discountEndDate: "2026-03-31",
  }),
  "Spring sale\n2026-03-01 – 2026-03-31",
);
assert.equal(
  formatBusinessServiceDiscountTooltip({
    discountStartDate: "2026-04-01",
  }),
  "From 2026-04-01",
);
assert.equal(formatBusinessServiceDiscountTooltip({}), "");

console.log("businessServiceModal.discountDisplay.test.ts: ok");
