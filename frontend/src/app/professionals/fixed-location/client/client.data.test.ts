/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/client/client.data.test.ts
 */
import assert from "node:assert/strict";
import { getProfessionalClientHref } from "./client.data";

assert.equal(
  getProfessionalClientHref("c1"),
  "/professionals/client?clientId=c1",
);

assert.equal(
  getProfessionalClientHref("id with spaces"),
  "/professionals/client?clientId=id%20with%20spaces",
);

assert.equal(getProfessionalClientHref(""), "/professionals/client");
assert.equal(getProfessionalClientHref(null), "/professionals/client");
assert.equal(getProfessionalClientHref(undefined), "/professionals/client");
assert.equal(getProfessionalClientHref("  "), "/professionals/client");

console.log("client.data.test.ts: ok");
