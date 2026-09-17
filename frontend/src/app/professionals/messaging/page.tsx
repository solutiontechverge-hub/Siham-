"use client";

import MessagingRouteRedirect from "../../../components/common/messaging/MessagingRouteRedirect";

export default function ProfessionalMessagingPage() {
  return (
    <MessagingRouteRedirect fallbackHref="/professionals/fixed-location/calendar" />
  );
}
