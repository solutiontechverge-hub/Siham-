import {
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
} from "../../../../images";
import type { ListingCardData } from "./listing.data";
import type {
  BusinessPublicProfileBookCombo,
  BusinessPublicProfileCategory,
  BusinessPublicProfileData,
  BusinessPublicProfileDesiredLocation,
  BusinessPublicProfileFixedLocation,
  BusinessPublicProfilePolicySection,
  BusinessPublicProfileScheduleDay,
  BusinessPublicProfileScheduleOption,
  BusinessPublicProfileService,
  BusinessPublicProfileServiceForItem,
  BusinessPublicProfileTeamMember,
} from "../../../data/businessPublicProfile.data";
import { buildDynamicServiceCategoryTabs } from "../../../data/businessServiceCategorySlider.data";
import { normalizeServiceDurationLabel } from "../../../utils/serviceDuration";
import type {
  BusinessSetupListing,
  BusinessSetupListingPolicy,
  BusinessSetupListingTimeBlock,
} from "../../../store/services/businessApi";

const FALLBACK_IMAGES = [
  ListingImage1,
  ListingImage2,
  ListingImage3,
  ListingImage4,
  ListingImage5,
  ListingImage6,
];

const DEFAULT_SCHEDULE: BusinessPublicProfileScheduleDay[] = [
  { day: "Monday", slots: "10:00 AM – 8:00 PM" },
  { day: "Tuesday", slots: "10:00 AM – 8:00 PM" },
  { day: "Wednesday", slots: "10:00 AM – 8:00 PM" },
  { day: "Thursday", slots: "10:00 AM – 8:00 PM" },
  { day: "Friday", slots: "12:45 PM – 4:30 PM" },
  { day: "Saturday", slots: "10:00 AM – 6:00 PM" },
  { day: "Sunday", slots: "Closed" },
];

const SERVICE_FOR_LABELS: Record<string, { id: BusinessPublicProfileServiceForItem["id"]; label: string }> = {
  men: { id: "men", label: "Men" },
  women: { id: "women", label: "Women" },
  kids: { id: "kids", label: "Kids" },
};

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

function parseDurationMins(durationLabel: string) {
  const match = durationLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 45;
}

function formatPriceLabel(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "—";
  return `${Math.round(price)} €`;
}

function formatTimeBlock(block: BusinessSetupListingTimeBlock | undefined | null) {
  if (!block) return "";
  const hours = block.hours ?? 0;
  const minutes = block.minutes ?? 0;
  if (hours <= 0 && minutes <= 0) return "";
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "";
  return `${value}%`;
}

function slugifyCategory(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "other";
}

export function resolveBusinessOffering(
  locationMode: BusinessSetupListing["locationMode"],
): ListingCardData["businessOffering"] {
  if (locationMode === "desired") return "desired";
  if (locationMode === "both") return "both";
  return "fixed";
}

function resolveLocationModeDefault(locationMode: BusinessSetupListing["locationMode"]): "fixed" | "desired" {
  if (locationMode === "desired") return "desired";
  return "fixed";
}

function teamLocationModes(locationMode: BusinessSetupListing["locationMode"]): Array<"fixed" | "desired"> {
  if (locationMode === "both") return ["fixed", "desired"];
  if (locationMode === "desired") return ["desired"];
  return ["fixed"];
}

function buildDurationByServiceId(setup: BusinessSetupListing) {
  const map = new Map<string, string>();
  for (const entry of setup.serviceCategories ?? []) {
    const serviceId = String(entry.service_id ?? entry.serviceId ?? "").trim();
    const label = String(entry.duration_label ?? entry.durationLabel ?? "").trim();
    if (serviceId && label) {
      map.set(serviceId, label);
    }
  }
  return map;
}

