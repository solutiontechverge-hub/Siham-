"use client";

import { Suspense } from "react";
import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
import ProfessionalFixedLocationAnalytics from "../../../../components/common/ProfessionalFixedLocationAnalytics";
import { professionalFixedLocationAnalyticsData } from "./analytics.data";

export default function FixedLocationAnalyticsPage() {
  return (
    <FixedLocationPageScaffold activeTopTab="Analytics" topTabs={fixedLocationTopTabs}>
      <Suspense>
        <ProfessionalFixedLocationAnalytics data={professionalFixedLocationAnalyticsData} />
      </Suspense>
    </FixedLocationPageScaffold>
  );
}

