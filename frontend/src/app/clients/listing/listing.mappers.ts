import {
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
} from "../../../../images";
import type { BusinessSetupListing } from "../../../store/services/businessApi";
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
  const map = new Map<number, string>();

  for (const entry of setup.serviceCategories ?? []) {
    const serviceId = Number(entry.service_id ?? entry.serviceId);
    const label = String(entry.duration_label ?? entry.durationLabel ?? "").trim();
    if (Number.isInteger(serviceId) && serviceId > 0 && label) {
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
        (detail.serviceId != null ? durationByServiceId.get(Number(detail.serviceId)) : undefined) ||
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
  };
};

export const mapBusinessSetupsToListingCards = (setups: BusinessSetupListing[]): ListingCardData[] =>
  setups.map((setup, index) => mapBusinessSetupToListingCard(setup, index));
