import { describe, expect, it } from "vitest";
import { isModKey, resolveListboxNavKey } from "./keyboard";

describe("isModKey", () => {
  it("treats meta and ctrl as modifiers", () => {
    expect(isModKey({ metaKey: true, ctrlKey: false })).toBe(true);
    expect(isModKey({ metaKey: false, ctrlKey: true })).toBe(true);
    expect(isModKey({ metaKey: false, ctrlKey: false })).toBe(false);
  });
});

describe("resolveListboxNavKey", () => {
  it("moves highlight with arrows and selects with Enter", () => {
    expect(resolveListboxNavKey("ArrowDown", 0, 3)).toEqual({
      type: "move",
      index: 1,
    });
    expect(resolveListboxNavKey("ArrowUp", 1, 3)).toEqual({
      type: "move",
      index: 0,
    });
    expect(resolveListboxNavKey("Enter", 1, 3)).toEqual({ type: "select" });
    expect(resolveListboxNavKey("Escape", 1, 3)).toEqual({ type: "close" });
  });

  it("only selects on Space when spaceSelects is enabled", () => {
    expect(resolveListboxNavKey(" ", 0, 2)).toEqual({ type: "none" });
    expect(resolveListboxNavKey(" ", 0, 2, { spaceSelects: true })).toEqual({
      type: "select",
    });
  });
});
