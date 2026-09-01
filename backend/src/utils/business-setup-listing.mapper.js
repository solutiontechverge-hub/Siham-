import { buildDurationByServiceId } from "./business-service-categories.js";
import {
  entityIdKey,
  parseEntityIdArray,
  parseJsonArray,
  parseJsonValue,
  parseTextArray,
} from "./business-setup-parsers.js";

const LISTING_RATING = 0;
const LISTING_TOTAL_REVIEWS = 0;

const toNullableString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIsoTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const toTimeBlock = (hours, minutes) => ({
  hours: toNullableNumber(hours),
  minutes: toNullableNumber(minutes),
});

const mapTeamMember = (member, memberRatingStats = null) => {
  const rating =
    memberRatingStats && Number.isFinite(Number(memberRatingStats.rating))
      ? Number(memberRatingStats.rating)
      : LISTING_RATING;
  const totalReviews =
    memberRatingStats && Number.isFinite(Number(memberRatingStats.totalReviews))
      ? Number(memberRatingStats.totalReviews)
      : LISTING_TOTAL_REVIEWS;

  return {
    id: member.id ?? null,
    fullName: toNullableString(member.full_name),
    role: toNullableString(member.role) ?? "Team member",
    profilePhoto: toNullableString(member.profile_photo),
    assignedServices: parseJsonArray(member.assigned_services),
    displayOrder: toNullableNumber(member.display_order) ?? 1,
    rating,
    totalReviews,
    createdAt: toIsoTimestamp(member.created_at),
    updatedAt: toIsoTimestamp(member.updated_at),
  };
};

const mapServiceDetail = (detail, durationByServiceId = new Map()) => ({
  id: detail.id ?? null,
  serviceId: detail.service_id ?? null,
  price: toNullableNumber(detail.price),
  durationLabel:
    toNullableString(detail.duration_label) ||
    durationByServiceId.get(entityIdKey(detail.service_id) ?? "") ||
    null,
  serviceTitle: toNullableString(detail.service_title),
  categoryId: detail.category_id ?? null,
  categoryTitle: toNullableString(detail.category_title),
  isVisible: detail.is_visible === false || detail.isVisible === false ? false : true,
  createdAt: toIsoTimestamp(detail.created_at),
  discountType: toNullableString(detail.discount_type ?? detail.discountType),
  discountAmount: toNullableNumber(detail.discount_amount ?? detail.discountAmount),
  discountStartDate: toNullableString(detail.discount_start_date ?? detail.discountStartDate),
  discountEndDate: toNullableString(detail.discount_end_date ?? detail.discountEndDate),
  discountDescription: toNullableString(
    detail.discount_description ?? detail.discountDescription,
  ),
});

