import type { ListingCardData } from "../app/clients/listing/listing.data";
import { listingPageData } from "../app/clients/listing/listing.data";
import { fixedLocationPageData } from "../app/professionals/fixed-location/fixedLocation.data";
import type { ServiceCategorySliderIconId } from "./businessServiceCategorySlider.data";
import { resolveServiceCategorySliderIconId } from "./businessServiceCategorySlider.data";

export type BusinessPublicProfileService = {
  id: string;
  categoryId: string;
  name: string;
  durationLabel: string;
  priceLabel: string;
  priceValue: number;
  durationMins: number;
};

export type BusinessPublicProfileCategory = {
  id: string;
  label: string;
  iconId: ServiceCategorySliderIconId;
};

export type BusinessPublicProfileTeamServiceSlot = {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue: string;
};

export type BusinessPublicProfileTeamMember = {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  avatarUrl?: string;
  locationModes: Array<"fixed" | "desired">;
  serviceSlots: BusinessPublicProfileTeamServiceSlot[];
  allCategoriesPlaceholder?: string;
};

export type BusinessPublicProfileServiceForItem = {
  id: "men" | "women" | "kids";
  label: string;
  enabled: boolean;
};

export type BusinessPublicProfileBookCombo = {
  id: string;
  categoryLabel: string;
  serviceLabel: string;
  durationLabel: string;
  priceLabel: string;
  priceValue: number;
  durationMins: number;
};

export type BusinessPublicProfilePolicySection = {
  title: string;
  fields?: Array<{ label: string; value: string }>;
  description?: string;
};

export type BusinessPublicProfileScheduleDay = {
  day: string;
  slots: string;
};

export type BusinessPublicProfileScheduleOption = {
  id: string;
  label: string;
};

export type BusinessPublicProfileFixedLocation = {
  salonName: string;
  streetAddress: string;
  streetNumber: string;
  postalCode: string;
  province: string;
  municipality: string;
  formattedAddress: string;
};

export type BusinessPublicProfileDesiredArea = {
  province: string;
  municipalities: string[];
  allMunicipalities?: boolean;
};

export type BusinessPublicProfileDesiredProvinceDisplay = {
  id: string;
  label: string;
};

export type BusinessPublicProfileDesiredLocation = {
  areaMode: "Specific areas only" | "All Netherlands";
  areas: BusinessPublicProfileDesiredArea[];
};

export type BusinessPublicProfileData = {
  shopId: string;
  shopName: string;
  heroImage: unknown;
  heroImages: unknown[];
  rating: number;
  reviewsCount: number;
  about: string;
  specialties: string[];
  nextScheduleLabel: string;
  weeklySchedule: BusinessPublicProfileScheduleDay[];
  scheduleOptions: BusinessPublicProfileScheduleOption[];
  defaultScheduleOptionId: string;
  fixedLocation: BusinessPublicProfileFixedLocation;
  desiredLocation: BusinessPublicProfileDesiredLocation;
  serviceFor: BusinessPublicProfileServiceForItem[];
  bookCombos: BusinessPublicProfileBookCombo[];
  bookComboInstructions: string;
  categories: BusinessPublicProfileCategory[];
  servicesFixed: BusinessPublicProfileService[];
  servicesDesired: BusinessPublicProfileService[];
  teamMembers: BusinessPublicProfileTeamMember[];
  projectEnabled: boolean;
  projectPlaceholder: string;
  projectInstructions: string;
  generalNoteLabel: string;
  generalNote: string;
  priceRangeLabel: string;
  priceDescription: string;
  prepaymentLabel: string;
  prepaymentInstructions: string;
  kilometerAllowanceLabel: string;
  kilometerAllowanceInstructions: string;
  policySections: BusinessPublicProfilePolicySection[];
  portfolioImages: unknown[];
  supportsFixedLocation: boolean;
  supportsDesiredLocation: boolean;
  businessOffering: ListingCardData["businessOffering"];
  locationModeDefault: "fixed" | "desired";
};

const defaultAbout =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const defaultSchedule: BusinessPublicProfileScheduleDay[] = [
  { day: "Monday", slots: "10:00 AM – 8:00 PM" },
  { day: "Tuesday", slots: "10:00 AM – 8:00 PM" },
  { day: "Wednesday", slots: "10:00 AM – 8:00 PM" },
  { day: "Thursday", slots: "10:00 AM – 8:00 PM" },
  { day: "Friday", slots: "12:45 PM – 4:30 PM" },
  { day: "Saturday", slots: "10:00 AM – 6:00 PM" },
  { day: "Sunday", slots: "Closed" },
];

function formatScheduleOptionLabel(day: string, slots: string) {
  const normalized = slots.replace(/\s*–\s*/g, " - ").trim();
  return `${day}(${normalized})`;
}

