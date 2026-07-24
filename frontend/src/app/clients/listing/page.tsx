"use client";

import { Suspense } from "react";
import ClientListingPageView from "./ClientListingPageView";

export default function ClientListingRoutePage() {
  return (
    <Suspense>
      <ClientListingPageView />
    </Suspense>
  );
}
