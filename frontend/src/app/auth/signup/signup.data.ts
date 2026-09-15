export const signupPathByAudience = {
  individual: "/auth/signup/individual",
  company: "/auth/signup/company",
  professional: "/auth/signup/professional",
} as const;

export const signupPageData = {
  greeting: "Hi,",
  titleSelect: "Select",
  titleRest: "User Type",
  continueLabel: "Continue",
  cards: {
    individual: {
      label: "Individual Client (IC)",
      alt: "Individual Client",
    },
    company: {
      label: "Company Client (CC)",
      alt: "Company Client",
    },
    professional: {
      label: "Professional",
      alt: "Professional",
    },
  },
} as const;
