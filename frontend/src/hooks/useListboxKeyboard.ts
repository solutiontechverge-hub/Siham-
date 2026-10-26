"use client";

import * as React from "react";
import { resolveListboxNavKey } from "../lib/keyboard";

type UseListboxKeyboardOptions = {
  length: number;
  open: boolean;
  /** Reset highlight when this changes (e.g. search query). */
  resetKey?: string | number;
  onSelect: (index: number) => void;
  spaceSelects?: boolean;
};

/**
 * Highlight + keydown helpers for searchable / custom listbox menus.
 * Escape is left unhandled so native Select/Menu close still works.
 */
export function useListboxKeyboard({
  length,
  open,
  resetKey = "",
  onSelect,
  spaceSelects = false,
}: UseListboxKeyboardOptions) {
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const itemRefs = React.useRef<Array<HTMLElement | null>>([]);

  React.useEffect(() => {
    setHighlightIndex(0);
    itemRefs.current = [];
  }, [resetKey, open]);

  React.useEffect(() => {
    if (!open || length === 0) return;
    itemRefs.current[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open, length]);

  const handleListKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Let Escape bubble so MUI Select / Menu can dismiss.
      if (event.key === "Escape") return;

      const action = resolveListboxNavKey(
        event.key,
        highlightIndex,
        length,
        { spaceSelects },
      );
      if (action.type !== "move" && action.type !== "select") return;

      event.preventDefault();
      event.stopPropagation();

      if (action.type === "move") {
        setHighlightIndex(action.index);
        return;
      }
      onSelect(highlightIndex);
    },
    [highlightIndex, length, onSelect, spaceSelects],
  );

  return {
    highlightIndex,
    setHighlightIndex,
    itemRefs,
    handleListKeyDown,
  };
}
