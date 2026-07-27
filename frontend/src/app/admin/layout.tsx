"use client";

import AuthGuard from "../../components/common/auth/AuthGuard";
import AdminShell from "../../components/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["admin"]} loginPath="/auth/admin/login">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
