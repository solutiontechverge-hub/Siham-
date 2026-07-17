import type { MockProfessional } from "./adminMockData";

export const PROFESSIONAL_EXPORT_TITLE = "Professional Management — Professional List";

export const PROFESSIONAL_EXPORT_HEADERS = [
  "Professional ID",
  "Brand Name",
  "Email",
  "Phone",
  "Category",
  "Verification Status",
  "Verification Date",
  "Account Status",
  "Rating",
  "Reviews",
  "Total Bookings",
  "Registration Date",
  "Service Mode",
] as const;

function formatVerificationStatus(status: MockProfessional["validationStatus"]) {
  switch (status) {
    case "validated":
      return "Verified";
    case "pending":
      return "Pending";
    case "not_validated":
      return "Rejected";
    default:
      return status;
  }
}

function formatAccountStatus(status: MockProfessional["accountStatus"]) {
  return status === "active" ? "Active" : "Inactive";
}

export function professionalRowToExportRow(pro: MockProfessional): string[] {
  return [
    pro.id.toUpperCase(),
    pro.brandName,
    pro.email,
    pro.phone,
    pro.primaryCategory,
    formatVerificationStatus(pro.validationStatus),
    pro.verificationDate ?? "—",
    formatAccountStatus(pro.accountStatus),
    pro.totalReviews > 0 ? pro.avgRating.toFixed(1) : "—",
    String(pro.totalReviews),
    String(pro.onlineBookings + pro.offlineBookings),
    pro.registrationDate,
    pro.serviceMode,
  ];
}

export function buildProfessionalExportStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function buildProfessionalExportSubtitle(count: number, stamp = buildProfessionalExportStamp()) {
  return `Exported on ${stamp} · ${count} professional${count === 1 ? "" : "s"}`;
}
