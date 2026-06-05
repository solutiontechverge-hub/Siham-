"use client";

import { Suspense } from "react";
import ClientListingPage from "./client-listing.page";

export default function ClientListingRoutePage() {
  return (
    <Suspense>
      <ClientListingPage />
    </Suspense>
  );
}
