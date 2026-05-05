"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export default function ProfessionalLoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return null;
}
