import AuthGuard from "../../../components/common/auth/AuthGuard";

export default function ProfessionalMessagingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard allowedRoles={["professional"]}>{children}</AuthGuard>;
}
