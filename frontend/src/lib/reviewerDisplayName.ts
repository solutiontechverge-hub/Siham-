export type ReviewerDisplayFormat = "first_name" | "full_name" | "initials";

export type ReviewerNameParts = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

export const REVIEWER_DISPLAY_FORMAT_OPTIONS: ReadonlyArray<{
  value: ReviewerDisplayFormat;
  label: string;
  example: string;
}> = [
  { value: "first_name", label: "First Name", example: "John" },
  { value: "full_name", label: "Full Name", example: "John Smith" },
  { value: "initials", label: "Initials/Abbreviation", example: "JS" },
] as const;

export const DEFAULT_REVIEWER_DISPLAY_FORMAT: ReviewerDisplayFormat = "full_name";

export function parseReviewerFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function resolveReviewerNameParts(names: ReviewerNameParts): { firstName: string; lastName: string } {
  const first = (names.firstName ?? "").trim();
  const last = (names.lastName ?? "").trim();
  if (first || last) return { firstName: first, lastName: last };
  return parseReviewerFullName(names.fullName ?? "");
}

export function buildReviewerInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.trim()[0]?.toUpperCase() ?? "";
  const lastInitial = lastName.trim()[0]?.toUpperCase() ?? "";
  const initials = `${firstInitial}${lastInitial}`.trim();
  return initials || "?";
}

export function formatReviewerDisplayName(
  names: ReviewerNameParts,
  format: ReviewerDisplayFormat = DEFAULT_REVIEWER_DISPLAY_FORMAT,
): string {
  const { firstName, lastName } = resolveReviewerNameParts(names);
  const fallback = (names.fullName ?? "").trim();

  switch (format) {
    case "first_name":
      return firstName || fallback || "Anonymous";
    case "initials":
      return buildReviewerInitials(firstName, lastName);
    case "full_name":
    default:
      return [firstName, lastName].filter(Boolean).join(" ") || fallback || "Anonymous";
  }
}

export function inferReviewerDisplayFormat(
  displayName: string,
  firstName: string,
  lastName: string,
): ReviewerDisplayFormat {
  const fn = firstName.trim();
  const ln = lastName.trim();
  const full = `${fn} ${ln}`.trim();
  const normalized = displayName.trim();

  if (normalized && normalized === buildReviewerInitials(fn, ln)) {
    return "initials";
  }
  if (normalized === full && full) {
    return "full_name";
  }
  if (normalized === fn && fn) {
    return "first_name";
  }
  return DEFAULT_REVIEWER_DISPLAY_FORMAT;
}
