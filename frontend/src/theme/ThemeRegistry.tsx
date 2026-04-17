"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import StoreProvider from "../store/provider";
import { AppSnackbarProvider } from "../components/common/AppSnackbar";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppSnackbarProvider>{children}</AppSnackbarProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
