import { mapBusinessPublicProfileFromSetups } from "../app/clients/listing/businessPublicProfile.mapper";
import type { ListingCardData } from "../app/clients/listing/listing.data";
import { listingPageData } from "../app/clients/listing/listing.data";
import type { BusinessSetupListing } from "../store/services/businessApi";
import { fixedLocationPageData } from "../app/professionals/fixed-location/fixedLocation.data";
import type { ServiceCategorySliderIconId } from "./businessServiceCategorySlider.data";
import { resolveServiceCategorySliderIconId } from "./businessServiceCategorySlider.data";
import { applyBusinessServiceDiscount } from "./businessServiceModal.data";

export type BusinessPublicProfileService = {
  id: string;
  categoryId: string;
  categoryTitle?: string;
  name: string;
  durationLabel: string;
  priceLabel: string;
  priceValue: number;
  durationMins: number;
  originalPriceValue?: number;
  originalPriceLabel?: string;
  discountPct?: number;
  discountType?: string;
  discountAmount?: number;
  discountStartDate?: string;
  discountEndDate?: string;
};

export function pricePublicProfileServiceOnDate(
  service: Pick<
    BusinessPublicProfileService,
    | "priceValue"
    | "originalPriceValue"
    | "discountType"
    | "discountAmount"
    | "discountStartDate"
    | "discountEndDate"
  >,
  onDateIso?: string,
): { price: number; originalPrice?: number; discountPct?: number } {
  const base =
    service.originalPriceValue && service.originalPriceValue > 0
      ? service.originalPriceValue
      : service.priceValue;
  const priced = applyBusinessServiceDiscount(
    base,
    {
      discountType: service.discountType,
      discountAmount: service.discountAmount,
      discountStartDate: service.discountStartDate,
      discountEndDate: service.discountEndDate,
    },
    onDateIso,
  );
  return {
    price: priced.amount,
    originalPrice: priced.active ? base : undefined,
    discountPct: priced.percentOff ?? undefined,
  };
}

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
  /** Second service UUID from book_service_combinations.service_id. */
  serviceId?: string | null;
  /** First service name (stored as category_title in API — always a service). */
  categoryLabel: string;
  /** Second service name. */
  serviceLabel: string;
  durationLabel: string;
  priceLabel: string;
  /** Always service1 price + service2 price. */
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
  province: string;
};

export type BusinessPublicProfileDesiredLocation = {
  areaMode: "Specific areas only" | "All Netherlands";
  areas: BusinessPublicProfileDesiredArea[];
};

export type BusinessPublicProfileData = {
  shopId: string;
  shopName: string;
  /** Professional contact number from their profile, when set. */
  phone?: string;
  vatNumber?: string;
  cocNumber?: string;
  legalName?: string;
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
  /** Cancellation fee % from professional business settings (`late_cancellation_fee_percentage`). */
  cancellationFeePercent: number;
  /** Minimum notice window from `cancellation_before_hours`. */
  cancellationNoticeHours: number;
  /** Minimum notice window from `cancellation_before_minutes`. */
  cancellationNoticeMinutes: number;
  cancellationPolicyInstruction: string;
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
        label: "Lashes(8)",
        options: wimpersCategoryOptions,
        defaultValue: "wimpers-1",
      },
      {
        id: "slot-2",
        label: "Lashes(8)",
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
    return [{ id: "all-nl", label: "All Netherlands", province: "All Netherlands" }];
  }

  return desired.areas.map((area, index) => {
    const municipalities = area.municipalities.filter(Boolean);
    if (area.allMunicipalities) {
      return {
        id: `${area.province}-all-${index}`,
        label: `${area.province}(All)`,
        province: area.province,
      };
    }
    const label =
      municipalities.length <= 1
        ? area.province
        : `${area.province}(${municipalities.length})`;
    return {
      id: `${area.province}-${index}`,
      label,
      province: area.province,
    };
  });
}