function buildScheduleOptions(weeklySchedule: BusinessPublicProfileScheduleDay[]): BusinessPublicProfileScheduleOption[] {
  const today: BusinessPublicProfileScheduleOption = {
    id: "today",
    label: "Today(8:00 - 18:00)",
  };
  const days = weeklySchedule
    .filter((row) => row.slots.toLowerCase() !== "closed")
    .map((row) => ({
      id: row.day.toLowerCase(),
      label: formatScheduleOptionLabel(row.day, row.slots),
    }));
  return [today, ...days];
}

function parsePriceValue(priceLabel: string) {
  const match = priceLabel.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function parseDurationMins(durationLabel: string) {
  const match = durationLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 45;
}

function mapCatalogServices() {
  return fixedLocationPageData.servicesDetails.items.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    durationLabel: item.durationLabel,
    priceLabel: item.priceLabel,
    priceValue: parsePriceValue(item.priceLabel),
    durationMins: parseDurationMins(item.durationLabel),
  }));
}

const defaultCategories: BusinessPublicProfileCategory[] = [
  { id: "all", label: "All", iconId: "all" },
  { id: "hair", label: "Hair", iconId: "hair" },
  { id: "makeup", label: "Make-up", iconId: "makeup" },
  { id: "waxing", label: "Waxing", iconId: "waxing" },
  { id: "nails", label: "Nails & Pedicure", iconId: "nails" },
  { id: "skin", label: "Skin", iconId: "facial" },
];

const catalogServices = mapCatalogServices();

const wimpersCategoryOptions = [
  { value: "wimpers-1", label: "Classic Lash" },
  { value: "wimpers-2", label: "Volume Lash" },
  { value: "wimpers-3", label: "Hybrid Lash" },
];

const defaultBookCombos: BusinessPublicProfileBookCombo[] = [
  {
    id: "bc-1",
    categoryLabel: "Hair",
    serviceLabel: "Buzz Cut",
    durationLabel: "45 Min",
    priceLabel: "25 €",
    priceValue: 25,
    durationMins: 45,
  },
  {
    id: "bc-2",
    categoryLabel: "Make-up",
    serviceLabel: "Make-up Basic",
    durationLabel: "60 Min",
    priceLabel: "80 €",
    priceValue: 80,
    durationMins: 60,
  },
];

const defaultTeam: BusinessPublicProfileTeamMember[] = [
  {
    id: "tm-1",
    name: "Craig Martha",
    rating: 5,
    reviewsCount: 134,
    locationModes: ["fixed", "desired"],
    serviceSlots: [
      {
        id: "slot-1",
        label: "Wimpers(8)",
        options: wimpersCategoryOptions,
        defaultValue: "wimpers-1",
      },
      {
        id: "slot-2",
        label: "Wimpers(8)",
        options: wimpersCategoryOptions,
        defaultValue: "wimpers-2",
      },
    ],
  },
  {
    id: "tm-2",
    name: "Ryan Harris",
    rating: 4.8,
    reviewsCount: 86,
    locationModes: ["fixed"],
    serviceSlots: [],
    allCategoriesPlaceholder: "All Categories and services",
  },
  {
    id: "tm-nina",
    name: "Nina Park",
    rating: 5,
    reviewsCount: 94,
    locationModes: ["desired"],
    serviceSlots: [
      {
        id: "slot-1",
        label: "Hair(4)",
        options: [
          { value: "hair-1", label: "Buzz Cut" },
          { value: "hair-2", label: "Trim" },
        ],
        defaultValue: "hair-1",
      },
    ],
  },
];

const defaultPolicySections: BusinessPublicProfilePolicySection[] = [
  {
    title: "Prepayment/Response Time",
    fields: [{ label: "Prepayment/Response Time", value: "1 hour" }],
    description:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
  },
  {
    title: "Reschedule",
    fields: [
      { label: "Mini: Time Before Appointment", value: "1 h" },
      { label: "Late Reschedule Fee", value: "10%" },
    ],
    description:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
  },
  {
    title: "Cancellation",
    fields: [
      { label: "Mini: Time Before Appointment", value: "1 h" },
      { label: "Late Cancellation Fee", value: "10%" },
    ],
    description:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
  },
  {
    title: "No show",
    fields: [{ label: "No show Fee", value: "10%" }],
    description:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
  },
];

const defaultDesiredAreas: BusinessPublicProfileDesiredArea[] = [
  { province: "Drenthe", municipalities: ["Assen", "Emmen", "Hoogeveen", "Meppel", "Coevorden"] },
  { province: "Zuid-Holland", municipalities: ["Rotterdam", "Den Haag"] },
  { province: "Groningen", municipalities: ["Groningen", "Veendam", "Stadskanaal", "Delfzijl", "Winschoten", "Haren", "Leek", "Appingedam"] },
  { province: "Zuid-Holland", municipalities: [], allMunicipalities: true },
  {
    province: "Nieuwkerken aan den IJssel",
    municipalities: Array.from({ length: 20 }, (_, i) => `Area ${i + 1}`),
  },
];

