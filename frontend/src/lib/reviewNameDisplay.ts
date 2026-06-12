export type ReviewNameMode = "first_name" | "full_name" | "initials";

export const REVIEW_NAME_MODES: readonly ReviewNameMode[] = [
  "first_name",
  "full_name",
  "initials",
] as const;

const REVIEW_NAME_TITLES: Record<ReviewNameMode, string> = {
  first_name: "First Name",
  full_name: "Full Name",
  initials: "Initials/Abbreviation",
};

export function reviewNameExample(
  mode: ReviewNameMode,
  firstName: string,
  lastName: string,
  fallbackFirst = "John",
  fallbackLast = "Smith",
): string {
  const fn = firstName.trim() || fallbackFirst;
  const ln = lastName.trim() || fallbackLast;
  const full = `${fn} ${ln}`.trim();

  switch (mode) {
    case "full_name":
      return full;
    case "initials":
      return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase();
    default:
      return fn;
  }
}

export function reviewNameOptionLabel(
  mode: ReviewNameMode,
  firstName: string,
  lastName: string,
): string {
  const example = reviewNameExample(mode, firstName, lastName);
  return `${REVIEW_NAME_TITLES[mode]} (e.g., ${example})`;
}

export function resolveDisplayNameFromMode(
  mode: string,
  firstName: string,
  lastName: string,
): string {
  const fn = firstName.trim();
  const ln = lastName.trim();

  switch (mode) {
    case "full_name":
      return `${fn} ${ln}`.trim();
    case "initials":
      if (!fn && !ln) return "";
      return `${fn.charAt(0) || ""}${ln.charAt(0) || ""}`.toUpperCase();
    case "first_name":
      return fn;
    default:
      return mode.trim();
  }
}

export function inferReviewNameMode(
  displayName: string,
  firstName: string,
  lastName: string,
): ReviewNameMode {
  const normalized = displayName.trim();
  const fn = firstName.trim();
  const ln = lastName.trim();
  const full = `${fn} ${ln}`.trim();
  const initials = `${fn.charAt(0) || ""}${ln.charAt(0) || ""}`.toUpperCase();

  if (normalized && ln && normalized === ln) return "initials";
  if (normalized && initials && normalized.toUpperCase() === initials) return "initials";
  if (normalized && full && normalized === full) return "full_name";
  return "first_name";
}