export function isAddressInOperatingArea(
  desired: BusinessPublicProfileDesiredLocation | null | undefined,
  province: string,
  municipality: string,
) {
  if (!desired || desired.areaMode === "All Netherlands" || desired.areas.length === 0) {
    return true;
  }
  const provinceKey = province.trim().toLowerCase();
  const municipalityKey = municipality.trim().toLowerCase();
  if (!provinceKey || !municipalityKey) return false;
  return desired.areas.some((area) => {
    if (area.province.trim().toLowerCase() !== provinceKey) return false;
    if (area.allMunicipalities || area.municipalities.length === 0) return true;
    return area.municipalities.some(
      (entry) => entry.trim().toLowerCase() === municipalityKey,
    );
  });
}

export function getDesiredMunicipalitiesForProvinceDisplay(
  desired: BusinessPublicProfileDesiredLocation,
  province: string,
): string[] {
  const area = desired.areas.find((entry) => entry.province === province);
  if (!area) return [];
  if (area.allMunicipalities) {
    return [`${province} (All municipalities)`];
  }
  return area.municipalities.filter(Boolean);
}

export function buildDesiredMunicipalityList(desired: BusinessPublicProfileDesiredLocation): string[] {
  if (desired.areaMode === "All Netherlands") {
    return ["All Netherlands"];
  }

  const municipalities: string[] = [];
  for (const area of desired.areas) {
    if (area.allMunicipalities) {
      municipalities.push(`${area.province} (All municipalities)`);
      continue;
    }
    for (const municipality of area.municipalities) {
      if (municipality.trim()) municipalities.push(municipality.trim());
    }
  }

  return municipalities;
}

/** Same municipality set used on professional Desired Location setup dropdowns. */
export const DESIRED_LOCATION_MUNICIPALITY_OPTIONS = [
  "Amsterdam",
  "Rotterdam",
  "Utrecht",
  "Haarlem",
  "Groningen",
  "Eindhoven",
] as const;

const ALL_NL_PROVINCES = [
  "Drenthe",
  "Flevoland",
  "Friesland",
  "Gelderland",
  "Groningen",
  "Limburg",
  "Noord-Brabant",
  "Noord-Holland",
  "Overijssel",
  "Utrecht",
  "Zeeland",
  "Zuid-Holland",
] as const;

const PROVINCE_MUNICIPALITIES: Record<string, readonly string[]> = {
  Drenthe: ["Assen", "Emmen", "Hoogeveen", "Meppel", "Coevorden"],
  "Zuid-Holland": ["Rotterdam", "Den Haag"],
  Groningen: [
    "Groningen",
    "Veendam",
    "Stadskanaal",
    "Delfzijl",
    "Winschoten",
    "Haren",
    "Leek",
    "Appingedam",
  ],
  "Noord-Holland": ["Amsterdam", "Haarlem"],
  Utrecht: ["Utrecht"],
  "Noord-Brabant": ["Eindhoven"],
};

