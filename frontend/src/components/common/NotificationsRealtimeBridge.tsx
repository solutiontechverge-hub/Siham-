"use client";

import { useNotificationsRealtimeSync } from "../../hooks/useNotificationsRealtimeSync";

export default function NotificationsRealtimeBridge() {
  useNotificationsRealtimeSync();
  return null;
}
