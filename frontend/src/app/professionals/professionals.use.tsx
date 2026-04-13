"use client";

import { useTheme } from "@mui/material/styles";

export function useProfessionalsTokens() {
  return useTheme().palette.mollure;
}

