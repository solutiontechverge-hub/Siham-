import {
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
} from "../../../../images";
import type { BusinessSetupListing } from "../../../store/services/businessApi";
import { resolvePriceTier } from "../../../components/common/listingDrawerFilters";
import {
  isCategoryVisibleInServiceOrder,
  isServiceVisibleInServiceOrder,
} from "../../../components/common/calendar/serviceOrder.utils";
import type { ServiceOrderSettings } from "../../../components/common/calendar/calendar-settings.types";
import { resolveBusinessOffering } from "./businessPublicProfile.mapper";
import { normalizeServiceDurationLabel } from "../../../utils/serviceDuration";
import type { ListingCardData } from "./listing.data";
import type { ListingCardServiceCatalogItem } from "./listing.cardPresentation";

const FALLBACK_IMAGES = [
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
];

const formatPriceLabel = (price: number) => {
  if (!Number.isFinite(price) || price <= 0) return "Price on request";
  return `Starting From ${Math.round(price)} EUR`;
};

const formatServiceName = (value: string) =>
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const slugifyCategoryKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const buildCategoryKeys = (setup: BusinessSetupListing): string[] => {
  const keys = new Set<string>();

  const add = (raw: string | null | undefined) => {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) return;
    keys.add(trimmed.toLowerCase());
    const slug = slugifyCategoryKey(trimmed);
    if (slug) keys.add(slug);
  };

  for (const entry of setup.serviceCategories ?? []) {
    add(entry.category_id as string | undefined);
    add(entry.categoryId as string | undefined);
  }

  for (const combo of setup.bookServiceCombinations ?? []) {
    add(combo.category_id as string | undefined);
    add(combo.categoryId as string | undefined);
    add(combo.category_title ?? undefined);
    add(combo.categoryTitle ?? undefined);
    add(combo.service_title ?? undefined);
    add(combo.serviceTitle ?? undefined);
  }

  for (const detail of setup.serviceDetails ?? []) {
    add(detail.categoryId ?? undefined);
    add(detail.categoryTitle ?? undefined);
    add(detail.serviceTitle ?? undefined);
  }

  for (const keyword of setup.keywords ?? []) {
    add(keyword);
  }

  return [...keys];
};

