import type { ServiceOrderSettings } from "./calendar-settings.types";
import { normalizeServiceOrderSettings } from "./calendar-settings.types";
import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  buildPlatformServiceOrderDefaults,
} from "../../../data/businessServiceCategorySlider.data";

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const CATEGORY_ALIAS_GROUPS: readonly (readonly string[])[] = [
  // Longer / more specific aliases first within matching logic.
  ["waxing", "ontharing", "hair removal", "hairremoval"],
  ["facial", "gezichtsbehandeling", "facial treatment", "facetreatment"],
  ["body", "lichaamsbehandeling", "body treatment", "body treatments", "bodytreatment"],
  ["makeup", "make-up", "make up", "makeup"],
  ["lashes", "wimpers", "eyelashes"],
  ["brows", "wenkbrauwen", "eyebrows"],
  ["nails", "nagels", "nail"],
  ["hair", "haar"],
  ...BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => [
    entry.key,
    normalizeToken(entry.label),
  ] as const),
];

function categoryAliasGroup(value: string): string | null {
  const token = normalizeToken(value);
  if (!token) return null;
  const compact = token.replace(/\s+/g, "");

  // Prefer the longest exact / whole-token alias so "hair removal" ≠ "hair".
  let best: { key: string; len: number } | null = null;
  for (const group of CATEGORY_ALIAS_GROUPS) {
    for (const alias of group) {
      if (!alias) continue;
      const aliasToken = normalizeToken(alias);
      const aliasCompact = aliasToken.replace(/\s+/g, "");
      const exact =
        token === aliasToken ||
        compact === aliasCompact;
      if (!exact) continue;
      if (!best || aliasCompact.length > best.len) {
        best = { key: group[0], len: aliasCompact.length };
      }
    }
  }
  return best?.key ?? null;
}

export function serviceOrderLabelsMatch(a: string, b: string): boolean {
  const left = normalizeToken(a);
  const right = normalizeToken(b);
  if (!left || !right) return false;
  if (left === right || left.replace(/\s+/g, "") === right.replace(/\s+/g, "")) {
    return true;
  }
  const leftGroup = categoryAliasGroup(left);
  const rightGroup = categoryAliasGroup(right);
  return Boolean(leftGroup && rightGroup && leftGroup === rightGroup);
}

/** Prefer platform catalog English labels for known categories. */
export function canonicalizeServiceCategoryLabel(title: string): string {
  const trimmed = String(title ?? "").trim();
  if (!trimmed) return "";
  const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
    (entry) =>
      serviceOrderLabelsMatch(entry.label, trimmed) ||
      serviceOrderLabelsMatch(entry.key, trimmed),
  );
  return catalogEntry?.label ?? trimmed;
}

/**
 * Remove duplicate catalog/alias categories (e.g. Haar + Hair, Make-Up twice)
 * and merge services/hidden flags onto the canonical label.
 */
export function dedupeServiceOrderSettings(
  order: ServiceOrderSettings,
): ServiceOrderSettings {
  const categories: string[] = [];
  const titleMap = new Map<string, string>(); // original -> canonical kept in list

  for (const title of order.categories ?? []) {
    const canonical = canonicalizeServiceCategoryLabel(title);
    if (!canonical) continue;
    const existing = categories.find((entry) =>
      serviceOrderLabelsMatch(entry, canonical),
    );
    if (existing) {
      titleMap.set(title, existing);
      continue;
    }
    categories.push(canonical);
    titleMap.set(title, canonical);
  }

  const resolveCanonical = (title: string) => {
    const mapped = titleMap.get(title);
    if (mapped) return mapped;
    const canonical = canonicalizeServiceCategoryLabel(title);
    const existing = categories.find((entry) =>
      serviceOrderLabelsMatch(entry, canonical),
    );
    return existing ?? canonical;
  };

  const servicesByCategory: Record<string, string[]> = {};
  for (const [key, services] of Object.entries(order.servicesByCategory ?? {})) {
    const canonical = resolveCanonical(key);
    if (!canonical) continue;
    const merged = servicesByCategory[canonical] ?? [];
    for (const service of services ?? []) {
      if (
        !merged.some((entry) => serviceOrderLabelsMatch(entry, service))
      ) {
        merged.push(service);
      }
    }
    servicesByCategory[canonical] = merged;
  }

  const hiddenCategories: string[] = [];
  for (const title of order.hiddenCategories ?? []) {
    const canonical = resolveCanonical(title);
    if (!canonical) continue;
    if (
      !hiddenCategories.some((entry) =>
        serviceOrderLabelsMatch(entry, canonical),
      )
    ) {
      hiddenCategories.push(canonical);
    }
  }

  const hiddenServicesByCategory: Record<string, string[]> = {};
  for (const [key, services] of Object.entries(
    order.hiddenServicesByCategory ?? {},
  )) {
    const canonical = resolveCanonical(key);
    if (!canonical) continue;
    const merged = hiddenServicesByCategory[canonical] ?? [];
    for (const service of services ?? []) {
      if (
        !merged.some((entry) => serviceOrderLabelsMatch(entry, service))
      ) {
        merged.push(service);
      }
    }
    hiddenServicesByCategory[canonical] = merged;
  }

  return {
    categories,
    servicesByCategory,
    hiddenCategories,
    hiddenServicesByCategory,
  };
}

