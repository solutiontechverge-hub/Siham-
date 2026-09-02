"use client";

import { Suspense } from "react";
import ProfessionalFixedLocationAnalytics from "../../../../components/common/ProfessionalFixedLocationAnalytics";
import { useFixedLocationAnalyticsPage } from "./useFixedLocationAnalyticsPage";

function AnalyticsContent() {
  const { data } = useFixedLocationAnalyticsPage();
  return <ProfessionalFixedLocationAnalytics data={data} />;
}

export default function FixedLocationAnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsContent />
    </Suspense>
  );
}
