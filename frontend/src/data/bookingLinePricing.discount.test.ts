/**
 * Run with (from frontend/):
 *   $env:NODE_PATH=(Resolve-Path .\node_modules).Path; npx --yes tsx src/data/bookingLinePricing.discount.test.ts
 */
import assert from "node:assert/strict";
import {
  effectiveServiceAmount,
  normalizeServiceLinePricing,
  persistLinePricing,
  serviceListAmount,
} from "./bookingLinePricing";

const pct20 = { type: "percentage" as const, amount: 20 };

// Legacy pro draft: list in price + discount → persist writes net + list.
{
  const persisted = persistLinePricing({ price: 44, discount: pct20 });
  assert.equal(persisted.price, 35.2);
  assert.equal(persisted.originalPrice, 44);
  assert.equal(persisted.pricingMode, "net");
  assert.equal(persisted.discountPct, 20);
}

// Canonical net + list stays net (no double discount).
{
  const persisted = persistLinePricing({
    price: 35.2,
    originalPrice: 44,
    discount: pct20,
    pricingMode: "net",
  });
  assert.equal(persisted.price, 35.2);
  assert.equal(persisted.originalPrice, 44);
  assert.equal(persisted.pricingMode, "net");
}

// Old reverse-engineered originalPrice (poison): treat price as list.
{
  const healed = normalizeServiceLinePricing({
    price: 44,
    originalPrice: 55,
    discount: pct20,
  });
  assert.equal(healed.price, 35.2);
  assert.equal(healed.originalPrice, 44);
  assert.equal(healed.pricingMode, "net");
  assert.equal(effectiveServiceAmount(healed), 35.2);
  assert.equal(serviceListAmount(healed), 44);
}

// discountPct-only rows still normalize.
{
  const healed = normalizeServiceLinePricing({
    price: 44,
    discountPct: 20,
  });
  assert.equal(healed.price, 35.2);
  assert.equal(healed.originalPrice, 44);
}

// Re-persist poison service (hasList, no pricingMode, no unitPrice) writes net.
{
  const persisted = persistLinePricing({
    price: 44,
    originalPrice: 55,
    discount: pct20,
  });
  assert.equal(persisted.price, 35.2);
  assert.equal(persisted.originalPrice, 44);
}

// Already-net rows keep net.
{
  const kept = normalizeServiceLinePricing({
    price: 35.2,
    originalPrice: 44,
    discount: pct20,
    pricingMode: "net",
  });
  assert.equal(kept.price, 35.2);
  assert.equal(kept.originalPrice, 44);
}

console.log("bookingLinePricing.discount.test.ts: ok");