export const transformBusinessSetupForListing = (
  row,
  {
    teamMembers = [],
    serviceDetails = [],
    ratingStats = null,
    serviceOrder = null,
    teamMemberRatingStats = null,
    rankingStats = null,
  } = {},
) => {
  if (!row) {
    return null;
  }

  const normalizedTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
  const normalizedServiceDetails = Array.isArray(serviceDetails) ? serviceDetails : [];
  const durationByServiceId = buildDurationByServiceId(row.service_categories);
  const rating =
    ratingStats && Number.isFinite(Number(ratingStats.rating))
      ? Number(ratingStats.rating)
      : LISTING_RATING;
  const totalReviews =
    ratingStats && Number.isFinite(Number(ratingStats.totalReviews))
      ? Number(ratingStats.totalReviews)
      : LISTING_TOTAL_REVIEWS;
  const memberStatsMap =
    teamMemberRatingStats instanceof Map ? teamMemberRatingStats : null;

  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id ?? null,
    businessName: toNullableString(row.business_name),
    about: toNullableString(row.business_about),
    rating,
    totalReviews,
    rankingScore:
      rankingStats && Number.isFinite(Number(rankingStats.rankingScore))
        ? Number(rankingStats.rankingScore)
        : null,
    media: parseTextArray(row.business_media),
    locationMode: row.location_mode ?? null,
    salonName: toNullableString(row.salon_name),
    phone: toNullableString(row.professional_phone ?? row.phone),
    legalName: toNullableString(row.professional_legal_name),
    vatNumber: toNullableString(row.professional_vat_number),
    cocNumber: toNullableString(row.professional_coc_number),
    profileAddress: {
      street: toNullableString(row.professional_street),
      streetNumber: toNullableString(row.professional_street_number),
      postalCode: toNullableString(row.professional_postal_code),
      municipality: toNullableString(row.professional_municipality),
      province: toNullableString(row.professional_province),
    },
    fixedLocation: {
      address: toNullableString(row.fixed_location_address),
      streetNumber: toNullableString(row.fixed_location_street_number),
      postalCode: toNullableString(row.fixed_location_postal_code),
      province: toNullableString(row.fixed_location_province),
      municipality: toNullableString(row.fixed_location_municipality),
    },
    desiredLocation: {
      area: toNullableString(row.desired_location_area),
      province: toNullableString(row.desired_location_province),
      services: parseTextArray(row.desired_location_services),
    },
    serviceCategories: parseJsonArray(row.service_categories),
    serviceFor: parseTextArray(row.service_for),
    bookServiceCombinations: parseJsonArray(row.book_service_combinations),
    serviceDetails: normalizedServiceDetails.map((detail) => mapServiceDetail(detail, durationByServiceId)),
    serviceOrder: serviceOrder && typeof serviceOrder === "object" ? serviceOrder : null,
    priceRange: toNullableString(row.price_range),
    prepaymentPercentage: toNullableNumber(row.prepayment_percentage),
    prepaymentInstruction: toNullableString(row.prepayment_instruction),
    kilometerAllowance: toNullableNumber(row.kilometer_allowance),
    kilometerAllowanceInstruction: toNullableString(row.kilometer_allowance_instruction),
    responseTime: toTimeBlock(row.response_time_hours, row.response_time_minutes),
    appointmentBefore: toTimeBlock(
      row.appointment_before_hours,
      row.appointment_before_minutes,
    ),
    policyCustomInstruction: toNullableString(row.policy_custom_instruction),
    cancellationPolicy: {
      beforeHours: toNullableNumber(row.cancellation_before_hours),
      beforeMinutes: toNullableNumber(row.cancellation_before_minutes),
      feePercentage: toNullableNumber(row.late_cancellation_fee_percentage),
      instruction: toNullableString(row.cancellation_policy_instruction),
    },
    reschedulePolicy: {
      feePercentage: toNullableNumber(row.late_reschedule_fee_percentage),
      instruction: toNullableString(row.late_reschedule_policy_instruction),
    },
    noShowPolicy: {
      feePercentage: toNullableNumber(row.no_show_fee_percentage),
      instruction: toNullableString(row.no_show_fee_instruction),
    },
    keywords: parseTextArray(row.business_keywords),
    additionalNotes: toNullableString(row.additional_notes),
    notes: toNullableString(row.book_service_notes),
    project: toNullableString(row.project),
    teamMemberIds: parseEntityIdArray(row.team_member_ids),
    teamMembers: normalizedTeamMembers.map((member) =>
      mapTeamMember(
        member,
        member.id != null && memberStatsMap
          ? memberStatsMap.get(String(member.id)) ?? null
          : null,
      ),
    ),
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
};

export const groupRowsByBusinessSetupId = (rows, setupIdKey = "business_setup_id") => {
  return rows.reduce((acc, row) => {
    const setupId = row[setupIdKey];

    if (!setupId) {
      return acc;
    }

    if (!acc[setupId]) {
      acc[setupId] = [];
    }

    acc[setupId].push(row);
    return acc;
  }, {});
};

export const parseAggregatedJsonRows = (value) => {
  const parsed = parseJsonValue(value, []);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(Boolean);
};
