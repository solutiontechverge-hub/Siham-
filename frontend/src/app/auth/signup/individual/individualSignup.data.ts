export const individualSignupData = {
  countryCodes: ["+1", "+44", "+61", "+92", "+971", "+33", "+49", "+81", "+86", "+34"] as const,
  initialForm: {
    firstName: "",
    lastName: "",
    displayName: "",
    birthDate: "",
    gender: "",
    countryCode: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  },
} as const;

