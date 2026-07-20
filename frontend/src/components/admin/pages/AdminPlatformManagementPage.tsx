"use client";

import * as React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import AdminKpiCard from "../AdminKpiCard";
import AdminPageHeader from "../AdminPageHeader";
import AdminUnderlineTabs from "../AdminUnderlineTabs";
import { AdminDashboardFooter } from "../AdminDashboardHeader";
import {
  FlaggedReviewsWidget,
  RankingWeightSummaryWidget,
  RecentContactMessagesWidget,
  RecentReportsWidget,
  ReviewRatingCategoriesWidget,
  SeoQuickLinksWidget,
} from "../AdminPlatformManagementWidgets";
import AdminListingRankingPage from "./AdminListingRankingPage";
import AdminReviewsPage from "./AdminReviewsPage";
import AdminReportsPage from "./AdminReportsPage";
import AdminMessagingPage from "./AdminMessagingPage";
import {
  PLATFORM_MANAGEMENT_TABS,
  platformManagementKpis,
  type PlatformManagementTabId,
} from "../platformManagementData";

const KPI_ICONS: Record<string, SvgIconComponent> = {
  professionals: BusinessOutlinedIcon,
  clients: PeopleOutlinedIcon,
  bookings: EventAvailableOutlinedIcon,
  reviews: StarOutlineOutlinedIcon,
  reported: FlagOutlinedIcon,
};

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
  ranking: <AdminListingRankingPage embedded />,
  reviews: <AdminReviewsPage embedded />,
  reports: <AdminReportsPage embedded />,
  messaging: <AdminMessagingPage embedded />,
};

export default function AdminPlatformManagementPage() {
  const [activeTab, setActiveTab] = React.useState<PlatformManagementTabId>("overview");

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
