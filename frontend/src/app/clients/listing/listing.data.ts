import type { ListingFilterOption } from "../../../components/common";
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
  title: string;
  subtitle: string;
  municipalityLabel: string;
  rating: number; // 0..5
  reviewsCount: number;
  locationModeDefault: "fixed" | "desired";
  services: ListingCardService[];
  startingFromLabel: string;
};

export const listingPageData = {
  header: {
    localeLabel: "EN",
    loginLabel: "Login",
    professionalLinkLabel: "for professional",
  },
  filters: {
    categoryOptions: [
      { label: "Hair Stylist", value: "hair_stylist" },
      { label: "Makeup Artist", value: "makeup_artist" },
      { label: "Barber", value: "barber" },
      { label: "Nail Technician", value: "nail_technician" },
      { label: "Skincare", value: "skincare" },
    ] satisfies ListingFilterOption[],
    municipalityOptions: [
      { label: "Noord-Holland", value: "noord_holland" },
      { label: "Amsterdam", value: "amsterdam" },
      { label: "Rotterdam", value: "rotterdam" },
      { label: "Utrecht", value: "utrecht" },
      { label: "Den Haag", value: "den_haag" },
    ] satisfies ListingFilterOption[],
  },
  toolbar: {
    filterLabel: "Filter",
    sortLabel: "Sort By",
    sortOptions: [
      { label: "Recommended", value: "recommended" },
      { label: "Rating", value: "rating" },
      { label: "Price (low to high)", value: "price_asc" },
      { label: "Price (high to low)", value: "price_desc" },
    ],
  },
  cards: [
    {
      id: "1",
      image: ListingImage1,
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
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
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "desired",
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
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
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
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
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
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "desired",
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
      title: "Lorem Ipsum Dolor Sit Amet",
      subtitle: "Consectetur.",
      municipalityLabel: "Noord-Holland",
      rating: 5,
      reviewsCount: 134,
      locationModeDefault: "fixed",
      services: [
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
        { name: "Service 1", durationLabel: "30-40 Min", priceLabel: "Starting From 23 EUR" },
      ],
      startingFromLabel: "Starting From 23 EUR",
    },
  ] satisfies ListingCardData[],
} as const;

