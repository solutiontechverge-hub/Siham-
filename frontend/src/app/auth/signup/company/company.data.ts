import { authSignupHeaderClient } from "../../../../data/marketingShell.data";
import {
  COMPANY_SIGNUP_MUNICIPALITY_OPTIONS,
  COMPANY_SIGNUP_PROVINCE_OPTIONS,
} from "../../../../data/beneluxSignupLocations.data";

export const companySignupPageData = {
  header: authSignupHeaderClient,
  title: "Create An Account",
  subtitle: "Join Us And Start Your Journey Today.",
  sections: {
    company: "Company Information",
    businessAddress: "Business Address",
    contact: "Contact Person",
  },
  fields: {
    legalName: { label: "Legal Name", placeholder: "e.g. Jane" },
    cccNumber: { label: "COC number", placeholder: "676537" },
    vatNumber: { label: "VAT number", placeholder: "27354323456789" },
    street: { label: "Street", placeholder: "e.g. Damrak" },
    number: { label: "Number", placeholder: "e.g. 1" },
    postalCode: { label: "Postal Code", placeholder: "e.g. 1012 LG" },
    province: { label: "Province", emptyLabel: "Select Province" },
    municipality: {
      label: "Municipality",
      emptyLabel: "Select Municipality",
    },
    contactFirstName: {
      label: "First Name",
      placeholder: "Enter your first name",
    },
    contactLastName: {
      label: "Last Name",
      placeholder: "Enter your last name",
    },
    contactEmail: {
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
  provinceOptions: [...COMPANY_SIGNUP_PROVINCE_OPTIONS],
  municipalityOptions: [...COMPANY_SIGNUP_MUNICIPALITY_OPTIONS],
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
