"use client";

import * as React from "react";
import { defaultDashboardRange, getTrendLabel } from "../../dashboardRangeUtils";
import { useGetAdminDashboardQuery } from "../../../../store/services/adminApi";

export function useAdminDashboardPage() {
  const [range, setRange] = React.useState(defaultDashboardRange);

  const queryArgs = React.useMemo(
    () => ({
      preset: range.preset,
      from: range.preset === "custom" ? range.customStart : undefined,
      to: range.preset === "custom" ? range.customEnd : undefined,
    }),
    [range],
  );

  const { data, isLoading, isFetching, isError, error } =
    useGetAdminDashboardQuery(queryArgs, {
      refetchOnMountOrArgChange: true,
    });

  const dashboard = data?.data;
  const trendLabel = getTrendLabel(range.preset);
  const showInitialLoader = isLoading && !dashboard;

  return {
    range,
    setRange,
    dashboard,
    trendLabel,
    showInitialLoader,
    isFetching,
    isError,
    error,
  };
}
