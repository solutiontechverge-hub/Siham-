"use client";

import * as React from "react";

const SESSION_KEY = "mollure:checkout_booking_ref";

/** Stable booking ref for the current checkout session. */
export function useCheckoutBookingRef() {
  return React.useMemo(() => {
    if (typeof window === "undefined") return "B000000";
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const ref = `B${String(Date.now()).slice(-6)}`;
    window.sessionStorage.setItem(SESSION_KEY, ref);
    return ref;
  }, []);
}
