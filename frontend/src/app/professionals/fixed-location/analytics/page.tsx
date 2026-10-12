"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import DynamicChunkFallback from "../../../../components/common/DynamicChunkFallback";
import { useFixedLocationAnalyticsPage } from "./useFixedLocationAnalyticsPage";

const ProfessionalFixedLocationAnalytics = dynamic(
  () => import("../../../../components/common/ProfessionalFixedLocationAnalytics"),
  { ssr: false, loading: () => <DynamicChunkFallback /> },
);

function AnalyticsContent() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data } = useFixedLocationAnalyticsPage({ fromDate, toDate });
  return (
    <ProfessionalFixedLocationAnalytics
      data={data}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
    />
  );
}

export default function FixedLocationAnalyticsPage() {
  return (
    <Suspense fallback={<DynamicChunkFallback />}>
      <AnalyticsContent />
    </Suspense>
  );
}
