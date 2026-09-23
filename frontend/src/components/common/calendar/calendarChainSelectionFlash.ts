import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { resolveCalendarBookingIdentity } from "./calendar-overlap.utils";

/** Theme teal `#21B8BF` — keep flash independent of React state across lanes. */
const FLASH_OUTLINE = "2px solid #21B8BF";
const FLASH_SHADOW = "0 0 0 3px rgba(33, 184, 191, 0.28)";
const FLASH_MS = 220;

const STYLE_KEYS = [
  "outline",
  "outlineOffset",
  "boxShadow",
  "zIndex",
  "transition",
] as const;

export function bookingChainSelectionKey(
  event: Pick<CalendarEvent, "id" | "bookingCode">,
) {
  return resolveCalendarBookingIdentity(event).trim().toLowerCase();
}

/** Briefly outline every calendar card in the same booking chain, then run `then`. */
export function flashBookingChainThen(
  event: Pick<CalendarEvent, "id" | "bookingCode">,
  then: () => void,
  ms: number = FLASH_MS,
) {
  const key = bookingChainSelectionKey(event);
  if (!key || typeof document === "undefined") {
    then();
    return;
  }

  const nodes = document.querySelectorAll<HTMLElement>(
    `[data-booking-chain="${CSS.escape(key)}"]`,
  );
  const prev = new Map<HTMLElement, Partial<Record<(typeof STYLE_KEYS)[number], string>>>();

  for (const el of nodes) {
    prev.set(el, {
      outline: el.style.outline,
      outlineOffset: el.style.outlineOffset,
      boxShadow: el.style.boxShadow,
      zIndex: el.style.zIndex,
      transition: el.style.transition,
    });
    el.style.transition = "outline 80ms ease, box-shadow 80ms ease";
    el.style.outline = FLASH_OUTLINE;
    el.style.outlineOffset = "1px";
    el.style.boxShadow = FLASH_SHADOW;
    el.style.zIndex = "20";
  }

  window.setTimeout(() => {
    for (const el of nodes) {
      const saved = prev.get(el);
      if (!saved) continue;
      for (const k of STYLE_KEYS) {
        el.style[k] = saved[k] ?? "";
      }
    }
    then();
  }, ms);
}
