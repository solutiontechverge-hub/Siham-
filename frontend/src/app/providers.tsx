"use client";

import * as React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ThemeRegistry from "../theme/ThemeRegistry";
import { googleClientId } from "../lib/oauth-config";
import StoreProvider from "../store/provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <StoreProvider>
      <ThemeRegistry>{children}</ThemeRegistry>
    </StoreProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
}