function splitDesiredAreaCsv(value: string | null | undefined): string[] {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function municipalityBelongsToProvince(municipality: string, province: string): boolean {
  const normalizedMunicipality = municipality.trim().toLowerCase();
  const normalizedProvince = province.trim().toLowerCase();
  if (!normalizedMunicipality || !normalizedProvince) return false;
  if (normalizedMunicipality === normalizedProvince) return true;
  if (normalizedProvince.includes(normalizedMunicipality)) return true;
  if (normalizedMunicipality.includes(normalizedProvince)) return true;
  return (
    PROVINCE_MUNICIPALITIES[province]?.some(
      (entry) => entry.toLowerCase() === normalizedMunicipality,
    ) ?? false
  );
}

/**
 * Maps stored `desired_location_area` / `desired_location_province` CSV fields
 * into the structured desired-location areas the professional allowed.
 */
export function buildDesiredLocationFromSetupFields(
  area: string | null | undefined,
  province: string | null | undefined,
): BusinessPublicProfileDesiredLocation {
  const areaText = String(area ?? "").trim();
  const provinceText = String(province ?? "").trim();

  if (areaText === "All Netherlands" || provinceText === "All Netherlands") {
    return { areaMode: "All Netherlands", areas: [] };
  }

  const municipalities = splitDesiredAreaCsv(areaText);
  const provinces = splitDesiredAreaCsv(provinceText);

  if (!municipalities.length && !provinces.length) {
    return { areaMode: "Specific areas only", areas: [] };
  }

  if (provinces.length === 1) {
    return {
      areaMode: "Specific areas only",
      areas: [
        {
          province: provinces[0],
          municipalities,
          allMunicipalities: municipalities.length === 0,
        },
      ],
    };
  }

  if (provinces.length > 1) {
    if (!municipalities.length) {
      return {
        areaMode: "Specific areas only",
        areas: provinces.map((entry) => ({
          province: entry,
          municipalities: [],
          allMunicipalities: true,
        })),
      };
    }

    const areas = provinces.map((entry) => ({
      province: entry,
      municipalities: [] as string[],
      allMunicipalities: false,
    }));
    const unassigned: string[] = [];

    for (const municipality of municipalities) {
      const matchedArea = areas.find((entry) =>
        municipalityBelongsToProvince(municipality, entry.province),
      );
      if (matchedArea) matchedArea.municipalities.push(municipality);
      else unassigned.push(municipality);
    }

    if (unassigned.length > 0) {
      const customProvinces = provinces.filter(
        (entry) => !PROVINCE_MUNICIPALITIES[entry],
      );
      const fallbackProvince =
        customProvinces[0] ?? areas[areas.length - 1]?.province;

      for (const municipality of unassigned) {
        const namedArea = areas.find(
          (entry) =>
            municipalityBelongsToProvince(municipality, entry.province) ||
            municipality.toLowerCase().includes(entry.province.toLowerCase()) ||
            entry.province.toLowerCase().includes(municipality.toLowerCase()),
        );
        if (namedArea) {
          namedArea.municipalities.push(municipality);
          continue;
        }

        const fallbackArea = areas.find(
          (entry) => entry.province === fallbackProvince,
        );
        fallbackArea?.municipalities.push(municipality);
      }
    }

    return {
      areaMode: "Specific areas only",
      areas,
    };
  }

  return {
    areaMode: "Specific areas only",
    areas: [
      {
        province: "Service areas",
        municipalities,
      },
    ],
  };
}

/**
 * Province / municipality options for Desired Location visit address,
 * scoped to what the professional offers.
 */
export function resolveDesiredVisitAddressOptions(
  desired: BusinessPublicProfileDesiredLocation | null | undefined,
  selectedProvince: string,
) {
  const province = String(selectedProvince ?? "").trim();
  const fallbackMunicipalities = [...DESIRED_LOCATION_MUNICIPALITY_OPTIONS];
  const isAllNetherlands =
    !desired ||
    desired.areaMode === "All Netherlands" ||
    desired.areas.length === 0;

  if (isAllNetherlands) {
    return {
      provinceOptions: [...ALL_NL_PROVINCES],
      municipalityOptions: province ? fallbackMunicipalities : ([] as string[]),
    };
  }

  const provinceOptions = Array.from(
    new Set(
      desired.areas
        .map((area) => area.province.trim())
        .filter((entry) => entry && entry !== "Service areas"),
    ),
  );

  const matched = desired.areas.filter((area) => area.province === province);
  let municipalityOptions: string[] = [];
  if (province) {
    if (matched.some((area) => area.allMunicipalities)) {
      municipalityOptions = fallbackMunicipalities;
    } else {
      municipalityOptions = Array.from(
        new Set(matched.flatMap((area) => area.municipalities).filter(Boolean)),
      );
      if (!municipalityOptions.length) {
        municipalityOptions = Array.from(
          new Set(
            desired.areas.flatMap((area) => area.municipalities).filter(Boolean),
          ),
        );
      }
    }
  }

  return {
    provinceOptions: provinceOptions.length ? provinceOptions : [...ALL_NL_PROVINCES],
    municipalityOptions,
  };
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
    phone: undefined,
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
    cancellationFeePercent: 2,
    cancellationNoticeHours: 2,
    cancellationNoticeMinutes: 0,
    cancellationPolicyInstruction:
      "Cancellations may be subject to a fee of 2% of the service cost per the professional's policy.",
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

export function getBusinessPublicProfileByShopId(
  shopId: string,
  setups?: BusinessSetupListing[] | null,
): BusinessPublicProfileData | null {
  if (setups?.length) {
    return mapBusinessPublicProfileFromSetups(shopId, setups);
  }

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
