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
  { key: "lashes", label: "Lashes", iconId: "lashes" },
  { key: "brows", label: "Eyebrows", iconId: "brows" },
  { key: "facial", label: "Facial treatment", iconId: "facial" },
  { key: "nails", label: "Nails", iconId: "nails" },
  { key: "body", label: "Body treatment", iconId: "body" },
  { key: "waxing", label: "Hair Removal", iconId: "waxing" },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  iconId: Exclude<ServiceCategorySliderIconId, "all" | "generic">;
}>;

/** Default category labels for a new professional (Services Details + Calendar Service Order). */
export const PLATFORM_DEFAULT_SERVICE_CATEGORY_LABELS =
  BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => entry.label);

/** Empty service-order seed used until the professional customizes hide/order in Calendar Settings. */
export function buildPlatformServiceOrderDefaults(): {
  categories: string[];
  servicesByCategory: Record<string, string[]>;
} {
  return {
    categories: [...PLATFORM_DEFAULT_SERVICE_CATEGORY_LABELS],
    servicesByCategory: Object.fromEntries(
      PLATFORM_DEFAULT_SERVICE_CATEGORY_LABELS.map((label) => [label, [] as string[]]),
    ),
  };
}

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

  if (
    t.includes("onthar") ||
    t.includes("wax") ||
    t.includes("epil") ||
    t.includes("ipl") ||
    t.includes("hair removal") ||
    t.includes("haarverwijder")
  ) {
    return "waxing";
  }
  if (t.includes("wenk") || t.includes("eyebrow") || t.includes("brow")) return "brows";
  if (t.includes("wimper") || t.includes("lash")) return "lashes";
  if (t.includes("make-up") || t.includes("makeup") || t.includes("make up") || t.includes("schmink")) return "makeup";
  if (t.includes("haar") || t.includes("hair") || t.includes("kapper") || t.includes("kapsel")) return "hair";
  if (t.includes("nagel") || t.includes("nail") || t.includes("manicure") || t.includes("pedicure")) return "nails";
  if (
    t.includes("gezicht") ||
    t.includes("facial") ||
    t.includes("face treatment") ||
    t.includes("face ") ||
    t.includes("huid")
  ) {
    return "facial";
  }
  if (
    t.includes("lichaam") ||
    t.includes("body treatment") ||
    t.includes("bodytreat") ||
    t.includes("body") ||
    t.includes("massage")
  ) {
    return "body";
  }

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

export function buildCategoryTabFromRecord(category: BusinessCategoryLike): ServiceCategoryTab {
  const iconId = resolveServiceCategorySliderIconId(category.title);
  const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
    (entry) => entry.iconId === iconId,
  );
  return {
    id: String(category.id),
    label: catalogEntry?.label ?? category.title,
    iconId,
  };
}

/** Build tabs from API/database categories, optionally limited to categories that have services. */
export function buildDynamicServiceCategoryTabs(
  businessCategories: readonly BusinessCategoryLike[],
  options?: { onlyCategoryIds?: readonly string[] },
): ServiceCategoryTab[] {
  const onlyIds = options?.onlyCategoryIds
    ? new Set(options.onlyCategoryIds.map((id) => String(id)))
    : null;

  const categoryTabs = businessCategories
    .filter((category) => {
      const id = String(category.id);
      return id && (!onlyIds || onlyIds.has(id));
    })
    .map(buildCategoryTabFromRecord);

  return [{ id: "all", label: "All", iconId: "all" }, ...categoryTabs];
}

function buildCatalogFallbackTabs(): ServiceCategoryTab[] {
  return [{ id: "all", label: "All", iconId: "all" }];
}

/**
 * Dynamic category tabs for business setup and listings.
 * Uses database categories when available; otherwise only "All" (no hardcoded catalog).
 */
export function buildServiceCategoryTabs(businessCategories: readonly BusinessCategoryLike[]): ServiceCategoryTab[] {
  if (businessCategories.length > 0) {
    return buildDynamicServiceCategoryTabs(businessCategories);
  }

  return [{ id: "all", label: "All", iconId: "all" }];
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

  if (tab.label && service.categoryTitle) {
    if (normalizeTitle(service.categoryTitle) === normalizeTitle(tab.label)) return true;
  }

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
