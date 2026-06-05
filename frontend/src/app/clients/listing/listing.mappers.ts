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
import { resolveBusinessOffering } from "./businessPublicProfile.mapper";
import type { ListingCardData } from "./listing.data";

const FALLBACK_IMAGES = [
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
];

const formatPriceLabel = (price: number) => `Starting From ${Math.round(price)} EUR`;

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
  return Number.isFinite(parsed) ? parsed : null;
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
    }
  }

  return map;
};

const buildServices = (setup: BusinessSetupListing) => {
  const durationByServiceId = buildDurationByServiceId(setup);

  const fromDetails = (setup.serviceDetails ?? [])
    .filter((detail) => detail.price != null && detail.serviceTitle)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 3)
    .map((detail) => ({
      name: detail.serviceTitle as string,
      durationLabel:
        (detail.serviceId != null ? durationByServiceId.get(String(detail.serviceId)) : undefined) ||
        detail.durationLabel?.trim() ||
        undefined,
      priceLabel: formatPriceLabel(Number(detail.price)),
    }));

  if (fromDetails.length > 0) {
    return fromDetails;
  }

  const fromCombinations = (setup.bookServiceCombinations ?? [])
    .filter((combo) => combo.serviceTitle)
    .slice(0, 3)
    .map((combo) => ({
      name: combo.serviceTitle as string,
      priceLabel: setup.priceRange ? `From ${setup.priceRange} EUR` : "Price on request",
    }));

  if (fromCombinations.length > 0) {
    return fromCombinations;
  }

  return [
    {
      name: "Services",
      priceLabel: setup.priceRange ? `From ${setup.priceRange} EUR` : "Price on request",
    },
  ];
};

const resolveStartingFromLabel = (setup: BusinessSetupListing, services: ListingCardData["services"]) => {
  const lowestDetailPrice = (setup.serviceDetails ?? [])
    .map((detail) => Number(detail.price))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b)[0];

  if (lowestDetailPrice != null) {
    return formatPriceLabel(lowestDetailPrice);
  }

  const rangeMin = parsePriceRangeMin(setup.priceRange);
  if (rangeMin != null) {
    return formatPriceLabel(rangeMin);
  }

  return services[0]?.priceLabel ?? "Price on request";
};

export const mapBusinessSetupToListingCard = (
  setup: BusinessSetupListing,
  index: number,
): ListingCardData => {
  const services = buildServices(setup);
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
    .filter(Boolean);

  const fallbackImage = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const image = media[0] ?? fallbackImage;

  const lowestDetailPrice = (setup.serviceDetails ?? [])
    .map((detail) => Number(detail.price))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b)[0];

  const rangeMin = parsePriceRangeMin(setup.priceRange);
  const lowestPrice = lowestDetailPrice ?? rangeMin ?? 0;

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
  const hasNoMinTimeslotDl =
    setup.locationMode === "desired" || setup.locationMode === "both"
      ? !appointmentBefore?.hours && !appointmentBefore?.minutes
      : undefined;

  const hasDiscount = businessKeywords.some((keyword) =>
    /discount|promo|deal|offer|sale/i.test(keyword),
  );

  const categoryKeys = buildCategoryKeys(setup);
  const isFixedOrBoth = setup.locationMode === "fixed" || setup.locationMode === "both";
  const isDesiredOrBoth = setup.locationMode === "desired" || setup.locationMode === "both";

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
    startingFromLabel: resolveStartingFromLabel(setup, services),
    searchText,
    ...filterMeta,
  };
};

export const mapBusinessSetupsToListingCards = (setups: BusinessSetupListing[]): ListingCardData[] =>
  setups.map((setup, index) => mapBusinessSetupToListingCard(setup, index));
