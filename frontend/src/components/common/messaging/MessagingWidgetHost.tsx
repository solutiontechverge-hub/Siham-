"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAppSelector } from "../../../store/hooks";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import MessagingFloatingWidget from "./MessagingFloatingWidget";
import { useMessagingWidget } from "./MessagingWidgetContext";

function isClientUser(userType?: string) {
  return userType === "individual" || userType === "company";
}

function isProfessionalUser(userType?: string) {
  return userType === "professional";
}

function MessagingWidgetGate({ audience }: { audience: "client" | "professional" }) {
  const pathname = usePathname();
  const { open } = useMessagingWidget();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const [persistedReady, setPersistedReady] = React.useState(false);
  const [persistedToken, setPersistedToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const persisted = getPersistedAuthSession();
    setPersistedToken(persisted?.accessToken ?? null);
    setPersistedReady(true);
  }, []);

  const isAuthed = Boolean(accessToken || persistedToken);
  const onAudienceRoute =
    audience === "professional" ? pathname?.startsWith("/professionals") : pathname?.startsWith("/clients");
  const roleMatches =
    audience === "client" ? isClientUser(user?.user_type) : isProfessionalUser(user?.user_type);
  const routeFallback = !user?.user_type && Boolean(onAudienceRoute);
  const showWidget =
    persistedReady && isAuthed && (roleMatches || routeFallback || (open && Boolean(onAudienceRoute)));

  if (!showWidget) return null;

  return (
    <Suspense fallback={null}>
      <MessagingFloatingWidget audience={audience} />
    </Suspense>
  );
}

export default function MessagingWidgetHost() {
  return (
    <>
      <MessagingWidgetGate audience="client" />
      <MessagingWidgetGate audience="professional" />
    </>
  );
}
