export const PROFESSIONAL_COUNTRY = "Netherlands";

export const COC_NUMBER_REGEX = /^\d{8}$/;
export const VAT_NUMBER_REGEX = /^NL\d{9}B\d{2}$/i;

export const BUSINESS_TYPE_OPTIONS = [
  { value: "salonOwner", label: "Salon Owner" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
] as const;
