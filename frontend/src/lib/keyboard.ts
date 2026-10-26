/**
 * Cross-platform keyboard helpers (macOS Cmd / Windows+Linux Ctrl).
 */

type ModKeyEvent = { metaKey: boolean; ctrlKey: boolean };

/** True when Cmd (macOS) or Ctrl (Windows/Linux) is held. */
export function isModKey(event: ModKeyEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

export type ListboxNavAction =
  | { type: "move"; index: number }
  | { type: "select" }
  | { type: "close" }
  | { type: "none" };

type ListboxNavOptions = {
  /** When true, Space selects (listbox triggers). Keep false for search inputs. */
  spaceSelects?: boolean;
};

/**
 * Resolve Arrow/Home/End/Enter/Space/Escape for listbox / combobox menus.
 * Returns `none` for unhandled keys (caller should not preventDefault).
 */
export function resolveListboxNavKey(
  key: string,
  highlightIndex: number,
  length: number,
  options: ListboxNavOptions = {},
): ListboxNavAction {
  if (key === "Escape") return { type: "close" };
  if (length <= 0) return { type: "none" };

  if (key === "ArrowDown") {
    return { type: "move", index: Math.min(highlightIndex + 1, length - 1) };
  }
  if (key === "ArrowUp") {
    return { type: "move", index: Math.max(highlightIndex - 1, 0) };
  }
  if (key === "Home") return { type: "move", index: 0 };
  if (key === "End") return { type: "move", index: length - 1 };
  if (key === "Enter" || (options.spaceSelects && key === " ")) {
    return { type: "select" };
  }
  return { type: "none" };
}
