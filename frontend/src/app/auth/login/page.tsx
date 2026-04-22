"use client";

import AuthLoginShell from "../AuthLoginShell";
import { authLoginHeaderClient } from "../../../data/marketingShell.data";

export default function LoginPage() {
  return <AuthLoginShell header={authLoginHeaderClient} signupHref="/auth/signup" />;
}
