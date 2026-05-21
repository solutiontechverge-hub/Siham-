"use client";

import * as React from "react";
import GuestGuard from "../../components/common/auth/GuestGuard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}

