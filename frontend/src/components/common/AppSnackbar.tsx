/* eslint-disable react-refresh/only-export-components */
"use client";

import * as React from "react";
import { Alert, Snackbar } from "@mui/material";

export type SnackbarSeverity = "success" | "info" | "warning" | "error";

export type ShowSnackbarOptions = {
  message: React.ReactNode;
  severity?: SnackbarSeverity;
  autoHideDurationMs?: number;
};

type SnackbarState = Required<Pick<ShowSnackbarOptions, "severity">> &
  Pick<ShowSnackbarOptions, "message"> & {
    open: boolean;
    autoHideDurationMs: number;
  };

type SnackbarContextValue = {
  showSnackbar: (options: ShowSnackbarOptions) => void;
  closeSnackbar: () => void;
};

const SnackbarContext = React.createContext<SnackbarContextValue | null>(null);

export function useSnackbar() {
  const ctx = React.useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used within <AppSnackbarProvider />");
  return ctx;
}

export function AppSnackbarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
    autoHideDurationMs: 4000,
  });

  const showSnackbar = React.useCallback((options: ShowSnackbarOptions) => {
    setState({
      open: true,
      message: options.message,
      severity: options.severity ?? "info",
      autoHideDurationMs: options.autoHideDurationMs ?? 4000,
    });
  }, []);

  const closeSnackbar = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const value = React.useMemo<SnackbarContextValue>(
    () => ({ showSnackbar, closeSnackbar }),
    [showSnackbar, closeSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        onClose={closeSnackbar}
        autoHideDuration={state.autoHideDurationMs}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity={state.severity} variant="filled" sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

