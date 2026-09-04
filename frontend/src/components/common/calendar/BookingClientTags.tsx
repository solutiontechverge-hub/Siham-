"use client";

import * as React from "react";
import ClientPlatformTag from "../ClientPlatformTag";

export {
  default as ClientPlatformTag,
  MollureLogoMark,
  resolveClientPlatformTag,
} from "../ClientPlatformTag";
export type {
  ClientPlatformTagInput,
  ClientPlatformTagState,
} from "../ClientPlatformTag";

export function bookingClientTypeTag(
  clientKind?: "individual" | "company" | null,
): "BC" | null {
  return clientKind === "company" ? "BC" : null;
}

/** Searchable option text — tags render as a visual suffix, not in the label. */
export function bookingClientOptionLabel(input: {
  name: string;
  isMollure?: boolean;
  clientKind?: "individual" | "company" | null;
}): string {
  return input.name;
}

export default function BookingClientTags({
  isMollure,
  isGuest,
  clientKind,
}: {
  isMollure?: boolean;
  isGuest?: boolean;
  clientKind?: "individual" | "company" | null;
  /** @deprecated Three-state tags no longer render IC. Kept for call-site compatibility. */
  showType?: boolean;
}) {
  return (
    <ClientPlatformTag
      isMollure={isMollure}
      isGuest={isGuest}
      clientKind={clientKind}
    />
  );
}