const parsePriceRangeMin = (priceRange: string | null | undefined): number | null => {
  if (!priceRange) return null;
  const match = priceRange.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** Avoid broken labels like "From €€ EUR" when priceRange is symbols or tier text. */
const formatPriceRangeFallbackLabel = (
  priceRange: string | null | undefined,
): string => {
  const rangeMin = parsePriceRangeMin(priceRange);
  if (rangeMin != null) return formatPriceLabel(rangeMin);

  const trimmed = String(priceRange ?? "").trim();
  if (!trimmed) return "Price on request";
  // Currency symbols / empty junk only
  if (!/[a-zA-Z0-9]/.test(trimmed)) return "Price on request";
  // Qualitative tiers stored as "Low - High"
  if (/low|medium|high/i.test(trimmed)) {
    return trimmed.replace(/\s*-\s*/g, " – ");
  }
  return "Price on request";
};

const buildAddressLabel = (setup: BusinessSetupListing) => {
  const { fixedLocation, desiredLocation, locationMode } = setup;
  const fixedParts = [
    fixedLocation.streetNumber,
    fixedLocation.address,
    fixedLocation.municipality,
    fixedLocation.province,
  ]
    .filter(Boolean)
    .join(", ");

  if (fixedParts && (locationMode === "fixed" || locationMode === "both")) {
    return fixedParts;
  }

  const desiredParts = [desiredLocation.area, desiredLocation.province].filter(Boolean).join(", ");
  return desiredParts || fixedParts || "Location not specified";
};

const resolveLocationModeDefault = (
  locationMode: BusinessSetupListing["locationMode"],
): "fixed" | "desired" => {
  if (locationMode === "desired") return "desired";
  return "fixed";
};

const buildDurationByServiceId = (setup: BusinessSetupListing) => {
  const map = new Map<string, string>();

  for (const entry of setup.serviceCategories ?? []) {
    const serviceId = String(entry.service_id ?? entry.serviceId ?? "").trim();
    const label = String(entry.duration_label ?? entry.durationLabel ?? "").trim();
    if (serviceId && label) {
      map.set(serviceId, label);
      map.set(serviceId.toLowerCase(), label);
    }
  }

  return map;
};

const resolveServiceDurationLabel = (
  detail: BusinessSetupListing["serviceDetails"][number],
  durationByServiceId: Map<string, string>,
) => {
  const fromDetail = detail.durationLabel?.trim();
  if (fromDetail) {
    return normalizeServiceDurationLabel(fromDetail);
  }

  const serviceId = detail.serviceId != null ? String(detail.serviceId).trim() : "";
  const fromCategories =
    (serviceId ? durationByServiceId.get(serviceId) : undefined) ||
    (serviceId ? durationByServiceId.get(serviceId.toLowerCase()) : undefined);

  if (fromCategories) {
    return normalizeServiceDurationLabel(fromCategories);
  }

  return undefined;
};

const getServiceOrder = (
  setup: BusinessSetupListing,
): ServiceOrderSettings | null => {
  const raw = setup.serviceOrder;
  if (!raw || typeof raw !== "object") return null;
  return {
    categories: raw.categories ?? [],
    servicesByCategory: raw.servicesByCategory ?? {},
    hiddenCategories: raw.hiddenCategories ?? [],
    hiddenServicesByCategory: raw.hiddenServicesByCategory ?? {},
  };
};

const isSetupServicePubliclyVisible = (
  setup: BusinessSetupListing,
  categoryTitle: string | null | undefined,
  serviceTitle: string | null | undefined,
) => {
  const serviceOrder = getServiceOrder(setup);
  const category = String(categoryTitle ?? "").trim();
  const service = String(serviceTitle ?? "").trim();
  if (!category) return true;
  if (!isCategoryVisibleInServiceOrder(serviceOrder, category)) return false;
  if (!service) return true;
  return isServiceVisibleInServiceOrder(serviceOrder, category, service);
};

const buildServiceCatalog = (setup: BusinessSetupListing): ListingCardServiceCatalogItem[] => {
  const durationByServiceId = buildDurationByServiceId(setup);

  return (setup.serviceDetails ?? [])
    .filter((detail) => Boolean(detail.serviceTitle?.trim()))
    .filter((detail) => detail.isVisible !== false)
    .filter((detail) =>
      isSetupServicePubliclyVisible(
        setup,
        detail.categoryTitle,
        detail.serviceTitle,
      ),
    )
    .map((detail) => {
      const price = Number(detail.price);
      const serviceTitle = String(detail.serviceTitle ?? "").trim();
      const categoryTitle = String(detail.categoryTitle ?? "").trim();
      const categoryId = detail.categoryId != null ? String(detail.categoryId).trim() : "";

      return {
        name: formatServiceName(serviceTitle),
        price,
        durationLabel: resolveServiceDurationLabel(detail, durationByServiceId),
        categoryId: categoryId || undefined,
        categoryTitle: categoryTitle || undefined,
        searchTokens: [serviceTitle, categoryTitle, categoryId].filter(Boolean),
      };
    })
    .filter((item) => Number.isFinite(item.price) && item.price > 0);
};

const buildServices = (
  setup: BusinessSetupListing,
  catalog: ListingCardServiceCatalogItem[],
) => {
  const fromCatalog = [...catalog]
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      durationLabel: item.durationLabel,
      priceLabel: formatPriceLabel(item.price),
    }));

  if (fromCatalog.length > 0) {
    return fromCatalog;
  }

  const fromCombinations = (setup.bookServiceCombinations ?? [])
    .filter((combo) => Boolean(combo.serviceTitle?.trim()))
    .filter((combo) =>
      isSetupServicePubliclyVisible(
        setup,
        combo.categoryTitle ?? combo.category_title,
        combo.serviceTitle,
      ),
    )
    .slice(0, 3)
    .map((combo) => {
      const serviceId = String(combo.service_id ?? combo.serviceId ?? "").trim();
      const durationFromCategories =
        (serviceId ? durationByServiceId.get(serviceId) : undefined) ||
        (serviceId ? durationByServiceId.get(serviceId.toLowerCase()) : undefined);

      return {
        name: formatServiceName(combo.serviceTitle as string),
        durationLabel: durationFromCategories
          ? normalizeServiceDurationLabel(durationFromCategories)
          : undefined,
        priceLabel: formatPriceRangeFallbackLabel(setup.priceRange),
      };
    });

  if (fromCombinations.length > 0) {
    return fromCombinations;
  }

  return [
    {
      name: "Services",
      priceLabel: formatPriceRangeFallbackLabel(setup.priceRange),
    },
  ];
};

