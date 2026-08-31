"use client";

import { useBusinessRealtimeSync } from "../../hooks/useBusinessRealtimeSync";

export default function BusinessRealtimeBridge() {
  useBusinessRealtimeSync();
  return null;
}
