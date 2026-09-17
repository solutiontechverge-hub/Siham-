"use client";

import ClientPlatformTag from "../ClientPlatformTag";

/** @deprecated Prefer ClientPlatformTag with clientKind="company" (BC). */
export default function CompanyClientTag(_props?: {
  variant?: "pill" | "dot";
}) {
  return <ClientPlatformTag clientKind="company" />;
}
