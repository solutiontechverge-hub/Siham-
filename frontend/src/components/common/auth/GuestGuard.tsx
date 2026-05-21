"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import { getDefaultRouteForUser } from "../../../lib/auth-routing";
import { useAppSelector } from "../../../store/hooks";

type GuestGuardProps = {
  children: React.ReactNode;
};

export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const persisted = getPersistedAuthSession();
    const isAuthenticated = Boolean(accessToken || persisted?.accessToken);

    if (isAuthenticated) {
      router.replace(getDefaultRouteForUser(user?.user_type || persisted?.user?.user_type));
      return;
    }

    setIsReady(true);
  }, [accessToken, router, user?.user_type]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
