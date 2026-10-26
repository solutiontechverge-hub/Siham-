"use client";

import * as React from "react";
import { useGetBookingFinancialsQuery } from "../../../store/services/financeApi";
import type { BookingFinanceViewModel } from "./bookingFinance.types";
import { mapBookingFinanceResponse } from "./mapBookingFinance";

export type UseBookingFinanceResult = {
  finance: BookingFinanceViewModel | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  bookingId: string;
  refetch: () => void;
};

/**
 * Unified booking financials for Finances dashboard + Calendar Sale Drawer.
 * Source of truth: GET /api/finance/bookings/:bookingId/financials (ledger aggregates).
 */
export function useBookingFinance(
  bookingId: string | null | undefined,
  opts?: { skip?: boolean },
): UseBookingFinanceResult {
  const id = String(bookingId ?? "").trim();
  const skip = Boolean(opts?.skip) || !id;

  const { data, isLoading, isFetching, isError, refetch, isUninitialized } =
    useGetBookingFinancialsQuery(id, {
      skip,
      refetchOnMountOrArgChange: true,
    });

  const finance = React.useMemo(() => {
    const payload = data?.data;
    if (!payload?.bookingId) return null;
    return mapBookingFinanceResponse({
      bookingId: payload.bookingId,
      uniqueCode: payload.uniqueCode,
      financials: payload.financials as never,
      statuses: payload.statuses,
      ledger: payload.ledger,
      bookingStatus: payload.statuses?.booking_status,
    });
  }, [data?.data]);

  return {
    finance,
    isLoading: !skip && isLoading,
    isFetching: !skip && isFetching,
    isError: !skip && isError,
    bookingId: id,
    refetch: () => {
      if (isUninitialized) return;
      void refetch();
    },
  };
}