function buildFormattedAddress(setup: BusinessSetupListing) {
  const { fixedLocation, desiredLocation, locationMode } = setup;
  const fixedParts = [
    fixedLocation.streetNumber,
    fixedLocation.address,
    fixedLocation.postalCode,
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
}

function buildFixedLocation(setup: BusinessSetupListing, shopName: string): BusinessPublicProfileFixedLocation {
  const { fixedLocation, salonName } = setup;
  return {
    salonName: salonName || shopName,
    streetAddress: fixedLocation.address ?? "",
    streetNumber: fixedLocation.streetNumber ?? "",
    postalCode: fixedLocation.postalCode ?? "",
    province: fixedLocation.province ?? "",
    municipality: fixedLocation.municipality ?? "",
    formattedAddress: buildFormattedAddress(setup),
  };
}

function buildDesiredLocation(setup: BusinessSetupListing): BusinessPublicProfileDesiredLocation {
  const { desiredLocation } = setup;
  const services = (desiredLocation.services ?? []).filter(Boolean);
  const area = desiredLocation.area?.trim() ?? "";
  const province = desiredLocation.province?.trim() ?? "";

  if (!area && !province && services.length === 0) {
    return { areaMode: "Specific areas only", areas: [] };
  }

  const municipalities = services.length > 0 ? services : area ? [area] : [];
  const areas = province
    ? [{ province, municipalities }]
    : municipalities.length > 0
      ? [{ province: area || "Service areas", municipalities }]
      : [];

  return {
    areaMode: "Specific areas only",
    areas,
  };
}

function buildServicesFromTeamAssignments(setup: BusinessSetupListing): BusinessPublicProfileService[] {
  const seen = new Set<string>();
  const services: BusinessPublicProfileService[] = [];

  for (const member of setup.teamMembers ?? []) {
    for (const assigned of member.assignedServices ?? []) {
      const serviceId = String(assigned.service_id ?? assigned.serviceId ?? "").trim();
      if (!serviceId || seen.has(serviceId)) continue;
      seen.add(serviceId);

      const title = assigned.title?.trim() || "Service";
      services.push({
        id: serviceId,
        categoryId: "services",
        categoryTitle: title,
        name: title,
        durationLabel: "",
        priceLabel: formatPriceLabel(0),
        priceValue: 0,
        durationMins: 45,
      });
    }
  }

  return services;
}

function buildProfileServices(setup: BusinessSetupListing): BusinessPublicProfileService[] {
  const durationByServiceId = buildDurationByServiceId(setup);

  const fromDetails = (setup.serviceDetails ?? [])
    .filter((detail) => detail.serviceTitle && detail.price != null)
    .map((detail, index) => {
      const categoryTitle = detail.categoryTitle?.trim() || "Services";
      const categoryId = detail.categoryId != null ? String(detail.categoryId) : slugifyCategory(categoryTitle);
      const serviceIdKey = detail.serviceId != null ? String(detail.serviceId) : "";
      const rawDuration =
        (serviceIdKey ? durationByServiceId.get(serviceIdKey) : undefined) ||
        detail.durationLabel?.trim() ||
        "";
      const durationMins = parseDurationMins(rawDuration);
      const durationLabel = normalizeServiceDurationLabel(rawDuration, durationMins);
      const priceValue = Number(detail.price);

      return {
        id: detail.serviceId != null ? String(detail.serviceId) : detail.id != null ? String(detail.id) : `svc-${index}`,
        categoryId,
        categoryTitle,
        name: detail.serviceTitle as string,
        durationLabel,
        priceLabel: formatPriceLabel(priceValue),
        priceValue,
        durationMins,
      };
    });

  if (fromDetails.length > 0) {
    return fromDetails;
  }

  const fromCategories = (setup.serviceCategories ?? [])
    .map((entry, index): BusinessPublicProfileService | null => {
      const serviceId = String(entry.service_id ?? entry.serviceId ?? "").trim();
      const categoryId = String(entry.category_id ?? entry.categoryId ?? "").trim() || "services";
      const categoryTitle = String(
        (entry as { category_title?: string; categoryTitle?: string }).category_title ??
          (entry as { category_title?: string; categoryTitle?: string }).categoryTitle ??
          "",
      ).trim();
      const serviceTitle = String(
        (entry as { service_title?: string; serviceTitle?: string }).service_title ??
          (entry as { service_title?: string; serviceTitle?: string }).serviceTitle ??
          "",
      ).trim();
      const amount = Number(entry.amount);
      if (!serviceId || !Number.isFinite(amount)) {
        return null;
      }

      const rawDuration =
        durationByServiceId.get(serviceId) || String(entry.duration_label ?? entry.durationLabel ?? "").trim();
      const durationMins = parseDurationMins(rawDuration);
      const durationLabel = normalizeServiceDurationLabel(rawDuration, durationMins);
      return {
        id: serviceId || `svc-${index}`,
        categoryId,
        categoryTitle: categoryTitle || undefined,
        name: serviceTitle || "Service",
        durationLabel,
        priceLabel: formatPriceLabel(amount),
        priceValue: amount,
        durationMins,
      };
    })
    .filter((service): service is BusinessPublicProfileService => service !== null);

  if (fromCategories.length > 0) {
    return fromCategories;
  }

  return buildServicesFromTeamAssignments(setup);
}

function buildCategoriesFromDetails(setup: BusinessSetupListing, services: BusinessPublicProfileService[]) {
  const categoriesById = new Map<string, { id: string; title: string }>();

  const appendCategory = (categoryId: string, title: string) => {
    const trimmedTitle = title.trim();
    const id = categoryId || slugifyCategory(trimmedTitle);
    if (!trimmedTitle || !id || categoriesById.has(id)) return;
    categoriesById.set(id, { id, title: trimmedTitle });
  };

  for (const detail of setup.serviceDetails ?? []) {
    const title = detail.categoryTitle?.trim();
    if (!title) continue;
    appendCategory(detail.categoryId != null ? String(detail.categoryId) : slugifyCategory(title), title);
  }

  for (const entry of setup.serviceCategories ?? []) {
    const categoryId = String(entry.category_id ?? entry.categoryId ?? "").trim();
    const categoryTitle = String(
      (entry as { category_title?: string; categoryTitle?: string }).category_title ??
        (entry as { category_title?: string; categoryTitle?: string }).categoryTitle ??
        "",
    ).trim();
    if (categoryTitle) {
      appendCategory(categoryId, categoryTitle);
    }
  }

  for (const service of services) {
    const categoryId = String(service.categoryId ?? "").trim();
    const categoryTitle = service.categoryTitle?.trim() || categoryId;
    if (categoryId && categoryTitle) {
      appendCategory(categoryId, categoryTitle);
    }
  }

  const categories = Array.from(categoriesById.values());
  if (categories.length === 0) {
    return [{ id: "all", label: "All", iconId: "all" as const }];
  }

  return buildDynamicServiceCategoryTabs(categories);
}

function findServiceDetail(setup: BusinessSetupListing, serviceId: string | number | null | undefined) {
  if (serviceId == null || serviceId === "") return undefined;
  const key = String(serviceId);
  return setup.serviceDetails?.find(
    (d) => String(d.serviceId ?? "") === key || String(d.id ?? "") === key,
  );
}

function findServiceDetailByTitle(setup: BusinessSetupListing, title: string | null | undefined) {
  const needle = String(title ?? "").trim().toLowerCase();
  if (!needle) return undefined;
  return setup.serviceDetails?.find((d) => String(d.serviceTitle ?? "").trim().toLowerCase() === needle);
}

/** A combo is always two services — resolve price/duration by service id (title as fallback). */
function resolveComboServiceDetail(
  setup: BusinessSetupListing,
  serviceId: string | null | undefined,
  title: string | null | undefined,
) {
  return findServiceDetail(setup, serviceId) ?? findServiceDetailByTitle(setup, title);
}

/** Sum pricing must never fall back to business priceRange (e.g. "Medium - High"). */
function resolveComboServicePrice(
  setup: BusinessSetupListing,
  serviceId: string | null | undefined,
  title: string | null | undefined,
): number {
  const detail = resolveComboServiceDetail(setup, serviceId, title);
  if (detail?.price != null) {
    const price = Number(detail.price);
    if (Number.isFinite(price) && price > 0) return price;
  }

  const key = serviceId != null && serviceId !== "" ? String(serviceId) : "";
  const needle = String(title ?? "").trim().toLowerCase();

  for (const entry of setup.serviceCategories ?? []) {
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const entryServiceId = String(entry.service_id ?? entry.serviceId ?? "").trim();
    if (key && entryServiceId === key) return amount;

    const entryTitle = String(entry.service_title ?? entry.serviceTitle ?? "")
      .trim()
      .toLowerCase();
    if (needle && entryTitle === needle) return amount;
  }

  return 0;
}

function buildBookCombos(setup: BusinessSetupListing): BusinessPublicProfileBookCombo[] {
  const durationByServiceId = buildDurationByServiceId(setup);

  return (setup.bookServiceCombinations ?? [])
    .map((combo, index) => {
      // API fields: category_* = first service, service_* = second service (always a 2-service combo).
      const firstServiceId = String(combo.category_id ?? combo.categoryId ?? "").trim() || null;
      const secondServiceId = String(combo.service_id ?? combo.serviceId ?? "").trim() || null;
      const firstLabel = String(
        combo.categoryTitle ?? (combo as { category_title?: string }).category_title ?? "",
      ).trim();
      const secondLabel = String(
        combo.serviceTitle ?? (combo as { service_title?: string }).service_title ?? "",
      ).trim();

      if (!firstServiceId || !secondServiceId) return null;

      const firstDetail = resolveComboServiceDetail(setup, firstServiceId, firstLabel);
      const secondDetail = resolveComboServiceDetail(setup, secondServiceId, secondLabel);

      const priceValue =
        resolveComboServicePrice(setup, firstServiceId, firstLabel) +
        resolveComboServicePrice(setup, secondServiceId, secondLabel);

      const firstDurationRaw =
        (firstServiceId ? durationByServiceId.get(firstServiceId) : undefined) ||
        firstDetail?.durationLabel?.trim() ||
        "";
      const secondDurationRaw =
        (secondServiceId ? durationByServiceId.get(secondServiceId) : undefined) ||
        secondDetail?.durationLabel?.trim() ||
        "";
      const durationMins = parseDurationMins(firstDurationRaw) + parseDurationMins(secondDurationRaw);
      const durationLabel =
        durationMins > 0
          ? normalizeServiceDurationLabel(`${durationMins} mins`, durationMins)
          : normalizeServiceDurationLabel(
              secondDurationRaw || firstDurationRaw,
              parseDurationMins(secondDurationRaw || firstDurationRaw),
            );

      return {
        id: `bc-${setup.id}-${index}`,
        serviceId: secondServiceId,
        categoryLabel: firstLabel || firstDetail?.serviceTitle || "Service",
        serviceLabel: secondLabel || secondDetail?.serviceTitle || "Service",
        durationLabel: durationLabel || "—",
        priceLabel: formatPriceLabel(priceValue),
        priceValue,
        durationMins: durationMins > 0 ? durationMins : 45,
      };
    })
    .filter((combo): combo is NonNullable<typeof combo> => combo != null);
}

function buildServiceForItems(setup: BusinessSetupListing): BusinessPublicProfileServiceForItem[] {
  const ids = (setup.serviceFor ?? []).map((v) => String(v).toLowerCase());
  return (["men", "women", "kids"] as const).map((id) => ({
    id,
    label: SERVICE_FOR_LABELS[id].label,
    enabled: ids.includes(id),
  }));
}

function buildPolicySections(setup: BusinessSetupListing): BusinessPublicProfilePolicySection[] {
  const sections: BusinessPublicProfilePolicySection[] = [];

  const responseLabel = formatTimeBlock(setup.responseTime);
  if (responseLabel || setup.prepaymentPercentage != null || setup.policyCustomInstruction) {
    const fields: Array<{ label: string; value: string }> = [];
    if (responseLabel) fields.push({ label: "Response Time", value: responseLabel });
    if (setup.prepaymentPercentage != null) {
      fields.push({ label: "Prepayment", value: formatPercent(setup.prepaymentPercentage) });
    }
    sections.push({
      title: "Prepayment/Response Time",
      fields: fields.length ? fields : undefined,
      description: setup.policyCustomInstruction || setup.prepaymentInstruction || undefined,
    });
  }

  const rescheduleBefore = formatTimeBlock(setup.appointmentBefore);
  if (rescheduleBefore || setup.reschedulePolicy.feePercentage != null || setup.reschedulePolicy.instruction) {
    const feeLabel =
      setup.reschedulePolicy.feePercentage != null
        ? formatPercent(setup.reschedulePolicy.feePercentage)
        : "";
    sections.push({
      title: "Reschedule",
      fields: [
        ...(rescheduleBefore ? [{ label: "Min. Time Before Appointment", value: rescheduleBefore }] : []),
        ...(feeLabel ? [{ label: "Late Reschedule Fee", value: feeLabel }] : []),
      ],
      description:
        setup.reschedulePolicy.instruction ||
        (rescheduleBefore || feeLabel
          ? [
              rescheduleBefore ? `Please reschedule at least ${rescheduleBefore} before the appointment.` : "",
              feeLabel ? `Late reschedules may be subject to a fee of ${feeLabel}.` : "",
            ]
              .filter(Boolean)
              .join(" ")
          : undefined),
    });
  }

  const cancel = setup.cancellationPolicy;
  const cancelBefore =
    cancel.beforeHours != null || cancel.beforeMinutes != null
      ? formatTimeBlock({ hours: cancel.beforeHours, minutes: cancel.beforeMinutes })
      : "";
  if (cancelBefore || cancel.feePercentage != null || cancel.instruction) {
    const feeLabel = cancel.feePercentage != null ? formatPercent(cancel.feePercentage) : "";
    sections.push({
      title: "Cancellation",
      fields: [
        ...(cancelBefore ? [{ label: "Min. Time Before Appointment", value: cancelBefore }] : []),
        ...(feeLabel ? [{ label: "Late Cancellation Fee", value: feeLabel }] : []),
      ],
      description:
        cancel.instruction ||
        (cancelBefore && feeLabel
          ? `Cancellations made less than ${cancelBefore} before the scheduled appointment will be subject to a fee of ${feeLabel} of the service cost.`
          : cancelBefore
            ? `Cancellations made less than ${cancelBefore} before the scheduled appointment may be subject to a fee.`
            : feeLabel
              ? `Late cancellations will be subject to a fee of ${feeLabel} of the service cost.`
              : undefined),
    });
  }

  if (setup.noShowPolicy.feePercentage != null || setup.noShowPolicy.instruction) {
    const feeLabel =
      setup.noShowPolicy.feePercentage != null ? formatPercent(setup.noShowPolicy.feePercentage) : "";
    const fullAmount =
      setup.noShowPolicy.feePercentage != null && Number(setup.noShowPolicy.feePercentage) >= 100;
    sections.push({
      title: "No show",
      fields: feeLabel ? [{ label: "No show Fee", value: feeLabel }] : undefined,
      description:
        setup.noShowPolicy.instruction ||
        (fullAmount
          ? "No-shows will be charged the full service amount."
          : feeLabel
            ? `No-shows will be charged a fee of ${feeLabel} of the service cost.`
            : undefined),
    });
  }

  return sections;
}

function buildTeamMembers(setup: BusinessSetupListing, services: BusinessPublicProfileService[]): BusinessPublicProfileTeamMember[] {
  const modes = teamLocationModes(setup.locationMode);
  const serviceNameById = new Map<string, string>();
  for (const detail of setup.serviceDetails ?? []) {
    if (detail.serviceId != null && detail.serviceTitle) {
      serviceNameById.set(String(detail.serviceId), detail.serviceTitle);
    }
  }
  for (const service of services) {
    if (service.id && service.name) {
      serviceNameById.set(String(service.id), service.name);
    }
  }

  const members = (setup.teamMembers ?? []).filter((m) => m.fullName?.trim());
  if (members.length === 0) return [];

  return members.map((member, index) => {
    const assigned = member.assignedServices ?? [];
    const options = assigned
      .map((svc, svcIndex) => {
        const serviceId = String(svc.service_id ?? svc.serviceId ?? "");
        const label = svc.title?.trim() || serviceNameById.get(serviceId) || `Service ${serviceId}`;
        return {
          value: String(serviceId || svcIndex),
          label,
        };
      })
      .filter((opt) => opt.label);

    const serviceSlots =
      options.length > 0
        ? [
            {
              id: `slot-${member.id ?? index}`,
              label: `Services(${options.length})`,
              options,
              defaultValue: options[0]?.value ?? "",
            },
          ]
        : [];

    return {
      id: String(member.id ?? `tm-${index}`),
      name: member.fullName?.trim() || "Team member",
      rating: setup.rating,
      reviewsCount: setup.totalReviews,
      avatarUrl: member.profilePhoto?.trim() || undefined,
      locationModes: modes,
      serviceSlots,
      allCategoriesPlaceholder: options.length === 0 ? "All categories and services" : undefined,
    };
  });
}

function resolveHeroImages(setup: BusinessSetupListing) {
  const media = (setup.media ?? []).map((url) => url.trim()).filter(Boolean);
  if (media.length > 0) return media;
  const fallback = FALLBACK_IMAGES[Number(setup.id) % FALLBACK_IMAGES.length];
  return [fallback];
}

export function mapBusinessSetupToPublicProfile(setup: BusinessSetupListing): BusinessPublicProfileData {
  const businessOffering = resolveBusinessOffering(setup.locationMode);
  const offeringFlags = {
    supportsFixedLocation: businessOffering === "fixed" || businessOffering === "both",
    supportsDesiredLocation: businessOffering === "desired" || businessOffering === "both",
  };

  const shopName = (setup.businessName || setup.salonName || "Business").trim();
  const services = buildProfileServices(setup);
  const heroImages = resolveHeroImages(setup);
  const portfolioImages = heroImages;
  const weeklySchedule = DEFAULT_SCHEDULE;
  const keywords = setup.keywords ?? [];
  const projectText = setup.project?.trim() ?? "";

  return {
    shopId: String(setup.id),
    shopName,
    heroImage: heroImages[0],
    heroImages,
    rating: setup.rating,
    reviewsCount: setup.totalReviews,
    about: setup.about?.trim() || "",
    specialties: keywords.length > 0 ? keywords : [],
    nextScheduleLabel: weeklySchedule.find((d) => d.day === "Friday")?.slots ?? "See schedule",
    weeklySchedule,
    scheduleOptions: buildScheduleOptions(weeklySchedule),
    defaultScheduleOptionId: "today",
    fixedLocation: buildFixedLocation(setup, shopName),
    desiredLocation: buildDesiredLocation(setup),
    serviceFor: buildServiceForItems(setup),
    bookCombos: buildBookCombos(setup),
    bookComboInstructions: setup.notes?.trim() || "",
    categories: buildCategoriesFromDetails(setup, services),
    servicesFixed: services,
    servicesDesired: services,
    teamMembers: buildTeamMembers(setup, services),
    projectEnabled: Boolean(projectText),
    projectPlaceholder: projectText || "Project details",
    projectInstructions: projectText,
    generalNoteLabel: "Note",
    generalNote: setup.additionalNotes?.trim() || "",
    priceRangeLabel: setup.priceRange?.trim() || "",
    priceDescription: setup.notes?.trim() || setup.additionalNotes?.trim() || "",
    prepaymentLabel:
      setup.prepaymentPercentage != null ? formatPercent(setup.prepaymentPercentage) : "",
    prepaymentInstructions: setup.prepaymentInstruction?.trim() || "",
    cancellationFeePercent: Number(setup.cancellationPolicy?.feePercentage) || 0,
    cancellationPolicyInstruction: setup.cancellationPolicy?.instruction?.trim() || "",
    kilometerAllowanceLabel:
      setup.kilometerAllowance != null ? `${setup.kilometerAllowance} EUR / km` : "",
    kilometerAllowanceInstructions: setup.kilometerAllowanceInstruction?.trim() || "",
    policySections: buildPolicySections(setup),
    portfolioImages,
    supportsFixedLocation: offeringFlags.supportsFixedLocation,
    supportsDesiredLocation: offeringFlags.supportsDesiredLocation,
    businessOffering,
    locationModeDefault: resolveLocationModeDefault(setup.locationMode),
  };
}

export function findBusinessSetupByShopId(shopId: string, setups: BusinessSetupListing[] | null | undefined) {
  if (!shopId || !setups?.length) return null;
  return setups.find((setup) => String(setup.id) === shopId) ?? null;
}

export function mapBusinessPublicProfileFromSetups(
  shopId: string,
  setups: BusinessSetupListing[] | null | undefined,
): BusinessPublicProfileData | null {
  const setup = findBusinessSetupByShopId(shopId, setups);
  if (!setup) return null;
  return mapBusinessSetupToPublicProfile(setup);
}
