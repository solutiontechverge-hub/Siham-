"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import type { ListingFilterValues } from "../../components/common";

export function useProfessionalTokens() {
  return useTheme().palette.mollure;
}

const initialFilters: ListingFilterValues = {
  dateTime: null,
  category: "",
  municipality: "",
  keyword: "",
  locationMode: "fixed",
};

export function useProfessionalListingFilters() {
  const [filters, setFilters] = React.useState<ListingFilterValues>(initialFilters);

  const apply = React.useCallback(() => {
    return filters;
  }, [filters]);

  return { filters, setFilters, apply };
}

