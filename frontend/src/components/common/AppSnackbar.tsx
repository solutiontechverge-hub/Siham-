"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { clearSnackbarFlash, peekSnackbarFlash } from "../../lib/snackbarFlash";
import MollureSnackbar from "./MollureSnackbar";
import type { MollureSnackbarSeverity } from "../../theme/mollureSnackbar";

export type SnackbarSeverity = MollureSnackbarSeverity;

export type ShowSnackbarOptions = {
  message: React.ReactNode;
  severity?: SnackbarSeverity;
  autoHideDurationMs?: number;
};

type SnackbarState = Required<Pick<ShowSnackbarOptions, "severity">> &
  Pick<ShowSnackbarOptions, "message"> & {
    open: boolean;
    autoHideDurationMs: number;
    /** Bumps when a new snackbar is requested so repeat messages still show */
    token: number;
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

function buildSnackbarState(
  options: ShowSnackbarOptions,
  token: number,
  open = true,
): SnackbarState {
  return {
    open,
    message: options.message,
    severity: options.severity ?? "info",
    autoHideDurationMs: options.autoHideDurationMs ?? 4000,
    token,
  };
}

export function AppSnackbarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tokenRef = React.useRef(0);
  const [state, setState] = React.useState<SnackbarState>(() =>
    buildSnackbarState({ message: "" }, 0, false),
  );

  const showSnackbar = React.useCallback((options: ShowSnackbarOptions) => {
    tokenRef.current += 1;
    setState(buildSnackbarState(options, tokenRef.current, true));
  }, []);

  const closeSnackbar = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const consumeFlash = React.useCallback(() => {
    const flash = peekSnackbarFlash();
    if (!flash) return;
    showSnackbar({
      message: flash.message,
      severity: flash.severity,
      autoHideDurationMs: flash.autoHideDurationMs,
    });
    clearSnackbarFlash();
  }, [showSnackbar]);

  // After login/logout navigation
  React.useLayoutEffect(() => {
    consumeFlash();
  }, [pathname, consumeFlash]);

  // First paint on destination route (covers fast navigations)
  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => consumeFlash());
    return () => window.cancelAnimationFrame(id);
  }, [consumeFlash]);

  const value = React.useMemo<SnackbarContextValue>(
    () => ({ showSnackbar, closeSnackbar }),
    [showSnackbar, closeSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <MollureSnackbar
        key={state.token}
        open={state.open}
        message={state.message}
        severity={state.severity}
        onClose={closeSnackbar}
        autoHideDuration={state.autoHideDurationMs}
      />
    </SnackbarContext.Provider>
  );
}
