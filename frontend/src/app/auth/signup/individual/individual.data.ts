import { GENDER_OPTIONS } from "../../../../lib/gender-options";
import { authSignupHeaderClient } from "../../../../data/marketingShell.data";

export const individualSignupPageData = {
  header: authSignupHeaderClient,
  title: "Create An Account",
  subtitle: "Join Us And Start Your Journey Today.",
  sections: {
    personal: "Personal Information",
    contact: "Contact Information",
  },
  fields: {
    firstName: {
      label: "First Name",
      placeholder: "Enter your first name",
    },
    lastName: {
      label: "Last Name",
      placeholder: "Enter your last name",
    },
    reviewNameMode: {
      label: "Select name for rating/review",
      emptyLabel: "Choose a display name",
    },
    birthDate: { label: "Birth date" },
    gender: {
      label: "Select Gender",
      emptyLabel: "Select your gender",
    },
    phone: { placeholder: "Enter your phone number" },
    email: {
      label: "Email",
      placeholder: "Enter your email address",
    },
    password: {
      label: "Password",
      placeholder: "Create a password",
    },
    confirmPassword: {
      label: "Repeat password",
      placeholder: "Re-enter your password",
    },
  },
  genderOptions: [...GENDER_OPTIONS],
  links: {
    terms: { label: "terms and conditions", href: "/terms-and-conditions" },
    policies: { label: "Policies", href: "/policies" },
  },
  acceptPrefix: "Accept",
  actions: {
    register: "Register",
    registering: "Registering...",
  },
} as const;
