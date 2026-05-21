"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import { getDefaultRouteForUser } from "../../../lib/auth-routing";
import { useAppSelector } from "../../../store/hooks";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const [isReady, setIsReady] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);
  const wasAuthenticatedRef = React.useRef(false);

  React.useEffect(() => {
    const persisted = getPersistedAuthSession();
    // If we ever had an access token and it becomes null (logout),
    // do not treat persisted tokens as a valid session.
    const isLoggedOut = wasAuthenticatedRef.current && !accessToken;
    setHasSession(Boolean(accessToken || (!isLoggedOut && persisted?.accessToken)));
    setIsReady(true);
  }, [accessToken]);

  React.useEffect(() => {
    if (!isReady) return;

    if (!hasSession) {
      router.replace("/auth/login");
      return;
    }

    if (accessToken) {
      wasAuthenticatedRef.current = true;
    }

    if (allowedRoles?.length && user?.user_type && !allowedRoles.includes(user.user_type)) {
      router.replace(getDefaultRouteForUser(user.user_type));
    }
  }, [accessToken, allowedRoles, hasSession, isReady, router, user?.user_type]);

  if (!isReady || !hasSession) {
    return null;
  }

  if (allowedRoles?.length && user?.user_type && !allowedRoles.includes(user.user_type)) {
    return null;
  }

  return <>{children}</>;
}
