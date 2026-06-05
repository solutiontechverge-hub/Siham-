import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "./businessServiceCategorySlider.data";

export type BusinessServiceModalMode = "service" | "subservice";

export type BusinessServicePriceType = "fixed" | "from";

export type BusinessServiceDiscountType = "fixed" | "percent";

export type BusinessServiceFormDraft = {
  name: string;
  info: string;
  durationFrom: string;
  durationTo: string;
  priceType: BusinessServicePriceType;
  priceAmount: string;
  currency: string;
  discountType: BusinessServiceDiscountType;
  discountAmount: string;
  discountStartDate: string;
  discountEndDate: string;
  discountDescription: string;
  /** Catalog subcategory id — resolved when saving a subservice */
  catalogServiceId: string;
};

export type BusinessMainServiceUi = {
  id: string;
  categoryId: string;
  name: string;
  serviceInfo: string;
  durationFrom: string;
  durationTo: string;
  priceType: BusinessServicePriceType;
  priceAmount: string;
  currency: string;
  discountType: BusinessServiceDiscountType;
  discountAmount: string;
  discountStartDate: string;
  discountEndDate: string;
  discountDescription: string;
};

export type BusinessSubserviceUi = {
  id: string;
  parentServiceId: string;
  categoryId: string;
  serviceId: string;
  name: string;
  discountInfo: string;
  durationFrom: string;
  durationTo: string;
  durationLabel?: string;
  priceLabel: string;
  categoryTitle?: string;
  priceType?: string;
  priceAmount?: string;
  discountType?: string;
  discountAmount?: string;
  discountStartDate?: string;
  discountEndDate?: string;
  discountDescription?: string;
};

export const businessServiceModalCopy = {
  addServiceTitle: "Add Service",
  editServiceTitle: "Edit Service",
  addSubserviceTitle: "Add Service",
  editSubserviceTitle: "Edit Service",
  customServiceHint: "Enter your own service name, price, and duration for this category.",
  cancelLabel: "Cancel",
  addLabel: "Add",
  saveLabel: "Save",
  updateLabel: "Update",
  nameLabel: "Name",
  serviceInfoLabel: "Service Info",
  subserviceInfoLabel: "Discount Info",
  serviceInfoPlaceholder: "Enter a description...",
  durationFromLabel: "Duration from",
  durationToLabel: "Duration to",
  durationPlaceholder: "00:00",
  priceTypeLabel: "Select starting price or fixed price",
  priceLabel: "Price",
  offerDiscountTitle: "Offer Discount",
  discountTypeLabel: "Discount type",
  discountAmountLabel: "Discount Amount",
  discountStartLabel: "Start Date",
  discountEndLabel: "End Date",
  discountDescriptionLabel: "Description",
  currencyCode: "EUR",
} as const;

export const businessServiceModalPriceTypes: { value: BusinessServicePriceType; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "from", label: "Starting from" },
];

export const businessServiceModalDiscountTypes: { value: BusinessServiceDiscountType; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "percent", label: "Percentage" },
];

export const createEmptyBusinessServiceFormDraft = (): BusinessServiceFormDraft => ({
  name: "",
  info: "",
  durationFrom: "",
  durationTo: "",
  priceType: "fixed",
  priceAmount: "",
  currency: businessServiceModalCopy.currencyCode,
  discountType: "fixed",
  discountAmount: "",
  discountStartDate: "",
  discountEndDate: "",
  discountDescription: "",
  catalogServiceId: "",
});

