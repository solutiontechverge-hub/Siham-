import { redirect } from "next/navigation";

export default function ResetPasswordSuccessRedirectPage() {
  redirect("/auth/reset-password/success");
}