export function isCategoryVisibleInServiceOrder(
  serviceOrder: ServiceOrderSettings | null | undefined,
  category: string,
): boolean {
  const hidden = serviceOrder?.hiddenCategories ?? [];
  return !hidden.some((entry) => serviceOrderLabelsMatch(entry, category));
}

export function isServiceVisibleInServiceOrder(
  serviceOrder: ServiceOrderSettings | null | undefined,
  category: string,
  service: string,
): boolean {
  if (!isCategoryVisibleInServiceOrder(serviceOrder, category)) return false;
  const hiddenMap = serviceOrder?.hiddenServicesByCategory ?? {};
  const hiddenKeys = Object.keys(hiddenMap);
  const matchedKey =
    hiddenKeys.find((key) => serviceOrderLabelsMatch(key, category)) ?? category;
  const hiddenServices = hiddenMap[matchedKey] ?? [];
  return !hiddenServices.some((entry) => serviceOrderLabelsMatch(entry, service));
}

export function toggleHiddenCategory(
  serviceOrder: ServiceOrderSettings,
  category: string,
): ServiceOrderSettings {
  const hidden = [...(serviceOrder.hiddenCategories ?? [])];
  const index = hidden.findIndex((entry) => serviceOrderLabelsMatch(entry, category));
  if (index >= 0) hidden.splice(index, 1);
  else hidden.push(category);
  return { ...serviceOrder, hiddenCategories: hidden };
}

export function toggleHiddenService(
  serviceOrder: ServiceOrderSettings,
  category: string,
  service: string,
): ServiceOrderSettings {
  const hiddenMap = { ...(serviceOrder.hiddenServicesByCategory ?? {}) };
  const matchedKey =
    Object.keys(hiddenMap).find((key) => serviceOrderLabelsMatch(key, category)) ?? category;
  const current = [...(hiddenMap[matchedKey] ?? [])];
  const index = current.findIndex((entry) => serviceOrderLabelsMatch(entry, service));
  if (index >= 0) current.splice(index, 1);
  else current.push(service);
  hiddenMap[matchedKey] = current;
  return { ...serviceOrder, hiddenServicesByCategory: hiddenMap };
}

export type ServiceCategoryLike = {
  category_id?: string | null;
  service_id?: string | null;
  category_title?: string | null;
  service_title?: string | null;
  amount?: number | null;
  duration_label?: string | null;
  parent_service_id?: string | null;
  is_visible?: boolean;
  [key: string]: unknown;
};

/**
 * Reorder business setup service_categories by Settings service order and set is_visible.
 * Hidden entries stay in the array (data preserved) with is_visible: false.
 */
export function applyServiceOrderToServiceCategories<T extends ServiceCategoryLike>(
  categories: readonly T[],
  serviceOrder: ServiceOrderSettings,
): T[] {
  if (!categories.length) return [];

  const byCategory = new Map<string, T[]>();
  for (const entry of categories) {
    const title = String(entry.category_title ?? "").trim() || "Services";
    const list = byCategory.get(title) ?? [];
    list.push(entry);
    byCategory.set(title, list);
  }

  const orderedCategoryTitles = [
    ...serviceOrder.categories.filter((category) =>
      [...byCategory.keys()].some((key) => serviceOrderLabelsMatch(key, category)),
    ),
    ...[...byCategory.keys()].filter(
      (key) => !serviceOrder.categories.some((category) => serviceOrderLabelsMatch(key, category)),
    ),
  ];

  const seenCategories = new Set<string>();
  const result: T[] = [];

  for (const orderedTitle of orderedCategoryTitles) {
    const actualTitle =
      [...byCategory.keys()].find((key) => serviceOrderLabelsMatch(key, orderedTitle)) ?? orderedTitle;
    if (seenCategories.has(actualTitle)) continue;
    seenCategories.add(actualTitle);

    const entries = byCategory.get(actualTitle) ?? [];
    const preferredKey =
      Object.keys(serviceOrder.servicesByCategory ?? {}).find((key) =>
        serviceOrderLabelsMatch(key, orderedTitle) || serviceOrderLabelsMatch(key, actualTitle),
      ) ?? actualTitle;
    const preferredNames = serviceOrder.servicesByCategory?.[preferredKey] ?? [];

    const orderedEntries = [
      ...preferredNames
        .map((name) =>
          entries.find((entry) => serviceOrderLabelsMatch(String(entry.service_title ?? ""), name)),
        )
        .filter((entry): entry is T => Boolean(entry)),
      ...entries.filter(
        (entry) =>
          !preferredNames.some((name) =>
            serviceOrderLabelsMatch(String(entry.service_title ?? ""), name),
          ),
      ),
    ];

    // Deduplicate by service_id while keeping order.
    const seenServices = new Set<string>();
    for (const entry of orderedEntries) {
      const serviceId = String(entry.service_id ?? "");
      if (serviceId && seenServices.has(serviceId)) continue;
      if (serviceId) seenServices.add(serviceId);

      const serviceTitle = String(entry.service_title ?? "");
      const visible =
        isCategoryVisibleInServiceOrder(serviceOrder, actualTitle) &&
        isServiceVisibleInServiceOrder(serviceOrder, actualTitle, serviceTitle);

      result.push({
        ...entry,
        is_visible: visible,
      });
    }
  }

  return result;
}

