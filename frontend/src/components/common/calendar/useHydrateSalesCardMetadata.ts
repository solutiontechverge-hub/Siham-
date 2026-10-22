"use client";

import * as React from "react";
import { useGetSalesCardMetadataQuery } from "../../../store/services/financeApi";
import { hydrateSalesCardMetadata } from "./salesOverview.storage";
import type { SalesCardMetaRecord } from "./salesOverview.types";

/**
 * One RTK fetch for all sales-card meta (shared cache). Call from calendar root
 * so Booking + Sales tabs reuse memory without waiting on Sales mount.
 */
export function useHydrateSalesCardMetadata() {
  const { data: salesMetadataResponse } = useGetSalesCardMetadataQuery();

  React.useEffect(() => {
    hydrateSalesCardMetadata(
      (salesMetadataResponse?.data ?? []) as SalesCardMetaRecord[],
    );
  }, [salesMetadataResponse?.data]);

  return salesMetadataResponse;
}
