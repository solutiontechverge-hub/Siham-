"use client";

import AuthLoginShell from "../../AuthLoginShell";
import { authLoginHeaderProfessional } from "../../../../data/marketingShell.data";

export default function ProfessionalLoginPage() {
  return <AuthLoginShell header={authLoginHeaderProfessional} signupHref="/auth/signup/professional" />;
}
