import type {
  MockProfessional,
  ProfessionalCategory,
  ProfessionalCategoryStyle,
  ProfessionalVerificationStyle,
} from "./professionals.types";

export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Hair & Beauty", label: "Hair & Beauty" },
  { value: "Wellness & Spa", label: "Wellness & Spa" },
  { value: "Fitness & Training", label: "Fitness & Training" },
  { value: "Make-up & Skincare", label: "Make-up & Skincare" },
  { value: "Barber", label: "Barber" },
];

export const CATEGORY_CHIP_COLORS: Record<
  ProfessionalCategory,
  ProfessionalCategoryStyle
> = {
  "Hair & Beauty": { bg: "rgba(33, 184, 191, 0.12)", fg: "#149CA7" },
  "Wellness & Spa": { bg: "rgba(127, 86, 217, 0.12)", fg: "#6941C6" },
  "Fitness & Training": { bg: "rgba(2, 132, 199, 0.12)", fg: "#0284C7" },
  "Make-up & Skincare": { bg: "rgba(236, 72, 153, 0.12)", fg: "#DB2777" },
  Barber: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803" },
};

export const VERIFICATION_STYLES: Record<
  MockProfessional["validationStatus"],
  ProfessionalVerificationStyle
> = {
  validated: { bg: "rgba(76, 175, 80, 0.12)", fg: "#2E7D32", label: "Verified" },
  pending: { bg: "rgba(255, 181, 71, 0.2)", fg: "#DC6803", label: "Pending" },
  not_validated: { bg: "rgba(240, 68, 56, 0.12)", fg: "#B42318", label: "Rejected" },
};

export function formatDisplayDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function isActiveAccount(status: MockProfessional["accountStatus"]) {
  return status === "active";
}
