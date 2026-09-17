"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { SIGNUP_AUDIENCE_KEY } from "../../../lib/auth-storage";
import { signupPathByAudience } from "./signup.data";

export type SignupAudience = keyof typeof signupPathByAudience;

export function useSignupPage() {
  const router = useRouter();
  const [audience, setAudience] = React.useState<SignupAudience>("individual");

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SIGNUP_AUDIENCE_KEY);
      if (
        stored === "individual" ||
        stored === "company" ||
        stored === "professional"
      ) {
        setAudience(stored);
      }
    } catch {
      // ignore storage access failures
    }
  }, []);

  const selectAudience = (next: SignupAudience) => {
    setAudience(next);
    try {
      window.sessionStorage.setItem(SIGNUP_AUDIENCE_KEY, next);
    } catch {
      // ignore storage access failures
    }
  };

  const handleContinue = () => {
    try {
      window.sessionStorage.setItem(SIGNUP_AUDIENCE_KEY, audience);
    } catch {
      // ignore storage access failures
    }
    router.push(signupPathByAudience[audience]);
  };

  return {
    audience,
    selectAudience,
    handleContinue,
  };
}
