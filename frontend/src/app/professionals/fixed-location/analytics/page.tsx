"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import DynamicChunkFallback from "../../../../components/common/DynamicChunkFallback";
import { useFixedLocationAnalyticsPage } from "./useFixedLocationAnalyticsPage";

const ProfessionalFixedLocationAnalytics = dynamic(
  () => import("../../../../components/common/ProfessionalFixedLocationAnalytics"),
  { ssr: false, loading: () => <DynamicChunkFallback /> },
);

function AnalyticsContent() {
  const { data } = useFixedLocationAnalyticsPage();
  return <ProfessionalFixedLocationAnalytics data={data} />;
}

export default function FixedLocationAnalyticsPage() {
  return (
    <Suspense fallback={<DynamicChunkFallback />}>
      <AnalyticsContent />
    </Suspense>
  );
}
