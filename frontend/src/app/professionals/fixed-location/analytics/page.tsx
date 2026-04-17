"use client";

import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
import ProfessionalFixedLocationAnalytics from "../../../../components/common/ProfessionalFixedLocationAnalytics";
import { professionalFixedLocationAnalyticsData } from "./analytics.data";

export default function FixedLocationAnalyticsPage() {
  return (
    <FixedLocationPageScaffold activeTopTab="Analytics" topTabs={fixedLocationTopTabs}>
      <ProfessionalFixedLocationAnalytics data={professionalFixedLocationAnalyticsData} />
    </FixedLocationPageScaffold>
  );
}

