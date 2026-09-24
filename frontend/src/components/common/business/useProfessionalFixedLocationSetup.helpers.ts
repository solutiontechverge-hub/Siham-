/** Pure helpers for ProfessionalFixedLocationSetup (move-only extract). */

import type { FixedLocationFormState } from "../../../app/professionals/fixed-location/fixedLocation.use";
import type {
  ProfessionalProfile,
  ProfileResponse,
} from "../../../store/services/profileApi";
import { formatCompactEuro } from "../booking-finance/formatBookingFinance";
import {
  isBusinessServiceDiscountActive,
  applyBusinessServiceDiscount,
  formatBusinessServiceDiscountFeatureLabel,
  formatBusinessServiceDiscountTooltip,
  normalizeBusinessServicePriceType,
  parseEuroAmountString,
  parsePriceLabelForModal,
  toBusinessServiceDiscountPayload,
  type BusinessSubserviceUi,
} from "../../../data/businessServiceModal.data";
import { professionalEditableFieldKeys } from "./professionalFixedLocationSetup.data";

export type ServiceDetailUiItem = BusinessSubserviceUi;

export type TeamServiceSlots = {
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
  slot5: string;
  slot6: string;
  slot7: string;
};

export const mapServiceItemsToCategories = (
  items: ServiceDetailUiItem[],
  hiddenExtras: Array<Record<string, unknown>> = [],
) => {
  const visible = items
    .filter((item) => item.serviceId && item.categoryId)
    .map((item) => {
      const parentId = String(item.parentServiceId ?? "").trim();
      const amount =
        parseEuroAmountString(item.priceAmount ?? "") ??
        Number(String(item.priceLabel).replace(/[^0-9.]/g, ""));
      return {
        category_id: String(item.categoryId),
        service_id: String(item.serviceId),
        category_title: item.categoryTitle?.trim() || null,
        service_title: item.name?.trim() || null,
        amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
        duration_label: (item.durationLabel ?? "").trim() || null,
        parent_service_id:
          parentId && !parentId.startsWith("main-") ? parentId : null,
        is_visible: true,
        ...toBusinessServiceDiscountPayload(item),
      };
    })
    .filter((entry) => entry.amount > 0);

  const visibleIds = new Set(visible.map((entry) => String(entry.service_id)));
  const hidden = hiddenExtras
    .filter((entry) => {
      const serviceId = String(
        entry.service_id ?? entry.serviceId ?? "",
      ).trim();
      return serviceId && !visibleIds.has(serviceId);
    })
    .map((entry) => ({
      category_id: String(entry.category_id ?? entry.categoryId ?? ""),
      service_id: String(entry.service_id ?? entry.serviceId ?? ""),
      category_title:
        String(entry.category_title ?? entry.categoryTitle ?? "").trim() ||
        null,
      service_title:
        String(entry.service_title ?? entry.serviceTitle ?? "").trim() || null,
      amount: Number(entry.amount) || 0,
      duration_label:
        String(entry.duration_label ?? entry.durationLabel ?? "").trim() ||
        null,
      parent_service_id:
        String(entry.parent_service_id ?? entry.parentServiceId ?? "").trim() ||
        null,
      is_visible: false,
      ...toBusinessServiceDiscountPayload(entry),
    }))
    .filter((entry) => entry.category_id && entry.service_id);

  return [...visible, ...hidden];
};

export function normalizePriceType(type: string | undefined): "fixed" | "from" {
  return normalizeBusinessServicePriceType(type);
}

export function hasServiceDiscount(it: ServiceDetailUiItem): boolean {
  return isBusinessServiceDiscountActive(it);
}

export function getServiceBaseAmountNumber(it: ServiceDetailUiItem): number | null {
  const fromField = parseEuroAmountString(it.priceAmount ?? "");
  if (fromField !== null) return fromField;
  const parsed = parsePriceLabelForModal(it.priceLabel);
  return parseEuroAmountString(parsed.amount);
}

export function computeDiscountedBaseAmount(
  base: number,
  it: ServiceDetailUiItem,
): number {
  return applyBusinessServiceDiscount(base, it).amount;
}

export function formatEuroDisplay(n: number): string {
  return formatCompactEuro(n);
}

export function formatPriceForCard(priceType: string, amount: number): string {
  const core = formatEuroDisplay(amount);
  if (normalizePriceType(priceType) === "from") return `Starting from ${core}`;
  return core;
}

/** Primary = price after discount when applicable; optional strikethrough = pre-discount. */
export function getServiceCardPriceParts(it: ServiceDetailUiItem): {
  primary: string;
  strikethrough?: string;
  discountLabel?: string;
  discountTooltip?: string;
} {
  const discountLabel =
    formatBusinessServiceDiscountFeatureLabel(it) ?? undefined;
  const discountTooltip =
    formatBusinessServiceDiscountTooltip(it) || undefined;
  const meta = { discountLabel, discountTooltip };
  const parsed = parsePriceLabelForModal(it.priceLabel);
  const pt = normalizePriceType(it.priceType ?? parsed.type);
  const base = getServiceBaseAmountNumber(it);
  if (base === null) {
    const fallback = it.priceLabel?.trim();
    return {
      primary: fallback && fallback !== "" ? fallback : "—",
      ...meta,
    };
  }
  const originalStr = formatPriceForCard(pt, base);
  if (!hasServiceDiscount(it)) return { primary: originalStr, ...meta };
  const finalAmount = computeDiscountedBaseAmount(base, it);
  const finalStr = formatPriceForCard(pt, finalAmount);
  if (finalStr === originalStr) return { primary: originalStr, ...meta };
  return { primary: finalStr, strikethrough: originalStr, ...meta };
}

export function parseFixedLocationMunicipalities(
  value: string | null | undefined,
): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatFixedLocationMunicipalities(values: readonly string[]): string {
  return values
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
}

export type ProfessionalEditableDraft = Pick<
  FixedLocationFormState,
  (typeof professionalEditableFieldKeys)[number]
>;

export function getProfessionalProfileRecord(profileData: ProfileResponse | null) {
  if (!profileData || profileData.user_type !== "professional") {
    return null;
  }

  return profileData.profile as ProfessionalProfile | null;
}

export function buildProfessionalDraftFromProfile(
  profileData: ProfileResponse | null,
): ProfessionalEditableDraft {
  const professionalProfile = getProfessionalProfileRecord(profileData);

  return {
    companyLegalName: professionalProfile?.legal_name || "",
    companyCocNumber: professionalProfile?.ccc_number || "",
    companyVatNumber: professionalProfile?.vat_number || "",
    companyStreet: professionalProfile?.street || "",
    companyStreetNumber: professionalProfile?.street_number || "",
    companyPostalCode: professionalProfile?.postal_code || "",
    companyProvince: professionalProfile?.province || "",
    companyMunicipality: professionalProfile?.municipality || "",
    companyBusinessType: professionalProfile?.business_type || "",
    companyWebsite: professionalProfile?.website || "",
    socialInstagram: professionalProfile?.instagram || "",
    socialOther: professionalProfile?.other_link || "",
    contactFirstName: professionalProfile?.contact_first_name || "",
    contactLastName: professionalProfile?.contact_last_name || "",
    contactEmail: profileData?.email || "",
    contactPhone: professionalProfile?.phone || "",
  };
}

export function getProfessionalPhotoSrcFromProfile(
  profileData: ProfileResponse | null,
) {
  return getProfessionalProfileRecord(profileData)?.profile_picture || "";
}
