"use client";

import * as React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ThemeRegistry from "../theme/ThemeRegistry";
import { googleClientId } from "../lib/oauth-config";
import StoreProvider from "../store/provider";
import MessagingWidgetHost from "../components/common/messaging/MessagingWidgetHost";
import MessagingRealtimeBridge from "../components/common/messaging/MessagingRealtimeBridge";
import { MessagingWidgetProvider } from "../components/common/messaging/MessagingWidgetContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <StoreProvider>
      <ThemeRegistry>
        <MessagingWidgetProvider>
          {children}
          <MessagingRealtimeBridge />
          <MessagingWidgetHost />
        </MessagingWidgetProvider>
      </ThemeRegistry>
    </StoreProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
}