const resolveStartingFromLabel = (
  catalog: ListingCardServiceCatalogItem[],
  services: ListingCardData["services"],
) => {
  const lowestCatalogPrice = catalog
    .map((item) => item.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b)[0];

  if (lowestCatalogPrice != null) {
    return formatPriceLabel(lowestCatalogPrice);
  }

  const firstRealPrice = services.find(
    (svc) => svc.priceLabel && !/on request/i.test(svc.priceLabel),
  )?.priceLabel;

  return firstRealPrice ?? "Price on request";
};

export const mapBusinessSetupToListingCard = (
  setup: BusinessSetupListing,
  index: number,
): ListingCardData => {
  const serviceCatalog = buildServiceCatalog(setup);
  const services = buildServices(setup, serviceCatalog);
  const municipalityLabel =
    setup.fixedLocation.municipality ||
    setup.fixedLocation.province ||
    setup.desiredLocation.province ||
    setup.desiredLocation.area ||
    "";

  const title = setup.businessName || setup.salonName || "";
  const subtitle = setup.about
    ? setup.about.length > 80
      ? `${setup.about.slice(0, 77).trim()}...`
      : setup.about
    : "";

  const businessKeywords = setup.keywords ?? [];

  const searchText = [title, subtitle, municipalityLabel, ...businessKeywords]
    .join(" ")
    .toLowerCase();

  const media = (setup.media ?? [])
    .map((url) => (typeof url === "string" ? url.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);

  const fallbackImage = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const image = media[0] ?? fallbackImage;

  const lowestPrice =
    serviceCatalog
      .map((item) => item.price)
      .filter((price) => Number.isFinite(price) && price > 0)
      .sort((a, b) => a - b)[0] ??
    parsePriceRangeMin(setup.priceRange) ??
    0;

  const categoryIds = new Set(
    (setup.serviceCategories ?? [])
      .map((entry) => String(entry.category_id ?? entry.categoryId ?? "").trim())
      .filter(Boolean),
  );
  const combinationCategoryIds = new Set(
    (setup.bookServiceCombinations ?? [])
      .map((combo) => String(combo.category_id ?? combo.categoryId ?? "").trim())
      .filter(Boolean),
  );
  const coversAllSelectedCategories =
    categoryIds.size > 0 && [...categoryIds].every((id) => combinationCategoryIds.has(id));

  const appointmentBefore = setup.appointmentBefore;

  const hasDiscount = businessKeywords.some((keyword) =>
    /discount|promo|deal|offer|sale/i.test(keyword),
  );

  const categoryKeys = buildCategoryKeys(setup);
  const isFixedOrBoth = setup.locationMode === "fixed" || setup.locationMode === "both";
  const isDesiredOrBoth = setup.locationMode === "desired" || setup.locationMode === "both";

  const hasNoKmAllowanceDl =
    isDesiredOrBoth &&
    (setup.kilometerAllowance == null || Number(setup.kilometerAllowance) <= 0);

  const filterMeta = {
    categoryKeys,
    serviceFor: (setup.serviceFor ?? []).map((v) => String(v).toLowerCase()),
    lowestPrice,
    priceTier: resolvePriceTier({ lowestPrice }),
    hasDiscount,
    coversAllSelectedCategories,
    hasNoPrepayment: setup.prepaymentPercentage == null || setup.prepaymentPercentage === 0,
    hasNoMinTimeslotDl: isDesiredOrBoth
      ? !appointmentBefore?.hours && !appointmentBefore?.minutes
      : false,
    hasNoKmAllowanceDl,
    bookSameTimeFl: isFixedOrBoth && (setup.bookServiceCombinations?.length ?? 0) > 1,
  };

  return {
    id: String(setup.id),
    image,
    media,
    businessKeywords,
    title,
    subtitle,
    municipalityLabel,
    addressLabel: buildAddressLabel(setup),
    rating: setup.rating,
    reviewsCount: setup.totalReviews,
    locationModeDefault: resolveLocationModeDefault(setup.locationMode),
    businessOffering: resolveBusinessOffering(setup.locationMode),
    services,
    serviceCatalog,
    startingFromLabel: resolveStartingFromLabel(serviceCatalog, services),
    searchText,
    ...filterMeta,
  };
};

export const mapBusinessSetupsToListingCards = (setups: BusinessSetupListing[]): ListingCardData[] =>
  setups.map((setup, index) => mapBusinessSetupToListingCard(setup, index));
