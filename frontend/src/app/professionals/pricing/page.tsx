"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { MarketingShellLayout } from "../../../components/marketing";
import PricingPageContent from "../../../components/professionals/pricing/PricingPageContent";

export default function PricingPage() {
  const tokens = useTheme().palette.mollure;

  return (
    <MarketingShellLayout
      audience="professionals"
      contentSx={{ bgcolor: tokens.surface, color: tokens.navy }}
      footerSx={{ mt: 2 }}
    >
      <PricingPageContent />
    </MarketingShellLayout>
  );
}

