"use client";

export {
  MessagingWidgetProvider,
  MessagingWidgetProvider as ClientMessagingWidgetProvider,
  useMessagingWidget,
  useMessagingWidget as useClientMessagingWidget,
  useMessagingWidgetOptional,
  useMessagingWidgetOptional as useClientMessagingWidgetOptional,
} from "./MessagingWidgetContext";

export type { MessagingOpenParams, ClientMessagingOpenParams } from "./MessagingWidgetContext";
