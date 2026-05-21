"use client";

import AuthGuard from "../../components/common/auth/AuthGuard";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["individual", "company"]}>{children}</AuthGuard>;
}
