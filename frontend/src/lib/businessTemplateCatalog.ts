import type { BusinessServiceDetail } from "../store/services/businessApi";

export type TemplateCategoryRow = {
  key: string;
  label: string;
  services: string[];
};

export function normalizeCategoryKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

/** Exact service title → Business Template category key (only categories with services). */
export function buildServiceNameToCategoryKeyMap(
  serviceDetails: readonly BusinessServiceDetail[] | undefined,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const service of serviceDetails ?? []) {
    const label = String(service.category_title ?? "").trim();
    const serviceName = String(service.service_title ?? "").trim();
    if (!label || !serviceName) continue;
    map[serviceName] = normalizeCategoryKey(label);
  }
  return map;
}

/** Resolve a template category key from booking/service display names. */
export function resolveTemplateCategoryKeyForServiceNames(
  names: readonly string[],
  serviceDetails: readonly BusinessServiceDetail[] | undefined,
): string | null {
  const map = buildServiceNameToCategoryKeyMap(serviceDetails);
  for (const raw of names) {
    const name = String(raw ?? "").trim();
    if (!name) continue;
    if (map[name]) return map[name];
    const lower = name.toLowerCase();
    const matched = Object.entries(map).find(
      ([serviceTitle]) => serviceTitle.toLowerCase() === lower,
    );
    if (matched) return matched[1];
  }
  return null;
}

/** Categories that have at least one configured service in the business template. */
export function buildTemplateCategoryRows(
  serviceDetails: readonly BusinessServiceDetail[] | undefined,
): TemplateCategoryRow[] {
  const byCategory = new Map<string, TemplateCategoryRow>();

  for (const service of serviceDetails ?? []) {
    const label = String(service.category_title ?? "").trim();
    const serviceName = String(service.service_title ?? "").trim();
    if (!label || !serviceName) continue;

    const key = normalizeCategoryKey(label);
    const existing = byCategory.get(key);
    if (existing) {
      if (!existing.services.includes(serviceName)) {
        existing.services.push(serviceName);
      }
      continue;
    }
    byCategory.set(key, { key, label, services: [serviceName] });
  }

  return Array.from(byCategory.values());
}

export function buildTemplateCategoryOptions(
  serviceDetails: readonly BusinessServiceDetail[] | undefined,
): Array<{ value: string; label: string }> {
  return buildTemplateCategoryRows(serviceDetails).map((row) => ({
    value: row.key,
    label: row.label,
  }));
}

export function resolveTemplateCategoryLabel(
  key: string,
  serviceDetails: readonly BusinessServiceDetail[] | undefined,
): string {
  const rows = buildTemplateCategoryRows(serviceDetails);
  const match = rows.find((row) => row.key === key);
  if (match) return match.label;
  return key;
}

export function buildServiceOrderFromTemplate(
  serviceDetails: readonly BusinessServiceDetail[] | undefined,
): {
  categories: string[];
  servicesByCategory: Record<string, string[]>;
} {
  const rows = buildTemplateCategoryRows(serviceDetails);
  const categories = rows.map((row) => row.label);
  const servicesByCategory: Record<string, string[]> = {};
  for (const row of rows) {
    servicesByCategory[row.label] = [...row.services];
  }
  return { categories, servicesByCategory };
}
