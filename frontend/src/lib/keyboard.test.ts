/**
 * Run with: npx --yes tsx src/lib/keyboard.test.ts
 */
import assert from "node:assert/strict";
import { isModKey, resolveListboxNavKey } from "./keyboard";

assert.equal(isModKey({ metaKey: true, ctrlKey: false }), true);
assert.equal(isModKey({ metaKey: false, ctrlKey: true }), true);
assert.equal(isModKey({ metaKey: false, ctrlKey: false }), false);

assert.deepEqual(resolveListboxNavKey("ArrowDown", 0, 3), {
  type: "move",
  index: 1,
});
assert.deepEqual(resolveListboxNavKey("ArrowUp", 1, 3), {
  type: "move",
  index: 0,
});
assert.deepEqual(resolveListboxNavKey("Enter", 1, 3), { type: "select" });
assert.deepEqual(resolveListboxNavKey("Escape", 1, 3), { type: "close" });

assert.deepEqual(resolveListboxNavKey(" ", 0, 2), { type: "none" });
assert.deepEqual(resolveListboxNavKey(" ", 0, 2, { spaceSelects: true }), {
  type: "select",
});

console.log("keyboard.test.ts: ok");
