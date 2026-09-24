/**
 * Run with: npx --yes tsx src/components/common/businessSetupTemplateSync.test.ts
 */
import assert from "node:assert/strict";
import {
  createDefaultTemplateSyncSettings,
  findIndependentToSyncNeedingSource,
  sectionNeedsSyncSourceChoice,
} from "./businessSetupTemplateSync";

assert.equal(sectionNeedsSyncSourceChoice({}, { notes: "" }), false);
assert.equal(sectionNeedsSyncSourceChoice([], []), false);
assert.equal(
  sectionNeedsSyncSourceChoice(
    { serviceFor: { men: true, women: false, kids: false } },
    { serviceFor: { men: true, women: false, kids: false } },
  ),
  false,
);
assert.equal(
  sectionNeedsSyncSourceChoice({ notes: "fixed" }, { notes: "desired" }),
  true,
);

const prev = createDefaultTemplateSyncSettings();
prev.serviceFor = "independent";
const next = { ...prev, serviceFor: "sync" as const };
assert.equal(
  findIndependentToSyncNeedingSource(prev, next, () => true),
  "serviceFor",
);
assert.equal(
  findIndependentToSyncNeedingSource(prev, next, () => false),
  null,
);

console.log("businessSetupTemplateSync.test.ts: ok");
