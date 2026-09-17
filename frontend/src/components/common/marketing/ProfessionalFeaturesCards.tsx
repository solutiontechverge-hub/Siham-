"use client";

import { Stack } from "@mui/material";
import { BusinessSetupCard } from "./ProfessionalFeaturesBusinessSetupCard";
import { CalendarSchedulingCard } from "./ProfessionalFeaturesCalendarCard";
import { InteractiveBookingFlowCard } from "./ProfessionalFeaturesBookingFlowCard";
import { ClientManagementInsightsCard } from "./ProfessionalFeaturesClientInsightsCard";
import { PaymentsInvoicingFinancialControlCard } from "./ProfessionalFeaturesPaymentsCard";
import { AnalyticsPerformanceCard } from "./ProfessionalFeaturesAnalyticsCard";
import { NotificationsCard } from "./ProfessionalFeaturesNotificationsCard";

export function ProfessionalFeaturesCards() {
  return (
    <Stack spacing={2.5}>
      <BusinessSetupCard />
      <CalendarSchedulingCard />
      <InteractiveBookingFlowCard />
      <ClientManagementInsightsCard />
      <PaymentsInvoicingFinancialControlCard />
      <AnalyticsPerformanceCard />
      <NotificationsCard />
    </Stack>
  );
}