export function parseEuroAmountString(s: string): number | null {
  const raw = String(s ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\s/g, "");
  if (raw === "") return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function normalizeBusinessServicePriceType(type: string | undefined): BusinessServicePriceType {
  return type === "from" ? "from" : "fixed";
}

export function normalizeBusinessServiceDiscountType(t: string | undefined): BusinessServiceDiscountType {
  return t === "percent" ? "percent" : "fixed";
}

export function formatDurationRangeLabel(durationFrom: string, durationTo: string): string {
  const from = String(durationFrom ?? "").trim();
  const to = String(durationTo ?? "").trim();
  if (from && to) return `${from} - ${to}`;
  if (from) return from;
  if (to) return to;
  return "";
}

export function formatBusinessServicePriceLabel(
  priceType: string,
  priceAmount: string,
): string {
  const raw = priceAmount.trim().replace(",", ".").replace(/\s/g, "");
  const n = raw === "" ? Number.NaN : Number.parseFloat(raw);
  if (!Number.isFinite(n)) return "—";
  const amountPart = `${n} €`;
  if (normalizeBusinessServicePriceType(priceType) === "from") return `Starting from ${amountPart}`;
  return amountPart;
}

export function isHydratedMainServiceId(mainId: string): boolean {
  const id = String(mainId ?? "").trim();
  return id.startsWith("main-") && id.endsWith("-hydrated");
}

export function parsePriceLabelForModal(priceLabel: string): { type: BusinessServicePriceType; amount: string } {
  const t = priceLabel.trim().toLowerCase();
  if (!t || t === "—" || t === "-") return { type: "fixed", amount: "" };
  if (t.includes("free")) return { type: "fixed", amount: "0" };
  if (t.startsWith("starting from")) {
    const n = t.replace(/^starting from\s*/i, "").replace(/[€$eur,\s]/gi, "").match(/[\d.]+/);
    return { type: "from", amount: n?.[0] ?? "" };
  }
  if (t.startsWith("from")) {
    const n = t.replace(/^from\s*/i, "").replace(/[€$eur,\s]/gi, "").match(/[\d.]+/);
    return { type: "from", amount: n?.[0] ?? "" };
  }
  const n = t.replace(/[€$eur,\s]/gi, "").match(/[\d.]+/);
  return { type: "fixed", amount: n?.[0] ?? "" };
}

export function parseDurationRangeForModal(durationLabel?: string): { from: string; to: string } {
  const raw = String(durationLabel ?? "").trim();
  if (!raw) return { from: "", to: "" };
  const parts = raw.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return { from: parts[0].trim(), to: parts.slice(1).join("-").trim() };
  }
  return { from: raw, to: "" };
}

export function draftFromMainService(main: BusinessMainServiceUi): BusinessServiceFormDraft {
  return {
    name: main.name,
    info: main.serviceInfo,
    durationFrom: main.durationFrom,
    durationTo: main.durationTo,
    priceType: normalizeBusinessServicePriceType(main.priceType),
    priceAmount: main.priceAmount,
    currency: main.currency || businessServiceModalCopy.currencyCode,
    discountType: normalizeBusinessServiceDiscountType(main.discountType),
    discountAmount: main.discountAmount,
    discountStartDate: main.discountStartDate,
    discountEndDate: main.discountEndDate,
    discountDescription: main.discountDescription,
    catalogServiceId: "",
  };
}

export function draftFromSubservice(sub: BusinessSubserviceUi): BusinessServiceFormDraft {
  const parsed = parsePriceLabelForModal(sub.priceLabel);
  const duration = parseDurationRangeForModal(sub.durationLabel);
  return {
    name: sub.name,
    info: sub.discountInfo,
    durationFrom: sub.durationFrom || duration.from,
    durationTo: sub.durationTo || duration.to,
    priceType: normalizeBusinessServicePriceType(sub.priceType ?? parsed.type),
    priceAmount: sub.priceAmount ?? parsed.amount,
    currency: businessServiceModalCopy.currencyCode,
    discountType: normalizeBusinessServiceDiscountType(sub.discountType),
    discountAmount: sub.discountAmount ?? "",
    discountStartDate: sub.discountStartDate ?? "",
    discountEndDate: sub.discountEndDate ?? "",
    discountDescription: sub.discountDescription ?? "",
    catalogServiceId: String(sub.serviceId),
  };
}

export function mainServiceFromDraft(
  draft: BusinessServiceFormDraft,
  id: string,
  categoryId: string,
): BusinessMainServiceUi {
  return {
    id,
    categoryId,
    name: draft.name.trim(),
    serviceInfo: draft.info.trim(),
    durationFrom: draft.durationFrom.trim(),
    durationTo: draft.durationTo.trim(),
    priceType: normalizeBusinessServicePriceType(draft.priceType),
    priceAmount: draft.priceAmount.trim(),
    currency: draft.currency,
    discountType: normalizeBusinessServiceDiscountType(draft.discountType),
    discountAmount: draft.discountAmount.trim(),
    discountStartDate: draft.discountStartDate,
    discountEndDate: draft.discountEndDate,
    discountDescription: draft.discountDescription.trim(),
  };
}