export function sortCategoriesByServiceOrder<T extends { title: string }>(
  categories: readonly T[],
  serviceOrder: ServiceOrderSettings | null | undefined,
): T[] {
  if (!serviceOrder?.categories?.length) return [...categories];

  const remaining = [...categories];
  const ordered: T[] = [];

  for (const orderedTitle of serviceOrder.categories) {
    if (!isCategoryVisibleInServiceOrder(serviceOrder, orderedTitle)) continue;
    const index = remaining.findIndex((entry) => serviceOrderLabelsMatch(entry.title, orderedTitle));
    if (index < 0) continue;
    ordered.push(remaining[index]);
    remaining.splice(index, 1);
  }

  for (const entry of remaining) {
    if (!isCategoryVisibleInServiceOrder(serviceOrder, entry.title)) continue;
    ordered.push(entry);
  }

  return ordered;
}

export function sortServicesByServiceOrder(
  services: readonly string[],
  category: string,
  serviceOrder: ServiceOrderSettings | null | undefined,
): string[] {
  if (!serviceOrder) return [...services];
  const matchedKey =
    Object.keys(serviceOrder.servicesByCategory ?? {}).find((key) => serviceOrderLabelsMatch(key, category)) ??
    category;
  const preferred = serviceOrder.servicesByCategory?.[matchedKey] ?? [];

  const remaining = [...services];
  const ordered: string[] = [];

  for (const name of preferred) {
    if (!isServiceVisibleInServiceOrder(serviceOrder, category, name)) continue;
    const index = remaining.findIndex((entry) => serviceOrderLabelsMatch(entry, name));
    if (index < 0) continue;
    ordered.push(remaining[index]);
    remaining.splice(index, 1);
  }

  for (const entry of remaining) {
    if (!isServiceVisibleInServiceOrder(serviceOrder, category, entry)) continue;
    ordered.push(entry);
  }

  return ordered;
}

/**
 * True when saved order is missing/empty, or looks like an unused platform-8 seed
 * (categories only, no listed services, no hide rules) — prefer Business Template defaults.
 */
export function shouldPreferTemplateServiceOrderDefaults(
  saved: ServiceOrderSettings | null | undefined,
): boolean {
  if (!saved?.categories?.length) return true;

  const hasAnyListedService = Object.values(
    saved.servicesByCategory ?? {},
  ).some((list) => (list?.length ?? 0) > 0);
  const hasHides =
    (saved.hiddenCategories?.length ?? 0) > 0 ||
    Object.values(saved.hiddenServicesByCategory ?? {}).some(
      (list) => (list?.length ?? 0) > 0,
    );
  if (hasAnyListedService || hasHides) return false;

  const platform = buildPlatformServiceOrderDefaults().categories;
  if (saved.categories.length !== platform.length) return false;
  return saved.categories.every(
    (category, index) =>
      category.trim().toLowerCase() === platform[index].trim().toLowerCase(),
  );
}

/**
 * Business Setup Services Details source of truth:
 * Calendar Settings → Service Order Rules.
 * When calendar order is empty/missing (or an unused platform seed), prefer
 * Business Template order, then platform defaults.
 */
export function resolveBusinessSetupServiceOrder(
  saved: ServiceOrderSettings | null | undefined,
  templateFallback?: ServiceOrderSettings | null,
): ServiceOrderSettings {
  const template =
    templateFallback?.categories?.length ? templateFallback : null;
  const platform = buildPlatformServiceOrderDefaults();
  const fallback = template ?? platform;

  if (shouldPreferTemplateServiceOrderDefaults(saved)) {
    return dedupeServiceOrderSettings(
      normalizeServiceOrderSettings(template ?? undefined, fallback),
    );
  }

  return dedupeServiceOrderSettings(
    normalizeServiceOrderSettings(saved, fallback),
  );
}

