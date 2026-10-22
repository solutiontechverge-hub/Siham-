"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ThemeRegistry from "../theme/ThemeRegistry";
import { googleClientId } from "../lib/oauth-config";
import StoreProvider from "../store/provider";
import MessagingRealtimeBridge from "../components/common/messaging/MessagingRealtimeBridge";
import NotificationsRealtimeBridge from "../components/common/NotificationsRealtimeBridge";
import BusinessRealtimeBridge from "../components/common/BusinessRealtimeBridge";
import UiPrefsSync from "../components/common/UiPrefsSync";
import { MessagingWidgetProvider } from "../components/common/messaging/MessagingWidgetContext";

const MessagingWidgetHost = dynamic(
  () => import("../components/common/messaging/MessagingWidgetHost"),
  { ssr: false },
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <StoreProvider>
      <ThemeRegistry>
        <MessagingWidgetProvider>
          {children}
          <UiPrefsSync />
          <MessagingRealtimeBridge />
          <NotificationsRealtimeBridge />
          <BusinessRealtimeBridge />
          <MessagingWidgetHost />
        </MessagingWidgetProvider>
      </ThemeRegistry>
    </StoreProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {content}
    </GoogleOAuthProvider>
  );
}
