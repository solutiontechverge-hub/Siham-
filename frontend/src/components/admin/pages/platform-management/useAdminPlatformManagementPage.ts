"use client";

import * as React from "react";
import type { PlatformManagementTabId } from "../../platformManagementData";

export function useAdminPlatformManagementPage() {
  const [activeTab, setActiveTab] =
    React.useState<PlatformManagementTabId>("overview");

  return {
    activeTab,
    setActiveTab,
  };
}
