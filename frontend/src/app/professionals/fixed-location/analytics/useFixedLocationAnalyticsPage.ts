"use client";

import * as React from "react";
import {
  useGetBusinessSetupQuery,
  useGetCalendarOverviewQuery,
} from "../../../../store/services/businessApi";
import { useGetFinanceTransactionsQuery } from "../../../../store/services/financeApi";
import { useGetReviewsQuery } from "../../../../store/services/reviewsApi";
import { mapProfessionalAnalytics } from "./mapProfessionalAnalytics";

function rangeLastDays(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: toIso(start), endDate: toIso(end) };
}

export function useFixedLocationAnalyticsPage() {
  const range = React.useMemo(() => rangeLastDays(365), []);

  const { data: setupResponse } = useGetBusinessSetupQuery({ includeDraft: false });
  const setup = setupResponse?.data ?? null;

  const { data: calendarResponse, isLoading: calendarLoading } =
    useGetCalendarOverviewQuery(range);
  const { data: financeResponse, isLoading: financeLoading } =
    useGetFinanceTransactionsQuery({ limit: 500 });
  const { data: reviewsResponse, isLoading: reviewsLoading } = useGetReviewsQuery(
    { businessSetupId: setup?.id ?? "" },
    { skip: !setup?.id },
  );

  const data = React.useMemo(() => {
    return mapProfessionalAnalytics({
      bookings: calendarResponse?.data?.bookings ?? [],
      transactions: financeResponse?.data?.rows ?? [],
      reviews: reviewsResponse?.data?.reviews ?? [],
      stats: reviewsResponse?.data?.stats ?? null,
      setup,
    });
  }, [calendarResponse?.data?.bookings, financeResponse?.data?.rows, reviewsResponse?.data, setup]);

  return {
    data,
    isLoading: calendarLoading || financeLoading || reviewsLoading,
  };
}
