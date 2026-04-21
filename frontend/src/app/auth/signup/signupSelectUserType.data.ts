import { CC, IC, Professional } from "../../../../images";

export type SignupAudience = "individual" | "company" | "professional";

export const signupPathByAudience: Record<SignupAudience, string> = {
  individual: "/auth/signup/individual",
  company: "/auth/signup/company",
  professional: "/auth/signup/professional",
};

export const signupAudienceCards = [
  {
    audience: "individual",
    label: "Individual Client (IC)",
    icon: { src: IC, alt: "Individual Client", width: 34, height: 30 },
  },
  {
    audience: "company",
    label: "Company Client (CC)",
    icon: { src: CC, alt: "Company Client", width: 28, height: 36 },
  },
  {
    audience: "professional",
    label: "Professional",
    icon: { src: Professional, alt: "Professional", width: 34, height: 28 },
  },
] as const;

