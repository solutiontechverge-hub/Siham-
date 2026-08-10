import type { ListingFilterOption } from "../../../components/common";
import { clientHomeServiceCategories, netherlandsProvinces } from "../clients.data";
import type { ListingPriceTier } from "../../../components/common/listingDrawerFilters";
import {
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
} from "../../../../images";

export type ListingCardService = {
  name: string;
  durationLabel?: string;
  priceLabel: string;
};

export type ListingCardData = {
  id: string;
  image: any;
  /** All business media URLs from API (up to 4) */
  media: string[];
  /** business_keywords from API */
  businessKeywords: string[];
  title: string;
  subtitle: string;
  municipalityLabel: string;
  addressLabel: string;
  rating: number; // 0..5
  reviewsCount: number;
  locationModeDefault: "fixed" | "desired";
  /** Professional offering: Fixed Location, Desired Location, or Both */
  businessOffering: "fixed" | "desired" | "both";
  services: ListingCardService[];
  startingFromLabel: string;
  /** Used for client-side keyword filtering */
  searchText?: string;
  /** Lowercase category ids/slugs for hero category filter */
  categoryKeys?: string[];
  /** Drawer filter metadata */
  serviceFor?: string[];
  lowestPrice?: number;
  priceTier?: ListingPriceTier;
  hasDiscount?: boolean;
  coversAllSelectedCategories?: boolean;
  hasNoPrepayment?: boolean;
  hasNoMinTimeslotDl?: boolean;
  bookSameTimeFl?: boolean;
};

export const listingPageData = {
  header: {
    localeLabel: "EN",
    loginLabel: "Login",
    professionalLinkLabel: "For Professional",
  },
  filters: {
    categoryOptions: clientHomeServiceCategories.map((category) => ({
      label: category,
      value: category,
    })) satisfies ListingFilterOption[],
    municipalityOptions: netherlandsProvinces.map((province) => ({
      label: province,
      value: province,
    })) satisfies ListingFilterOption[],
  },
  toolbar: {
    filterLabel: "Filter",
    sortLabel: "Sort By",
    sortOptions: [
      { label: "Recommended", value: "recommended" },
      { label: "Alphabetical: A–Z", value: "alpha_asc" },
      { label: "Alphabetical: Z–A", value: "alpha_desc" },
      { label: "Highest Rated → Lowest Rated", value: "rating_desc" },
    ],
  },
  cards: [
    {
      id: "1",
      image: ListingImage1,
      media: [],
      businessKeywords: [],
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      addressLabel: "Marina-Park 50, Den Helder, Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
      businessOffering: "fixed",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
    {
      id: "2",
      image: ListingImage2,
      media: [],
      businessKeywords: [],
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      addressLabel: "Marina-Park 50, Den Helder, Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "desired",
      businessOffering: "desired",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
    {
      id: "3",
      image: ListingImage3,
      media: [],
      businessKeywords: [],
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      addressLabel: "Marina-Park 50, Den Helder, Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
      businessOffering: "both",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
    {
      id: "4",
      image: ListingImage4,
      media: [],
      businessKeywords: [],
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      addressLabel: "Marina-Park 50, Den Helder, Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
      businessOffering: "fixed",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
    {
      id: "5",
      image: ListingImage5,
      media: [],
      businessKeywords: [],
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      addressLabel: "Marina-Park 50, Den Helder, Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "desired",
      businessOffering: "both",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
    {
      id: "6",
      image: ListingImage6,
      media: [],
      businessKeywords: [],
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      addressLabel: "Marina-Park 50, Den Helder, Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
      businessOffering: "desired",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
  ] satisfies ListingCardData[],
} as const;

