"use client";

import * as React from "react";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import { businessPublicProfileUiCopy } from "../../../data/businessPublicProfile.data";
import type { PublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import { useBusinessPublicProfileView } from "./useBusinessPublicProfileView";
import {
  PublicProfilePageShell,
  PublicProfileTopBar,
} from "./BusinessPublicProfileShell";
import { BusinessPublicProfileShopCard } from "./BusinessPublicProfileShopCard";
import { BusinessPublicProfileBodySections } from "./BusinessPublicProfileBodySections";
import { BusinessPublicProfileBookBanner } from "./BusinessPublicProfileBookBanner";

export type BusinessPublicProfileProps = {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  onLocationModeChange?: (mode: "fixed" | "desired") => void;
  onBookNow: (selection: PublicProfileBookingSelection) => void;
  pageTitle?: string;
  publicProfileTitle?: string;
};

export default function BusinessPublicProfile({
  data,
  locationMode,
  onLocationModeChange,
  onBookNow,
  pageTitle = businessPublicProfileUiCopy.defaultPageTitle,
  publicProfileTitle = businessPublicProfileUiCopy.defaultPublicProfileTitle,
}: BusinessPublicProfileProps) {
  const view = useBusinessPublicProfileView({ data, locationMode, onBookNow });

  return (
    <>
      <PublicProfilePageShell>
        <PublicProfileTopBar title={publicProfileTitle} />
        <BusinessPublicProfileShopCard
          data={data}
          pageTitle={pageTitle}
          effectiveLocationMode={view.effectiveLocationMode}
          onLocationModeChange={onLocationModeChange}
          heroSlides={view.heroSlides}
          visibleTeamMembers={view.visibleTeamMembers}
          scheduleLabel={view.scheduleLabel}
          selectedScheduleLabel={view.selectedScheduleLabel}
          scheduleOpen={view.scheduleOpen}
          setScheduleOpen={view.setScheduleOpen}
          scheduleAnchorRef={view.scheduleAnchorRef}
          selectedScheduleId={view.selectedScheduleId}
          setSelectedScheduleId={view.setSelectedScheduleId}
        />
        <BusinessPublicProfileBodySections
          data={data}
          effectiveLocationMode={view.effectiveLocationMode}
          showKilometerAllowance={view.showKilometerAllowance}
          showProjectHeader={view.showProjectHeader}
          projectEnabled={view.projectEnabled}
          setProjectEnabled={view.setProjectEnabled}
          showProjectSection={view.showProjectSection}
          portfolioLightboxIndex={view.portfolioLightboxIndex}
          setPortfolioLightboxIndex={view.setPortfolioLightboxIndex}
          activeCategory={view.activeCategory}
          setActiveCategory={view.setActiveCategory}
          serviceQty={view.serviceQty}
          selectedServiceIds={view.selectedServiceIds}
          memberSlotSelections={view.memberSlotSelections}
          setMemberSlotSelections={view.setMemberSlotSelections}
          visibleTeamMembers={view.visibleTeamMembers}
          filteredServices={view.filteredServices}
          toggleService={view.toggleService}
          adjustQty={view.adjustQty}
          selectionSummary={view.selectionSummary}
        />
      </PublicProfilePageShell>
      <BusinessPublicProfileBookBanner
        selectionSummary={view.selectionSummary}
        onBookNow={view.handleBookNow}
      />
    </>
  );
}
