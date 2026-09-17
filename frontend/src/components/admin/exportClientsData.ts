import type { MockClient } from "./adminMockData";

export const CLIENT_EXPORT_TITLE = "Client Management — Client List";

export const CLIENT_EXPORT_HEADERS = [
  "Registration Date",
  "Registration Time",
  "Client Name",
  "Email",
  "Phone",
  "Client Type",
  "Last Completed Booking",
  "Last Booking Time",
  "Account Status",
] as const;

export function formatClientType(type: MockClient["type"]) {
  return type === "IC" ? "Individual Client (IC)" : "Company Client (BC)";
}

export function formatAccountStatus(status: MockClient["accountStatus"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function clientRowToExportRow(client: MockClient): string[] {
  return [
    client.registrationDate,
    client.registrationTime,
    client.name,
    client.email,
    client.phone,
    formatClientType(client.type),
    client.lastBookingDate,
    client.lastBookingTime,
    formatAccountStatus(client.accountStatus),
  ];
}

export function buildClientExportStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function buildClientExportSubtitle(clientCount: number, stamp = buildClientExportStamp()) {
  return `Exported on ${stamp} · ${clientCount} client${clientCount === 1 ? "" : "s"}`;
}
