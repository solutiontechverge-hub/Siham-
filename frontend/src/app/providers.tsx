"use client";

import * as React from "react";
import ThemeRegistry from "../theme/ThemeRegistry";
import StoreProvider from "../store/provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeRegistry>{children}</ThemeRegistry>
    </StoreProvider>
  );
}

