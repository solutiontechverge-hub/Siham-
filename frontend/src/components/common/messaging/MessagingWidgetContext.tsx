"use client";

import * as React from "react";
import type { MessagingThread } from "./messagingTypes";

export type MessagingOpenParams = {
  bookingRef?: string;
  threadId?: string;
  /** Open chat with this business setup (client → that professional). */
  businessSetupId?: string;
  /** Prefill inbox search (e.g. when opening from a booking). */
  searchPrefill?: string;
  /** Seed the inbox with this thread so booking-open selects it immediately. */
  seedThread?: MessagingThread;
};

/** @deprecated Use MessagingOpenParams */
export type ClientMessagingOpenParams = MessagingOpenParams;

type MessagingWidgetContextValue = {
  open: boolean;
  params: MessagingOpenParams;
  openMessaging: (params?: MessagingOpenParams) => void;
  closeMessaging: () => void;
  toggleMessaging: () => void;
};

const MessagingWidgetContext =
  React.createContext<MessagingWidgetContextValue | null>(null);

export function MessagingWidgetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [params, setParams] = React.useState<MessagingOpenParams>({});

  const openMessaging = React.useCallback((next?: MessagingOpenParams) => {
    setParams(next ?? {});
    setOpen(true);
  }, []);

  const closeMessaging = React.useCallback(() => {
    setOpen(false);
  }, []);

  const toggleMessaging = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({ open, params, openMessaging, closeMessaging, toggleMessaging }),
    [closeMessaging, open, openMessaging, params, toggleMessaging],
  );

  return (
    <MessagingWidgetContext.Provider value={value}>
      {children}
    </MessagingWidgetContext.Provider>
  );
}

/** @deprecated Use MessagingWidgetProvider */
export const ClientMessagingWidgetProvider = MessagingWidgetProvider;

export function useMessagingWidget() {
  const ctx = React.useContext(MessagingWidgetContext);
  if (!ctx) {
    throw new Error(
      "useMessagingWidget must be used within MessagingWidgetProvider",
    );
  }
  return ctx;
}

export function useMessagingWidgetOptional() {
  return React.useContext(MessagingWidgetContext);
}

/** @deprecated Use useMessagingWidget */
export const useClientMessagingWidget = useMessagingWidget;

/** @deprecated Use useMessagingWidgetOptional */
export const useClientMessagingWidgetOptional = useMessagingWidgetOptional;
