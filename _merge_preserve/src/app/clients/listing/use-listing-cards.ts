"use client";

import * as React from "react";
import { useGetAllBusinessSetupsQuery } from "../../../store/services/businessApi";
import type { ListingCardData } from "./listing.data";
import { mapBusinessSetupsToListingCards } from "./listing.mappers";

export function useListingCards() {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllBusinessSetupsQuery();

  const cards = React.useMemo<ListingCardData[]>(() => {
    if (!data?.data?.length) {
      return [];
    }
    return mapBusinessSetupsToListingCards(data.data);
  }, [data]);

  return {
    cards,
    isLoading: isLoading || isFetching,
    isError,
    error,
    refetch,
  };
}
