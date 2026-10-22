import type {
  AddClientMenuOption,
  ClientListSortOption,
  ClientRowMenuAction,
} from "./client.types";
import { isClientBlocked, type ClientRecord } from "./data/clientList";
import { DEFAULT_CLIENT_LIST_SORT } from "./data/clientListFilters";
import { DEFAULT_DIAL_CODE } from "../../../../lib/phoneDefaults";

export { DEFAULT_CLIENT_LIST_SORT };

export const CLIENT_LIST_SORT_OPTIONS: readonly ClientListSortOption[] = [
  "Booking Dated (Current → Last)",
  "Booking Dated (Last → Current)",
  "Alphabetical (A–Z)",
  "Alphabetical (Z–A)",
  "Sales (Highest → Lowest)",
  "Sales (Lowest → Highest)",
] as const;

export const ADD_CLIENT_MENU_OPTIONS: readonly AddClientMenuOption[] = [
  "Mollure Client",
  "Non-Mollure Client",
] as const;

export const CLIENT_TABLE_HEADERS = [
  "Client Name",
  "Date Added",
  "Phone Number",
  "Total Sales",
  "Last Booking",
  "",
] as const;

/** Deep-link into the professional Client list detail drawer (`?clientId=`). */
export function getProfessionalClientHref(clientId?: string | null): string {
  const id = String(clientId ?? "").trim();
  return id
    ? `/professionals/client?clientId=${encodeURIComponent(id)}`
    : "/professionals/client";
}

export const CLIENT_PHONE_DIAL_CODES = [
  "+971",
  "+92",
  "+91",
  "+49",
  "+44",
  "+1",
  "+81",
  "+61",
  "+31",
] as const;

export const NETHERLANDS_PROVINCE_OPTIONS = [
  "Province",
  "North Holland",
  "South Holland",
  "Utrecht",
] as const;

export const NETHERLANDS_MUNICIPALITY_OPTIONS = [
  "Municipality",
  "Amsterdam",
  "Rotterdam",
  "Utrecht",
] as const;

export function getClientRowMenuOptions(
  client: ClientRecord | undefined,
): ClientRowMenuAction[] {
  if (client && isClientBlocked(client)) {
    return ["View", "Edit technical note", "Unblock", "Delete"];
  }
  return ["View", "Edit technical note", "Block", "Delete"];
}

export function getTodayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function splitClientPhone(raw: string): {
  countryCode: string;
  phone: string;
} {
  for (const code of CLIENT_PHONE_DIAL_CODES) {
    if (raw.startsWith(code)) {
      return { countryCode: code, phone: raw.slice(code.length).trim() };
    }
  }
  return { countryCode: DEFAULT_DIAL_CODE, phone: raw };
}
