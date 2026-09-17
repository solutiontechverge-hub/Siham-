"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import type {
  BusinessPublicProfileData,
  BusinessPublicProfileService,
} from "../../../data/businessPublicProfile.data";
import { BusinessPublicProfileServicesBlock } from "./BusinessPublicProfileServicesBlock";
import { BusinessPublicProfileTeamBlock } from "./BusinessPublicProfileTeamBlock";
import { BusinessPublicProfileNotesBlock } from "./BusinessPublicProfileNotesBlock";
import { BusinessPublicProfilePortfolioBlock } from "./BusinessPublicProfilePortfolioBlock";

export function BusinessPublicProfileBodySections(props: {
  data: BusinessPublicProfileData;
  effectiveLocationMode: "fixed" | "desired";
  showKilometerAllowance: boolean;
  showProjectHeader: boolean;
  projectEnabled: boolean;
  setProjectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  showProjectSection: boolean;
  portfolioLightboxIndex: number | null;
  setPortfolioLightboxIndex: React.Dispatch<React.SetStateAction<number | null>>;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  serviceQty: Record<string, number>;
  selectedServiceIds: Record<string, boolean>;
  memberSlotSelections: Record<string, string>;
  setMemberSlotSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  visibleTeamMembers: BusinessPublicProfileData["teamMembers"];
  filteredServices: BusinessPublicProfileService[];
  toggleService: (id: string, checked: boolean) => void;
  adjustQty: (id: string, delta: number) => void;
  selectionSummary: { count: number };
}) {
  const p = props;
  return (
    <Stack spacing={2}>
      <BusinessPublicProfileServicesBlock
        data={p.data}
        effectiveLocationMode={p.effectiveLocationMode}
        showProjectHeader={p.showProjectHeader}
        projectEnabled={p.projectEnabled}
        setProjectEnabled={p.setProjectEnabled}
        showProjectSection={p.showProjectSection}
        activeCategory={p.activeCategory}
        setActiveCategory={p.setActiveCategory}
        serviceQty={p.serviceQty}
        selectedServiceIds={p.selectedServiceIds}
        filteredServices={p.filteredServices}
        toggleService={p.toggleService}
        adjustQty={p.adjustQty}
      />
      <BusinessPublicProfileTeamBlock
        data={p.data}
        visibleTeamMembers={p.visibleTeamMembers}
        memberSlotSelections={p.memberSlotSelections}
        setMemberSlotSelections={p.setMemberSlotSelections}
      />
      <BusinessPublicProfileNotesBlock
        data={p.data}
        showKilometerAllowance={p.showKilometerAllowance}
      />
      <BusinessPublicProfilePortfolioBlock
        data={p.data}
        portfolioLightboxIndex={p.portfolioLightboxIndex}
        setPortfolioLightboxIndex={p.setPortfolioLightboxIndex}
      />
      {p.selectionSummary.count > 0 ? <Box sx={{ height: 76 }} /> : null}
    </Stack>
  );
}