export function buildDesiredProvinceDisplays(
  desired: BusinessPublicProfileDesiredLocation,
): BusinessPublicProfileDesiredProvinceDisplay[] {
  if (desired.areaMode === "All Netherlands") {
    return [{ id: "all-nl", label: "All Netherlands" }];
  }

  return desired.areas.map((area, index) => {
    if (area.allMunicipalities) {
      return { id: `${area.province}-all-${index}`, label: `${area.province}(All)` };
    }
    if (area.municipalities.length === 1) {
      return { id: `${area.province}-${index}`, label: area.municipalities[0] };
    }
    return { id: `${area.province}-${index}`, label: `${area.province}(${area.municipalities.length})` };
  });
}

export function resolveBusinessOfferingFlags(offering: ListingCardData["businessOffering"]) {
  return {
    supportsFixedLocation: offering === "fixed" || offering === "both",
    supportsDesiredLocation: offering === "desired" || offering === "both",
  };
}

function buildFixedLocation(card: ListingCardData, shopName: string): BusinessPublicProfileFixedLocation {
  const municipality = card.municipalityLabel || "Amsterdam";
  const formattedAddress =
    card.addressLabel ||
    `Keizersgracht 241, 1016 EA ${municipality}, Noord-Holland, Netherlands`;
  return {
    salonName: shopName,
    streetAddress: "Keizersgracht",
    streetNumber: "241",
    postalCode: "1016 EA",
    province: "Noord-Holland",
    municipality,
    formattedAddress,
  };
}

export function mapListingCardToPublicProfile(card: ListingCardData): BusinessPublicProfileData {
  const shopName = `${card.title} ${card.subtitle}`.trim();
  const offeringFlags = resolveBusinessOfferingFlags(card.businessOffering);
  return {
    shopId: card.id,
    shopName,
    heroImage: card.image,
    heroImages: [card.image, card.image, card.image, card.image],
    rating: card.rating,
    reviewsCount: card.reviewsCount,
    about: defaultAbout,
    specialties: ["Hair Specialist", "Skin Specialist", "Eye Specialist"],
    nextScheduleLabel: "Friday 12:45 – 4:30 PM",
    weeklySchedule: defaultSchedule,
    scheduleOptions: buildScheduleOptions(defaultSchedule),
    defaultScheduleOptionId: "today",
    fixedLocation: buildFixedLocation(card, shopName),
    desiredLocation: {
      areaMode: "Specific areas only",
      areas: defaultDesiredAreas,
    },
    serviceFor: fixedLocationPageData.serviceFor.items.map((item) => ({
      id: item.id,
      label: item.label,
      enabled: true,
    })),
    bookCombos: defaultBookCombos,
    bookComboInstructions:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
    categories: defaultCategories,
    servicesFixed: catalogServices,
    servicesDesired: catalogServices.filter((s) => s.categoryId !== "wimpers"),
    teamMembers: defaultTeam,
    projectEnabled: true,
    projectPlaceholder: "Create this to provide premium salon booking services",
    projectInstructions: "Create this to provide premium salon booking services",
    generalNoteLabel: "Note",
    generalNote: "Spa and dye session",
    priceRangeLabel: "Low-High",
    priceDescription:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
    prepaymentLabel: "20%",
    prepaymentInstructions:
      "Rejuvenate your hair with our luxury spa treatment followed by a professional styling session.",
    kilometerAllowanceLabel: "10 EUR / km",
    kilometerAllowanceInstructions:
      "Travel costs apply for customer location appointments outside the listed service areas.",
    policySections: defaultPolicySections,
    portfolioImages: [card.image, card.image, card.image, card.image],
    supportsFixedLocation: offeringFlags.supportsFixedLocation,
    supportsDesiredLocation: offeringFlags.supportsDesiredLocation,
    businessOffering: card.businessOffering,
    locationModeDefault: card.locationModeDefault,
  };
}

export function getBusinessPublicProfileByShopId(shopId: string): BusinessPublicProfileData | null {
  const card = listingPageData.cards.find((c) => c.id === shopId);
  if (!card) return null;
  return mapListingCardToPublicProfile(card);
}

export function getServicesForLocationMode(
  data: BusinessPublicProfileData,
  locationMode: "fixed" | "desired",
): BusinessPublicProfileService[] {
  return locationMode === "desired" ? data.servicesDesired : data.servicesFixed;
}

export function getTeamForLocationMode(
  data: BusinessPublicProfileData,
  locationMode: "fixed" | "desired",
): BusinessPublicProfileTeamMember[] {
  return data.teamMembers.filter((member) => member.locationModes.includes(locationMode));
}

export function categoryIconIdForLabel(label: string): ServiceCategorySliderIconId {
  return resolveServiceCategorySliderIconId(label);
}
