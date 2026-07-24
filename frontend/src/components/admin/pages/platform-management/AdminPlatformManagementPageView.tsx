"use client";

import * as React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import AdminKpiCard from "../../AdminKpiCard";
import AdminPageHeader from "../../AdminPageHeader";
import AdminUnderlineTabs from "../../AdminUnderlineTabs";
import { AdminDashboardFooter } from "../../AdminDashboardHeader";
import {
  FlaggedReviewsWidget,
  RankingWeightSummaryWidget,
  RecentContactMessagesWidget,
  RecentReportsWidget,
  ReviewRatingCategoriesWidget,
  SeoQuickLinksWidget,
} from "../../AdminPlatformManagementWidgets";
import AdminListingRankingPageView from "../listing-ranking";
import AdminReviewsPageView from "../reviews";
import AdminReportsPageView from "../reports";
import AdminMessagingPageView from "../messaging";
import {
  PLATFORM_MANAGEMENT_TABS,
  platformManagementKpis,
  type PlatformManagementTabId,
} from "../../platformManagementData";
import { KPI_ICONS } from "./platform-management.data";
import { useAdminPlatformManagementPage } from "./useAdminPlatformManagementPage";

function PlatformOverviewContent() {
  return (
    <>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {platformManagementKpis.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
            <AdminKpiCard
              label={kpi.label}
              value={kpi.value}
              trend={kpi.trend}
              trendLabel="vs last 30 days"
              icon={KPI_ICONS[kpi.iconKey]}
              iconColor={kpi.iconColor}
              iconBg={kpi.iconBg}
              invertTrend={"invertTrend" in kpi ? kpi.invertTrend : false}
              compact
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ height: "100%" }}>
            <RankingWeightSummaryWidget />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ height: "100%" }}>
            <FlaggedReviewsWidget />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ height: "100%" }}>
            <RecentReportsWidget />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 4 }}>
          <RecentContactMessagesWidget />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ReviewRatingCategoriesWidget />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SeoQuickLinksWidget />
        </Grid>
      </Grid>
    </>
  );
}

const TAB_PANELS: Record<PlatformManagementTabId, React.ReactNode> = {
  overview: <PlatformOverviewContent />,
  ranking: <AdminListingRankingPageView embedded />,
  reviews: <AdminReviewsPageView embedded />,
  reports: <AdminReportsPageView embedded />,
  messaging: <AdminMessagingPageView embedded />,
};

export default function AdminPlatformManagementPageView() {
  const { activeTab, setActiveTab } = useAdminPlatformManagementPage();

  return (
    <>
      <AdminPageHeader
        title="Platform Management"
        description="Manage platform settings, ranking, reviews, reports and communications."
      />

      <AdminUnderlineTabs
        tabs={PLATFORM_MANAGEMENT_TABS}
        value={activeTab}
        onChange={(id) => setActiveTab(id as PlatformManagementTabId)}
      />

      <Box role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {TAB_PANELS[activeTab]}
      </Box>

      <AdminDashboardFooter />
    </>
  );
}
