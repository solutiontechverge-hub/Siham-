/**
 * Maps API / CMS category titles to slider icon variants for business setup (services).
 * Supports Dutch and common English keywords; unknown categories fall back to `generic`.
 */
export type ServiceCategorySliderIconId =
  | "all"
  | "hair"
  | "makeup"
  | "lashes"
  | "brows"
  | "facial"
  | "nails"
  | "body"
  | "waxing"
  | "generic";

/** Platform service types shown in the Services Details slider (image / product catalog). */
export const BUSINESS_SERVICE_CATEGORY_CATALOG = [
  { key: "hair", label: "Hair", iconId: "hair" },
  { key: "makeup", label: "Make-Up", iconId: "makeup" },
  { key: "lashes", label: "Wimpers", iconId: "lashes" },
  { key: "brows", label: "Wenkbrauwen", iconId: "brows" },
  { key: "facial", label: "Gezichtsbehandeling", iconId: "facial" },
  { key: "nails", label: "Nagels", iconId: "nails" },
  { key: "body", label: "Lichaamsbehandeling", iconId: "body" },
  { key: "waxing", label: "Ontharing", iconId: "waxing" },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  iconId: Exclude<ServiceCategorySliderIconId, "all" | "generic">;
}>;

export type ServiceCategoryTab = {
  id: string;
  label: string;
  iconId: ServiceCategorySliderIconId;
};

export type BusinessCategoryLike = {
  id: string | number;
  title: string;
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveServiceCategorySliderIconId(title: string): ServiceCategorySliderIconId {
  const t = normalizeTitle(title);

  if (t === "all") return "all";

  if (t.includes("onthar") || t.includes("wax") || t.includes("epil") || t.includes("ipl")) return "waxing";
  if (t.includes("wenk") || t.includes("eyebrow") || t.includes("brow")) return "brows";
  if (t.includes("wimper") || t.includes("lash")) return "lashes";
  if (t.includes("make-up") || t.includes("makeup") || t.includes("make up") || t.includes("schmink")) return "makeup";
  if (t.includes("haar") || t.includes("hair") || t.includes("kapper") || t.includes("kapsel")) return "hair";
  if (t.includes("nagel") || t.includes("nail") || t.includes("manicure") || t.includes("pedicure")) return "nails";
  if (t.includes("gezicht") || t.includes("facial") || t.includes("huid")) return "facial";
  if (t.includes("lichaam") || t.includes("body") || t.includes("massage")) return "body";

  return "generic";
}

export function findBusinessCategoryForCatalogEntry(
  businessCategories: readonly BusinessCategoryLike[],
  entry: (typeof BUSINESS_SERVICE_CATEGORY_CATALOG)[number],
): BusinessCategoryLike | undefined {
  const normalizedLabel = normalizeTitle(entry.label);
  return (
    businessCategories.find((c) => normalizeTitle(c.title) === normalizedLabel) ??
    businessCategories.find((c) => resolveServiceCategorySliderIconId(c.title) === entry.iconId)
  );
}

/** Always returns All + 8 catalog categories; maps API ids when categories exist in the database. */
export function buildServiceCategoryTabs(businessCategories: readonly BusinessCategoryLike[]): ServiceCategoryTab[] {
  return [
    { id: "all", label: "All", iconId: "all" },
    ...BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => {
      const apiCategory = findBusinessCategoryForCatalogEntry(businessCategories, entry);
      return {
        id: apiCategory ? String(apiCategory.id) : entry.key,
        label: entry.label,
        iconId: entry.iconId,
      };
    }),
  ];
}

export function resolveCategoryTabId(
  tabId: string,
  tabs: readonly ServiceCategoryTab[],
  businessCategories: readonly BusinessCategoryLike[],
): string {
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab || tab.id === "all") return tabId;
  const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find((e) => e.key === tab.id || e.iconId === tab.iconId);
  if (catalogEntry) {
    const apiCategory = findBusinessCategoryForCatalogEntry(businessCategories, catalogEntry);
    if (apiCategory) return String(apiCategory.id);
  }
  return tabId;
}

/** Id used when saving services — prefers API category uuid, falls back to slider tab id (e.g. `hair`). */
export function resolveServiceCategoryStorageId(
  tabOrCategoryId: string,
  tabs: readonly ServiceCategoryTab[],
  businessCategories: readonly BusinessCategoryLike[],
): string {
  const raw = String(tabOrCategoryId ?? "").trim();
  if (!raw || raw === "all") return "";

  const apiResolved = resolveCategoryTabId(raw, tabs, businessCategories);
  if (businessCategories.some((category) => String(category.id) === apiResolved)) {
    return apiResolved;
  }

  const tab = tabs.find((item) => item.id === raw || item.id === apiResolved);
  if (tab && tab.id !== "all") return tab.id;

  return apiResolved || raw;
}

export function serviceMatchesCategoryTab(
  service: { categoryId?: string; categoryTitle?: string },
  tabId: string,
  tabs: readonly ServiceCategoryTab[],
  businessCategories: readonly BusinessCategoryLike[],
): boolean {
  if (!tabId || tabId === "all") return true;

  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return String(service.categoryId ?? "") === tabId;

  if (String(service.categoryId ?? "") === tabId) return true;

  const catalogEntry =
    BUSINESS_SERVICE_CATEGORY_CATALOG.find((e) => e.key === tabId) ??
    (tab.iconId !== "all" && tab.iconId !== "generic"
      ? BUSINESS_SERVICE_CATEGORY_CATALOG.find((e) => e.iconId === tab.iconId)
      : undefined);

  const categoryRecord = businessCategories.find((c) => String(c.id) === String(service.categoryId));
  if (categoryRecord && resolveServiceCategorySliderIconId(categoryRecord.title) === tab.iconId) {
    return true;
  }

  if (service.categoryTitle && resolveServiceCategorySliderIconId(service.categoryTitle) === tab.iconId) {
    return true;
  }

  if (catalogEntry && service.categoryId === catalogEntry.key) return true;

  return false;
}
