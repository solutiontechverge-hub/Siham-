/**
 * Run with: node src/helpers/financeVat.test.js
 */
import assert from "node:assert/strict";
import {
  DEFAULT_VAT_RATE,
  VAT_EXCEPTION_INFO_TOOLTIP,
  resolveProductVatRate,
  resolveServiceVatLabel,
  resolveServiceVatRate,
} from "./financeVat.js";

assert.equal(DEFAULT_VAT_RATE, 21);
assert.equal(
  VAT_EXCEPTION_INFO_TOOLTIP,
  "Every service uses 21% VAT by default. Only add a service here if it has a different VAT rate — these are the exceptions.",
);

const settings = {
  services: [
    { id: "svc-9", service_id: "svc-9", service: "Kids cut", vat: "9%" },
    { id: "svc-0", service_id: "svc-0", vat_rate: 0 },
  ],
  products: [{ id: "p1", name: "Shampoo", vat: "21%" }],
};

assert.equal(resolveServiceVatRate("missing", settings), 21);
assert.equal(resolveServiceVatRate(null, settings), 21);
assert.equal(resolveServiceVatRate("svc-9", settings), 9);
assert.equal(resolveServiceVatRate("svc-9::guest-1", settings), 9);
assert.equal(resolveServiceVatLabel("svc-0", settings), "0%");
assert.equal(resolveProductVatRate("p1", settings), 21);
assert.equal(resolveProductVatRate("unknown-product", settings), 21);

console.log("financeVat.test.js: ok");
