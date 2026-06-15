export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number]["value"];

/** Title-case values used by professional client forms. */
export const GENDER_MENU_OPTIONS = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
] as const;
