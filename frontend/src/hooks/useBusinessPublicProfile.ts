"use client";

import * as React from "react";
import { mapBusinessPublicProfileFromSetups } from "../app/clients/listing/businessPublicProfile.mapper";
import type { BusinessPublicProfileData } from "../data/businessPublicProfile.data";
import { useGetAllBusinessSetupsQuery } from "../store/services/businessApi";

export function useBusinessPublicProfile(shopId: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useGetAllBusinessSetupsQuery();

  const profile = React.useMemo<BusinessPublicProfileData | null>(() => {
    if (!shopId) return null;
    return mapBusinessPublicProfileFromSetups(shopId, data?.data);
  }, [data?.data, shopId]);

  return {
    profile,
    setups: data?.data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
