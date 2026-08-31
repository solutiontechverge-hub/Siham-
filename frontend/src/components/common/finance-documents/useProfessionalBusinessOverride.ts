"use client";

import * as React from "react";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import {
  useGetProfileQuery,
  type ProfessionalProfile,
} from "../../../store/services/profileApi";
import { buildProfessionalBusinessOverride } from "./buildProfessionalBusinessOverride";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";

export function useProfessionalBusinessOverride(): FinanceProfessionalBusinessOverride | null {
  const { data: setupData } = useGetBusinessSetupQuery({ includeDraft: false });
  const { data: profileResponse } = useGetProfileQuery();

  return React.useMemo(() => {
    const profile =
      profileResponse?.data?.user_type === "professional"
        ? (profileResponse.data.profile as ProfessionalProfile | null)
        : null;
    const override = buildProfessionalBusinessOverride({
      setup: setupData?.data ?? null,
      profile,
    });
    if (!override.shopName && !override.legalName && !override.phone && !override.address) {
      return null;
    }
    return override;
  }, [profileResponse?.data, setupData?.data]);
}
