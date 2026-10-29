/**
 * Run with: npx --yes tsx src/components/common/finance-documents/buildNextFinanceInvoiceSettings.test.ts
 *
 * Guard: setSettings must PUT the upserted catalog, never default empty products.
 */
import assert from "node:assert/strict";
import {
  buildNextFinanceInvoiceSettings,
  defaultFinanceInvoiceSettings,
  type FinanceInvoiceSettings,
} from "./useFinanceInvoiceSettings";
import { upsertFinanceProduct } from "../../sections/finance/financeCatalogPersist";

const withProducts: FinanceInvoiceSettings = {
  ...defaultFinanceInvoiceSettings,
  products: [{ id: "p1", name: "Shampoo", price: 30, vat: "21%" }],
};

const next = buildNextFinanceInvoiceSettings(withProducts, (prev) =>
  upsertFinanceProduct(prev, {
    id: "p2",
    name: "Serum",
    price: 40,
    vat: "21%",
  }),
);

assert.equal(next.products.length, 2);
assert.ok(next.products.some((p) => p.id === "p1"));
assert.ok(next.products.some((p) => p.id === "p2"));

const wipedIfDefault =
  buildNextFinanceInvoiceSettings(null, (prev) => prev).products;
assert.deepEqual(wipedIfDefault, []);

console.log("buildNextFinanceInvoiceSettings.test.ts: ok");
