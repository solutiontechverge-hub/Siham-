import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "./businessServiceCategorySlider.data";

export type BusinessServiceModalMode = "service" | "subservice";

export type BusinessServicePriceType = "fixed" | "from";

export type BusinessServiceDiscountType = "fixed" | "percent";

export type BusinessServiceFormDraft = {
  name: string;
  info: string;
  durationFromHours: string;
  durationFromMinutes: string;
  durationToHours: string;
  durationToMinutes: string;
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
  addNestedSubserviceTitle: "Add Sub Service",
  editSubserviceTitle: "Edit Service",
  viewSubserviceTitle: "View Service",
  customServiceHint: "Enter your own service name, price, and duration for this category.",
  cancelLabel: "Cancel",
  addLabel: "Add",
  saveLabel: "Save",
  updateLabel: "Update",
  nameLabel: "Name",
  namePlaceholder: "Enter service name",
  serviceInfoLabel: "Service Info",
  subserviceInfoLabel: "Service Info",
  serviceInfoPlaceholder: "Enter service information",
  durationFromLabel: "Duration from",
  durationToLabel: "Duration to",
  durationHoursLabel: "Hours",
  durationMinutesLabel: "Minutes",
  durationHoursPlaceholder: "0",
  durationMinutesPlaceholder: "0",
  durationHoursSuffix: "H",
  durationMinutesSuffix: "M",
  priceTypeLabel: "Select starting price or fixed price",
  priceLabel: "Price",
  offerDiscountTitle: "Offer Discount",
  discountTypeLabel: "Discount type",
  discountAmountLabel: "Discount Amount",
  discountStartLabel: "Start Date",
  discountEndLabel: "End Date",
  discountDescriptionLabel: "Description",
  discountDescriptionPlaceholder: "Enter description",
  discountDescriptionOptionalHint: "Optional",
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
  durationFromHours: "",
  durationFromMinutes: "",
  durationToHours: "",
  durationToMinutes: "",
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
    .replace(/[^0-9.,-]/g, "")
    .replace(",", ".");
  if (raw === "") return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function hasValidServicePrice(draft: Pick<BusinessServiceFormDraft, "priceAmount">): boolean {
  const price = parseEuroAmountString(draft.priceAmount);
  return price !== null && price > 0;
}

export function normalizeBusinessServicePriceType(type: string | undefined): BusinessServicePriceType {
  return type === "from" ? "from" : "fixed";
}

export function normalizeBusinessServiceDiscountType(t: string | undefined): BusinessServiceDiscountType {
  const raw = String(t ?? "").trim().toLowerCase();
  return raw === "percent" || raw === "percentage" ? "percent" : "fixed";
}

export type BusinessServiceDiscountFields = {
  discountType: BusinessServiceDiscountType;
  discountAmount: string;
  discountStartDate: string;
  discountEndDate: string;
  discountDescription: string;
};

export type BusinessServiceDiscountSource = {
  discountType?: unknown;
  discount_type?: unknown;
  discountAmount?: unknown;
  discount_amount?: unknown;
  discountStartDate?: unknown;
  discount_start_date?: unknown;
  discountEndDate?: unknown;
  discount_end_date?: unknown;
  discountDescription?: unknown;
  discount_description?: unknown;
};

/** Local calendar day as YYYY-MM-DD — avoids UTC off-by-one. */
export function businessServiceLocalTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Keep only the calendar date. Never Date.parse — that shifts timezone. */
export function normalizeBusinessServiceDiscountDate(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function readBusinessServiceDiscountFields(
  source?: BusinessServiceDiscountSource | null,
): BusinessServiceDiscountFields {
  const amountRaw = source?.discountAmount ?? source?.discount_amount ?? "";
  const amount =
    amountRaw === null || amountRaw === undefined || amountRaw === ""
      ? ""
      : String(amountRaw);
  let start = normalizeBusinessServiceDiscountDate(
    source?.discountStartDate ?? source?.discount_start_date,
  );
  let end = normalizeBusinessServiceDiscountDate(
    source?.discountEndDate ?? source?.discount_end_date,
  );
  if (start && end && start > end) {
    const swap = start;
    start = end;
    end = swap;
  }
  return {
    discountType: normalizeBusinessServiceDiscountType(
      String(source?.discountType ?? source?.discount_type ?? ""),
    ),
    discountAmount: amount,
    discountStartDate: start,
    discountEndDate: end,
    discountDescription: String(
      source?.discountDescription ?? source?.discount_description ?? "",
    ).trim(),
  };
}

export function toBusinessServiceDiscountPayload(
  source?: BusinessServiceDiscountSource | null,
): {
  discount_type: BusinessServiceDiscountType | null;
  discount_amount: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  discount_description: string | null;
} {
  const fields = readBusinessServiceDiscountFields(source);
  const amount = parseEuroAmountString(fields.discountAmount);
  if (amount === null || amount <= 0) {
    return {
      discount_type: null,
      discount_amount: null,
      discount_start_date: null,
      discount_end_date: null,
      discount_description: null,
    };
  }
  if (fields.discountType === "percent" && amount > 100) {
    return {
      discount_type: null,
      discount_amount: null,
      discount_start_date: null,
      discount_end_date: null,
      discount_description: null,
    };
  }
  return {
    discount_type: fields.discountType,
    discount_amount: amount,
    discount_start_date: fields.discountStartDate || null,
    discount_end_date: fields.discountEndDate || null,
    discount_description: fields.discountDescription || null,
  };
}

export function isBusinessServiceDiscountActive(
  source?: BusinessServiceDiscountSource | null,
  onDateIso?: string,
): boolean {
  const fields = readBusinessServiceDiscountFields(source);
  const amount = parseEuroAmountString(fields.discountAmount);
  if (amount === null || amount <= 0) return false;
  if (fields.discountType === "percent" && amount > 100) return false;
  const day =
    normalizeBusinessServiceDiscountDate(onDateIso) || businessServiceLocalTodayIso();
  if (fields.discountStartDate && day < fields.discountStartDate) return false;
  if (fields.discountEndDate && day > fields.discountEndDate) return false;
  return true;
}

export function applyBusinessServiceDiscount(
  base: number,
  source?: BusinessServiceDiscountSource | null,
  onDateIso?: string,
): { amount: number; active: boolean; percentOff: number | null } {
  const safeBase = Number.isFinite(base) ? Math.max(0, base) : 0;
  if (!isBusinessServiceDiscountActive(source, onDateIso)) {
    return { amount: safeBase, active: false, percentOff: null };
  }
  const fields = readBusinessServiceDiscountFields(source);
  const discVal = parseEuroAmountString(fields.discountAmount) ?? 0;
  const final =
    fields.discountType === "percent"
      ? Math.max(0, safeBase * (1 - Math.min(100, discVal) / 100))
      : Math.max(0, safeBase - discVal);
  return {
    amount: Math.round(final * 100) / 100,
    active: true,
    percentOff: fields.discountType === "percent" ? discVal : null,
  };
}

/** Visible chip/label when a discount amount is configured (date window optional). */
export function formatBusinessServiceDiscountFeatureLabel(
  source?: BusinessServiceDiscountSource | null,
): string | null {
  const fields = readBusinessServiceDiscountFields(source);
  const amount = parseEuroAmountString(fields.discountAmount);
  if (amount === null || amount <= 0) return null;
  if (fields.discountType === "percent") {
    if (amount > 100) return null;
    return `${amount}% Discount`;
  }
  return `€${amount} Discount`;
}

/** Description + validity dates for hover (empty when neither is set). */
export function formatBusinessServiceDiscountTooltip(
  source?: BusinessServiceDiscountSource | null,
): string {
  const fields = readBusinessServiceDiscountFields(source);
  const lines: string[] = [];
  const desc = fields.discountDescription.trim();
  if (desc) lines.push(desc);
  const start = fields.discountStartDate;
  const end = fields.discountEndDate;
  if (start && end) lines.push(`${start} – ${end}`);
  else if (start) lines.push(`From ${start}`);
  else if (end) lines.push(`Until ${end}`);
  return lines.join("\n");
}

export function sanitizeDurationHours(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function sanitizeDurationMinutes(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return String(Math.min(Number.parseInt(digits, 10), 59));
}

export function formatDurationPart(hours: string, minutes: string): string {
  const h = Number.parseInt(hours, 10) || 0;
  const m = Number.parseInt(minutes, 10) || 0;
  if (h <= 0 && m <= 0) return "";
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} h`);
  if (m > 0) parts.push(`${m} min`);
  return parts.join(" ");
}

export function formatDurationRangeLabel(
  fromHours: string,
  fromMinutes: string,
  toHours: string,
  toMinutes: string,
): string {
  const from = formatDurationPart(fromHours, fromMinutes);
  const to = formatDurationPart(toHours, toMinutes);
  if (from && to) return `${from} - ${to}`;
  if (from) return from;
  if (to) return to;
  return "";
}

export function parseDurationPartLabel(label: string): { hours: string; minutes: string } {
  const raw = String(label ?? "").trim();
  if (!raw) return { hours: "", minutes: "" };

  if (/\d{1,2}:\d{2}/.test(raw) && /(am|pm)/i.test(raw)) {
    return { hours: "", minutes: "" };
  }

  const normalized = raw.toLowerCase();
  const hours = normalized.match(/(\d+)\s*h(?:our|rs?)?\b/)?.[1] ?? "";
  const minutes = normalized.match(/(\d+)\s*m(?:in(?:ute)?s?)?\b/)?.[1] ?? "";
  if (hours || minutes) return { hours, minutes };

  const onlyNumber = normalized.match(/^(\d+)$/);
  if (onlyNumber) return { hours: "", minutes: onlyNumber[1] };

  const firstNumber = normalized.match(/(\d+)/);
  if (firstNumber) return { hours: "", minutes: firstNumber[1] };

  return { hours: "", minutes: "" };
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

export function parseDurationRangeForModal(durationLabel?: string): {
  fromHours: string;
  fromMinutes: string;
  toHours: string;
  toMinutes: string;
} {
  const raw = String(durationLabel ?? "").trim();
  if (!raw) {
    return { fromHours: "", fromMinutes: "", toHours: "", toMinutes: "" };
  }
  const parts = raw.split(/\s*-\s*/);
  if (parts.length >= 2) {
    const from = parseDurationPartLabel(parts[0]);
    const to = parseDurationPartLabel(parts.slice(1).join("-"));
    return {
      fromHours: from.hours,
      fromMinutes: from.minutes,
      toHours: to.hours,
      toMinutes: to.minutes,
    };
  }
  const from = parseDurationPartLabel(raw);
  return {
    fromHours: from.hours,
    fromMinutes: from.minutes,
    toHours: "",
    toMinutes: "",
  };
}

export function draftFromMainService(main: BusinessMainServiceUi): BusinessServiceFormDraft {
  const from = parseDurationPartLabel(main.durationFrom);
  const to = parseDurationPartLabel(main.durationTo);
  return {
    name: main.name,
    info: main.serviceInfo,
    durationFromHours: from.hours,
    durationFromMinutes: from.minutes,
    durationToHours: to.hours,
    durationToMinutes: to.minutes,
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
  const from = sub.durationFrom ? parseDurationPartLabel(sub.durationFrom) : { hours: duration.fromHours, minutes: duration.fromMinutes };
  const to = sub.durationTo ? parseDurationPartLabel(sub.durationTo) : { hours: duration.toHours, minutes: duration.toMinutes };
  return {
    name: sub.name,
    info: sub.discountInfo,
    durationFromHours: from.hours,
    durationFromMinutes: from.minutes,
    durationToHours: to.hours,
    durationToMinutes: to.minutes,
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
  const durationFrom = formatDurationPart(draft.durationFromHours, draft.durationFromMinutes);
  const durationTo = formatDurationPart(draft.durationToHours, draft.durationToMinutes);
  return {
    id,
    categoryId,
    name: draft.name.trim(),
    serviceInfo: draft.info.trim(),
    durationFrom,
    durationTo,
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
    durationFrom: formatDurationPart(draft.durationFromHours, draft.durationFromMinutes),
    durationTo: formatDurationPart(draft.durationToHours, draft.durationToMinutes),
    durationLabel: formatDurationRangeLabel(
      draft.durationFromHours,
      draft.durationFromMinutes,
      draft.durationToHours,
      draft.durationToMinutes,
    ),
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
