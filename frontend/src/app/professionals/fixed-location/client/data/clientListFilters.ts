import type { ClientRecord } from "./clientList";
import { isClientBlocked } from "./clientList";

export type ClientListFilterKey =
  | "individual"
  | "company"
  | "mollure"
  | "non_mollure"
  | "no_show"
  | "blocked";

export const CLIENT_LIST_FILTER_OPTIONS: Array<{ key: ClientListFilterKey; label: string }> = [
  { key: "individual", label: "Individual clients" },
  { key: "company", label: "Company clients" },
  { key: "mollure", label: "Mollure clients" },
  { key: "non_mollure", label: "Non-Mollure clients" },
  { key: "no_show", label: "No show clients" },
  { key: "blocked", label: "Blocked clients" },
];

export function isMollureClient(client: ClientRecord): boolean {
  return client.tags.includes("Mollure");
}

export function isIndividualClient(client: ClientRecord): boolean {
  return client.kind === "individual";
}

export function isCompanyClient(client: ClientRecord): boolean {
  return client.kind === "company";
}

export function clientTypeLabel(client: ClientRecord): "IC" | "CC" {
  return client.kind === "company" ? "CC" : "IC";
}

export function platformLabel(client: ClientRecord): "Mollure" | "Non-Mollure" {
  return isMollureClient(client) ? "Mollure" : "Non-Mollure";
}

export function matchesClientSearch(client: ClientRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${client.name} ${client.email} ${client.detailEmail ?? ""} ${client.phone}`.toLowerCase();
  return haystack.includes(q);
}

export function matchesClientFilters(client: ClientRecord, activeFilters: ReadonlySet<ClientListFilterKey>): boolean {
  if (activeFilters.size === 0) return true;

  const checks: boolean[] = [];
  if (activeFilters.has("individual")) checks.push(isIndividualClient(client));
  if (activeFilters.has("company")) checks.push(isCompanyClient(client));
  if (activeFilters.has("mollure")) checks.push(isMollureClient(client));
  if (activeFilters.has("non_mollure")) checks.push(!isMollureClient(client));
  if (activeFilters.has("no_show")) checks.push(Boolean(client.hasNoShow));
  if (activeFilters.has("blocked")) checks.push(isClientBlocked(client));

  return checks.some(Boolean);
}

export const DEFAULT_CLIENT_LIST_SORT = "Booking Dated (Current → Last)";
