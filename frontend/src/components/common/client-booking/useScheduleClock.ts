"use client";

import * as React from "react";

/** Ticking "now" so booking status/tabs follow wall-clock date+time. */
export function useScheduleClock(intervalMs = 15_000): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    const onFocus = () => setNow(new Date());
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);
  return now;
}
