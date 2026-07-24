"use client";

import {
  Box,
  CircularProgress,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import { useTheme } from "@mui/material/styles";
import AdminKpiCard from "../../AdminKpiCard";
import { AdminLineChart, ADMIN_CHART_COLORS } from "../../AdminCharts";
import AdminDashboardHeader, {
  AdminDashboardFooter,
} from "../../AdminDashboardHeader";
import {
  ActivityLogWidget,
  QuickLinksWidget,
  SummaryOverviewWidget,
  SystemStatusWidget,
  TopProfessionalsWidget,
} from "../../AdminDashboardWidgets";
import { KPI_ICONS } from "./dashboard.data";
import { useAdminDashboardPage } from "./useAdminDashboardPage";

export default function AdminDashboardPageView() {
  const tokens = useTheme().palette.mollure;
  const {
    range,
    setRange,
    dashboard,
    trendLabel,
    showInitialLoader,
    isFetching,
    isError,
    error,
  } = useAdminDashboardPage();

  return (
    <>
      <AdminDashboardHeader range={range} onRangeChange={setRange} />

      {showInitialLoader ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress size={32} sx={{ color: tokens.teal }} />
        </Box>
      ) : null}

      {isError ? (
        <Box sx={{ mb: 1.5, p: 2, borderRadius: 2, bgcolor: tokens.surface }}>
          <Typography sx={{ fontSize: 13, color: tokens.bodyText }}>
            {(error as { data?: { message?: string } })?.data?.message ||
              "Failed to load dashboard data."}
          </Typography>
        </Box>
      ) : null}

      {dashboard ? (
        <>
          <Grid
            container
            spacing={1.5}
            sx={{ mb: 1.5, opacity: isFetching ? 0.72 : 1 }}
          >
            {dashboard.kpis.map((kpi) => (
              <Grid
                key={kpi.key || kpi.label}
                size={{ xs: 12, sm: 6, md: 4, xl: 2 }}
              >
                <AdminKpiCard
                  label={kpi.label}
                  value={kpi.value}
                  trend={kpi.trend}
                  trendLabel={trendLabel}
                  icon={KPI_ICONS[kpi.icon] || BusinessOutlinedIcon}
                  compact
                />
              </Grid>
            ))}
          </Grid>

          <Grid
            container
            spacing={1.5}
            sx={{ mb: 1.5, opacity: isFetching ? 0.72 : 1 }}
          >
            <Grid size={{ xs: 12, lg: 5 }}>
              <AdminLineChart
                title="Bookings Overview"
                description="Online vs offline completed bookings"
                data={dashboard.bookingsChart}
                xKey="date"
                lines={[
                  {
                    dataKey: "online",
                    name: "Online Bookings",
                    color: ADMIN_CHART_COLORS.primary,
                  },
                  {
                    dataKey: "offline",
                    name: "Offline Bookings",
                    color: ADMIN_CHART_COLORS.navy,
                    dashed: true,
                  },
                ]}
                height={250}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
              <Box sx={{ height: "100%" }}>
                <TopProfessionalsWidget
                  professionals={dashboard.topProfessionals}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
              <Box sx={{ height: "100%" }}>
                <ActivityLogWidget items={dashboard.recentActivity} />
              </Box>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={1.5}
            alignItems="stretch"
            sx={{ opacity: isFetching ? 0.72 : 1 }}
          >
            <Grid size={{ xs: 12, lg: 6 }}>
              <SummaryOverviewWidget rows={dashboard.summaryOverview} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SystemStatusWidget items={dashboard.systemStatus} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <QuickLinksWidget />
            </Grid>
          </Grid>
        </>
      ) : null}

      <AdminDashboardFooter />
    </>
  );
}
