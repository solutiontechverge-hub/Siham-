"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  bookingCompletedPageData,
  type BookingCompletedOutcome,
} from "./bookingCompleted.data";

export type { BookingCompletedOutcome };

export function useBookingCompletedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outcome: BookingCompletedOutcome =
    searchParams?.get("outcome") === "requested" ? "requested" : "completed";
  const title = bookingCompletedPageData.titles[outcome];
  const [secondsLeft, setSecondsLeft] = React.useState(
    bookingCompletedPageData.redirectSeconds as number,
  );

  React.useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  React.useEffect(() => {
    if (secondsLeft > 0) return;
    router.replace(bookingCompletedPageData.bookingsHref);
  }, [router, secondsLeft]);

  const goToBookings = () => {
    router.push(bookingCompletedPageData.bookingsHref);
  };

  return {
    title,
    secondsLeft,
    goToBookings,
    copy: bookingCompletedPageData,
  };
}
