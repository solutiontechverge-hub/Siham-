"use client";

import * as React from "react";
import { useAppSelector } from "../../../store/hooks";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import { useMessagingRealtimeSync } from "./useMessagingRealtimeSync";
import type { MessagingAudience } from "./messagingRoutes";

function isClientUser(userType?: string) {
  return userType === "individual" || userType === "company";
}

function isProfessionalUser(userType?: string) {
  return userType === "professional";
}

function MessagingRealtimeSyncGate({
  audience,
}: {
  audience: MessagingAudience;
}) {
  useMessagingRealtimeSync(audience);
  return null;
}

export default function MessagingRealtimeBridge() {
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [persistedToken, setPersistedToken] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    setPersistedToken(getPersistedAuthSession()?.accessToken ?? null);
  }, [accessToken]);

  const isAuthed = Boolean(accessToken || persistedToken);
  if (!isAuthed || !user?.user_type) return null;

  const audience: MessagingAudience | null = isProfessionalUser(user.user_type)
    ? "professional"
    : isClientUser(user.user_type)
      ? "client"
      : null;

  if (!audience) return null;

  return <MessagingRealtimeSyncGate audience={audience} />;
}