export function subserviceFromDraft(
  draft: BusinessServiceFormDraft,
  id: string,
  parentServiceId: string,
  categoryId: string,
  serviceId: string,
  categoryTitle?: string,
): BusinessSubserviceUi {
  const priceType = normalizeBusinessServicePriceType(draft.priceType);
  const discountType = normalizeBusinessServiceDiscountType(draft.discountType);
  const rawDisc = draft.discountAmount.trim();
  const discVal = parseEuroAmountString(rawDisc);
  let discountAmount = "";
  if (discVal !== null && discVal > 0) {
    if (discountType === "percent" && discVal > 100) discountAmount = "";
    else discountAmount = rawDisc;
  }

  return {
    id,
    parentServiceId,
    categoryId,
    serviceId,
    name: draft.name.trim(),
    discountInfo: draft.info.trim(),
    durationFrom: draft.durationFrom.trim(),
    durationTo: draft.durationTo.trim(),
    durationLabel: formatDurationRangeLabel(draft.durationFrom, draft.durationTo),
    priceLabel: formatBusinessServicePriceLabel(priceType, draft.priceAmount),
    categoryTitle,
    priceType,
    priceAmount: draft.priceAmount.trim(),
    discountType,
    discountAmount,
    discountStartDate: draft.discountStartDate,
    discountEndDate: draft.discountEndDate,
    discountDescription: draft.discountDescription.trim(),
  };
}

export function hydrateMainAndSubservicesFromDetails(
  items: BusinessSubserviceUi[],
  categoryTitleById: Map<string, string>,
): { mains: BusinessMainServiceUi[]; subs: BusinessSubserviceUi[] } {
  const byCategory = new Map<string, BusinessSubserviceUi[]>();

  for (const item of items) {
    const categoryId = String(item.categoryId ?? "").trim();
    if (!categoryId) continue;
    const list = byCategory.get(categoryId) ?? [];
    list.push({
      ...item,
      parentServiceId: item.parentServiceId ?? "",
      discountInfo: item.discountInfo ?? "",
      durationFrom: item.durationFrom ?? "",
      durationTo: item.durationTo ?? "",
      priceLabel: item.priceLabel ?? "",
    });
    byCategory.set(categoryId, list);
  }

  const mains: BusinessMainServiceUi[] = [];
  const subs: BusinessSubserviceUi[] = [];

  for (const [categoryId, categoryItems] of byCategory.entries()) {
    const mainId = `main-${categoryId}-hydrated`;
    const title = categoryTitleById.get(categoryId) ?? categoryItems[0]?.categoryTitle ?? "Services";

    mains.push({
      id: mainId,
      categoryId,
      name: title,
      serviceInfo: "",
      durationFrom: "",
      durationTo: "",
      priceType: "fixed",
      priceAmount: "",
      currency: businessServiceModalCopy.currencyCode,
      discountType: "fixed",
      discountAmount: "",
      discountStartDate: "",
      discountEndDate: "",
      discountDescription: "",
    });

    for (const item of categoryItems) {
      subs.push({
        ...item,
        parentServiceId: item.parentServiceId || mainId,
      });
    }
  }

  return { mains, subs };
}

export function findSubcategoryIdByTitle(
  categoryId: string,
  title: string,
  businessCategories: Array<{ id: string | number; title: string; subcategories: Array<{ id: string | number; title: string }> }>,
): string | null {
  const category = resolveBusinessCategoryRecord(categoryId, businessCategories);
  if (!category) return null;

  const normalized = title.trim().toLowerCase();
  if (!normalized) return null;

  const match = category.subcategories.find((sub) => sub.title.trim().toLowerCase() === normalized);
  return match ? String(match.id) : null;
}

export function hasDuplicateServiceNameInCategory(
  categoryId: string,
  name: string,
  subservices: readonly { id: string; name: string; categoryId: string }[],
  editingSubId: string | null = null,
): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;

  return subservices.some(
    (item) =>
      item.id !== editingSubId &&
      String(item.categoryId) === String(categoryId) &&
      item.name.trim().toLowerCase() === normalized,
  );
}

export function resolveBusinessCategoryRecord(
  categoryId: string,
  businessCategories: Array<{ id: string | number; title: string; subcategories: Array<{ id: string | number; title: string }> }>,
) {
  const direct = businessCategories.find((item) => String(item.id) === String(categoryId));
  if (direct) return direct;

  const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
    (entry) => entry.key === categoryId || entry.label.toLowerCase() === String(categoryId).toLowerCase(),
  );
  if (!catalogEntry) return undefined;

  const normalizedLabel = catalogEntry.label.toLowerCase().trim();
  return (
    businessCategories.find((item) => item.title.toLowerCase().trim() === normalizedLabel) ??
    businessCategories.find(
      (item) =>
        item.title.toLowerCase().includes(catalogEntry.key) ||
        catalogEntry.label.toLowerCase().includes(item.title.toLowerCase()),
    )
  );
}
