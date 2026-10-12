import assert from "node:assert/strict";
import { catalogRefFromLineId } from "./finance-sync.service.js";

assert.equal(catalogRefFromLineId("abc::guest::0"), "abc");
assert.equal(catalogRefFromLineId("deb59547-a8d6-47d0-bd41-e57922b236ff"), "deb59547-a8d6-47d0-bd41-e57922b236ff");
assert.equal(catalogRefFromLineId(""), "");
assert.equal(catalogRefFromLineId(null), "");

console.log("finance-sync.catalogRef.test.js: ok");
