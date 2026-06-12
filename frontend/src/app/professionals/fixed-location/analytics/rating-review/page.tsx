"use client";

import { Suspense } from "react";
import FixedLocationPageScaffold from "../../../../../components/common/FixedLocationPageScaffold";
import ProfessionalFixedLocationRatingReviewsPage from "../../../../../components/common/ProfessionalFixedLocationRatingReviewsPage";
import { professionalFixedLocationAnalyticsData } from "../analytics.data";
import { fixedLocationTopTabs } from "../../fixedLocationTopTabs";

export default function FixedLocationRatingReviewPage() {
  const { ratingReview } = professionalFixedLocationAnalyticsData;

  return (
    <FixedLocationPageScaffold activeTopTab="Analytics" topTabs={fixedLocationTopTabs}>
      <Suspense>
        <ProfessionalFixedLocationRatingReviewsPage data={ratingReview} />
      </Suspense>
    </FixedLocationPageScaffold>
  );
}
