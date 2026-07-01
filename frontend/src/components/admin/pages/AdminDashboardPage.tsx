"use client";

import * as React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import AdminKpiCard from "../AdminKpiCard";
import { AdminLineChart, ADMIN_CHART_COLORS } from "../AdminCharts";
import AdminDashboardHeader, { AdminDashboardFooter } from "../AdminDashboardHeader";
import {
  ActivityLogWidget,
  QuickLinksWidget,
  SummaryOverviewWidget,
  SystemStatusWidget,
  TopProfessionalsWidget,
} from "../AdminDashboardWidgets";
import {
  defaultDashboardRange,
  getBookingsChartData,
  getDashboardKpiMetrics,
  getTrendLabel,
} from "../dashboardRangeUtils";

const KPI_ICONS: Record<string, SvgIconComponent> = {
  business: BusinessOutlinedIcon,
  people: PeopleOutlinedIcon,
  person: PersonOutlineOutlinedIcon,
  company: ApartmentOutlinedIcon,
  online: EventAvailableOutlinedIcon,
  offline: StorefrontOutlinedIcon,
};

export default function AdminDashboardPage() {
  const [range, setRange] = React.useState(defaultDashboardRange);

  const kpiMetrics = React.useMemo(() => getDashboardKpiMetrics(range), [range]);
  const chartData = React.useMemo(() => getBookingsChartData(range), [range]);
  const trendLabel = getTrendLabel(range.preset);

  return (
    <>
      <AdminDashboardHeader range={range} onRangeChange={setRange} />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {kpiMetrics.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
            <AdminKpiCard
              label={kpi.label}
              value={kpi.value}
              trend={kpi.trend}
              trendLabel={trendLabel}
              icon={KPI_ICONS[kpi.icon]}
              compact
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <AdminLineChart
            title="Bookings Overview"
            description="Online vs offline completed bookings"
            data={chartData}
            xKey="date"
            lines={[
              { dataKey: "online", name: "Online Bookings", color: ADMIN_CHART_COLORS.primary },
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
            <TopProfessionalsWidget />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
          <Box sx={{ height: "100%" }}>
            <ActivityLogWidget />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 6 }}>
          <SummaryOverviewWidget />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SystemStatusWidget />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <QuickLinksWidget />
        </Grid>
      </Grid>

      <AdminDashboardFooter />
    </>
  );
}
