import { authSignupHeaderProfessional } from "../../../../data/marketingShell.data";
import {
  BUSINESS_TYPE_OPTIONS,
  PROFESSIONAL_COUNTRY,
} from "../../../../data/businessRegistration.data";
import { NETHERLANDS_MUNICIPALITY_SHORTLIST } from "../../../../data/netherlandsLocations.data";

export const professionalSignupPageData = {
  header: authSignupHeaderProfessional,
  title: "Create An Account",
  subtitle: "Join Us And Start Your Journey Today.",
  sections: {
    company: "Company Information",
    businessAddress: "Business Address",
    portfolio: "Portfolio links",
    contact: "Contact Person",
  },
  fields: {
    legalName: { label: "Legal Name", placeholder: "e.g. Jane" },
    cccNumber: { label: "COC number", placeholder: "12345678" },
    vatNumber: { label: "VAT number", placeholder: "NL123456789B01" },
    country: { label: "Country" },
    street: { label: "Street", placeholder: "e.g. Damrak" },
    number: { label: "Number", placeholder: "e.g. 1" },
    postalCode: { label: "Postal Code", placeholder: "e.g. 1012 LG" },
    municipality: {
      label: "Municipality",
      emptyLabel: "Select Municipality",
    },
    businessType: {
      label: "Select Business Type",
      emptyLabel: "Select Business Type",
    },
    website: { placeholder: "Website" },
    instagram: { placeholder: "Instagram" },
    otherLink: { placeholder: "Other" },
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
  professionalCountry: PROFESSIONAL_COUNTRY,
  municipalityOptions: [...NETHERLANDS_MUNICIPALITY_SHORTLIST],
  businessTypeOptions: [...BUSINESS_TYPE_OPTIONS],
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
