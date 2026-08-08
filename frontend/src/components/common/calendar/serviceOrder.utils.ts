import type { ServiceOrderSettings } from "./calendar-settings.types";
import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "../../../data/businessServiceCategorySlider.data";

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const CATEGORY_ALIAS_GROUPS: readonly (readonly string[])[] = [
  ["hair", "haar"],
  ["makeup", "make-up", "make up", "makeup"],
  ["lashes", "wimpers", "eyelashes"],
  ["brows", "wenkbrauwen", "eyebrows"],
  ["facial", "gezichtsbehandeling", "face"],
  ["nails", "nagels", "nail"],
  ["body", "lichaamsbehandeling", "body treatment", "body treatments"],
  ["waxing", "ontharing", "hair removal"],
  ...BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => [entry.key, normalizeToken(entry.label)] as const),
];

function categoryAliasGroup(value: string): string | null {
  const token = normalizeToken(value);
  if (!token) return null;
  for (const group of CATEGORY_ALIAS_GROUPS) {
    if (group.some((alias) => token === alias || token.includes(alias) || alias.includes(token))) {
      return group[0];
    }
  }
  return null;
}

export function serviceOrderLabelsMatch(a: string, b: string): boolean {
  const left = normalizeToken(a);
  const right = normalizeToken(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const leftGroup = categoryAliasGroup(left);
  const rightGroup = categoryAliasGroup(right);
  if (leftGroup && rightGroup && leftGroup === rightGroup) return true;
  return left.includes(right) || right.includes(left);
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

