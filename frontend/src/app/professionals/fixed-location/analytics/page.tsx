"use client";

import { Suspense } from "react";
import ProfessionalFixedLocationAnalytics from "../../../../components/common/ProfessionalFixedLocationAnalytics";
import { professionalFixedLocationAnalyticsData } from "./analytics.data";

export default function FixedLocationAnalyticsPage() {
  return (
    <Suspense>
      <ProfessionalFixedLocationAnalytics data={professionalFixedLocationAnalyticsData} />
    </Suspense>
  );
}

