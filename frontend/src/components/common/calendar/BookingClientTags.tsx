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
  if (clientKind === "company") return "BC";
  return null;
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
  /** Kept for call-site compatibility. IC/BC now always render from clientKind. */
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
