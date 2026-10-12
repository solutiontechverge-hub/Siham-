"use client";

import * as React from "react";
import {
  useGetBusinessSetupQuery,
  useGetCalendarOverviewQuery,
} from "../../../../store/services/businessApi";
import { useGetFinanceAnalyticsQuery } from "../../../../store/services/financeApi";
import { useGetReviewsQuery } from "../../../../store/services/reviewsApi";
import { mapProfessionalAnalytics } from "./mapProfessionalAnalytics";

function rangeLastDays(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: toIso(start), endDate: toIso(end) };
}

export type FixedLocationAnalyticsPageArgs = {
  fromDate?: string;
  toDate?: string;
};

export function useFixedLocationAnalyticsPage(args: FixedLocationAnalyticsPageArgs = {}) {
  const defaultRange = React.useMemo(() => rangeLastDays(365), []);
  const startDate = args.fromDate?.trim() || defaultRange.startDate;
  const endDate = args.toDate?.trim() || defaultRange.endDate;

  const { data: setupResponse } = useGetBusinessSetupQuery({ includeDraft: false });
  const setup = setupResponse?.data ?? null;

  const { data: calendarResponse, isLoading: calendarLoading } =
    useGetCalendarOverviewQuery({ startDate, endDate });
  const { data: financeResponse, isLoading: financeLoading } =
    useGetFinanceAnalyticsQuery({ fromDate: startDate, toDate: endDate });
  const { data: reviewsResponse, isLoading: reviewsLoading } = useGetReviewsQuery(
    { businessSetupId: setup?.id ?? "" },
    { skip: !setup?.id },
  );

  const data = React.useMemo(() => {
    return mapProfessionalAnalytics({
      bookings: calendarResponse?.data?.bookings ?? [],
      transactions: financeResponse?.data?.rows ?? [],
      financeSalesVolume: financeResponse?.data?.salesVolume ?? null,
      financeTransactionSummary: financeResponse?.data?.transactionSummary ?? null,
      reviews: reviewsResponse?.data?.reviews ?? [],
      stats: reviewsResponse?.data?.stats ?? null,
      setup,
    });
  }, [
    calendarResponse?.data?.bookings,
    financeResponse?.data?.rows,
    financeResponse?.data?.salesVolume,
    financeResponse?.data?.transactionSummary,
    reviewsResponse?.data,
    setup,
  ]);

  return {
    data,
    isLoading: calendarLoading || financeLoading || reviewsLoading,
    range: { startDate, endDate },
  };
}
