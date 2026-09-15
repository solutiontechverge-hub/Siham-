import { buildServiceDetailsFromCategories } from "./business-service-categories.js";
import {
  parseJsonArray,
  parseJsonValue,
  parseTextArray,
} from "./business-setup-parsers.js";

const DRAFT_SCALAR_FIELDS = [
  "location_mode",
  "business_name",
  "business_about",
  "salon_name",
  "fixed_location_address",
  "fixed_location_street_number",
  "fixed_location_postal_code",
  "fixed_location_province",
  "fixed_location_municipality",
  "project",
  "book_service_notes",
  "additional_notes",
  "price_range",
  "prepayment_percentage",
  "prepayment_instruction",
  "kilometer_allowance",
  "kilometer_allowance_instruction",
  "response_time_hours",
  "response_time_minutes",
  "policy_custom_instruction",
  "appointment_before_hours",
  "appointment_before_minutes",
  "late_reschedule_fee_percentage",
  "late_reschedule_policy_instruction",
  "cancellation_before_hours",
  "cancellation_before_minutes",
  "late_cancellation_fee_percentage",
  "cancellation_policy_instruction",
  "no_show_fee_percentage",
  "no_show_fee_instruction",
  "desired_location_area",
  "desired_location_province",
];

const DRAFT_TEXT_ARRAY_FIELDS = [
  "business_keywords",
  "business_media",
  "service_for",
  "desired_location_services",
];

export const isPublishSetupRequest = (body) =>
  body?.publish === true || body?.publish === "true";

export const isDraftSetupRequest = (body) =>
  body?.publish === false || body?.publish === "false";

export const firstNonEmptyArray = (...candidates) => {
  for (const value of candidates) {
    const parsed = parseJsonArray(value);
    if (parsed.length) return parsed;
  }
  return [];
};

const SECTION_FIELD_MAP = {
  profile: [
    "business_name",
    "business_about",
    "business_keywords",
    "project",
    "book_service_notes",
    "book_service_combinations",
  ],
  location: [
    "location_mode",
    "salon_name",
    "fixed_location_address",
    "fixed_location_street_number",
    "fixed_location_postal_code",
    "fixed_location_province",
    "fixed_location_municipality",
    "desired_location_area",
    "desired_location_province",
    "desired_location_services",
  ],
  serviceFor: ["service_for"],
  generalNotes: [
    "additional_notes",
    "price_range",
    "prepayment_percentage",
    "prepayment_instruction",
    "kilometer_allowance",
    "kilometer_allowance_instruction",
    "response_time_hours",
    "response_time_minutes",
    "policy_custom_instruction",
    "appointment_before_hours",
    "appointment_before_minutes",
    "late_reschedule_fee_percentage",
    "late_reschedule_policy_instruction",
    "cancellation_before_hours",
    "cancellation_before_minutes",
    "late_cancellation_fee_percentage",
    "cancellation_policy_instruction",
    "no_show_fee_percentage",
    "no_show_fee_instruction",
  ],
  portfolio: ["business_media"],
  services: ["service_categories"],
  team: ["team_members"],
};

const JSONB_DRAFT_FIELDS = new Set([
  "service_categories",
  "book_service_combinations",
  "section_sync_settings",
]);

const LIVE_COLUMN_FIELDS = [
  ...DRAFT_SCALAR_FIELDS,
  ...DRAFT_TEXT_ARRAY_FIELDS,
  "service_categories",
  "book_service_combinations",
  "section_sync_settings",
];

export const pickSectionDraft = (section, fullDraft) => {
  const keys = SECTION_FIELD_MAP[String(section || "").trim()];
  if (!keys || !fullDraft || typeof fullDraft !== "object") {
    return {};
  }

  const patch = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(fullDraft, key)) {
      patch[key] = fullDraft[key];
    }
  }
  return patch;
};

export const omitEmptyCollections = (fullDraft) => {
  if (!fullDraft || typeof fullDraft !== "object") return {};
  const next = { ...fullDraft };
  if (!parseJsonArray(next.service_categories).length) {
    delete next.service_categories;
  }
  if (!parseJsonArray(next.team_members).length) {
    delete next.team_members;
  }
  return next;
};

export const mergeUnpublishedDraft = (existingDraft, patch) => ({
  ...(existingDraft && typeof existingDraft === "object" && !Array.isArray(existingDraft)
    ? existingDraft
    : {}),
  ...(patch && typeof patch === "object" ? patch : {}),
});

export const getDraftLiveColumnUpdates = (draft) => {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return [];
  }

  return LIVE_COLUMN_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(draft, field),
  ).map((field) => ({
    field,
    value: JSONB_DRAFT_FIELDS.has(field)
      ? JSON.stringify(draft[field] ?? (field === "section_sync_settings" ? {} : []))
      : Array.isArray(draft[field])
        ? draft[field]
        : draft[field],
    jsonb: JSONB_DRAFT_FIELDS.has(field),
  }));
};

export const buildUnpublishedDraftPayload = ({
  payload,
  serviceCategories,
  bookServiceCombinations,
  sectionSyncSettings,
  teamMembers,
}) => ({
  location_mode: payload.location_mode,
  business_name: payload.business_name,
  business_about: payload.business_about,
  business_keywords: payload.business_keywords,
  business_media: payload.business_media,
  salon_name: payload.salon_name,
  fixed_location_address: payload.fixed_location_address,
  fixed_location_street_number: payload.fixed_location_street_number,
  fixed_location_postal_code: payload.fixed_location_postal_code,
  fixed_location_province: payload.fixed_location_province,
  fixed_location_municipality: payload.fixed_location_municipality,
  service_for: payload.service_for,
  service_categories: serviceCategories,
  project: payload.project,
  book_service_notes: payload.book_service_notes,
  book_service_combinations: bookServiceCombinations,
  additional_notes: payload.additional_notes,
  price_range: payload.price_range,
  prepayment_percentage: payload.prepayment_percentage,
  prepayment_instruction: payload.prepayment_instruction,
  kilometer_allowance: payload.kilometer_allowance,
  kilometer_allowance_instruction: payload.kilometer_allowance_instruction,
  response_time_hours: payload.response_time_hours,
  response_time_minutes: payload.response_time_minutes,
  policy_custom_instruction: payload.policy_custom_instruction,
  appointment_before_hours: payload.appointment_before_hours,
  appointment_before_minutes: payload.appointment_before_minutes,
  late_reschedule_fee_percentage: payload.late_reschedule_fee_percentage,
  late_reschedule_policy_instruction: payload.late_reschedule_policy_instruction,
  cancellation_before_hours: payload.cancellation_before_hours,
  cancellation_before_minutes: payload.cancellation_before_minutes,
  late_cancellation_fee_percentage: payload.late_cancellation_fee_percentage,
  cancellation_policy_instruction: payload.cancellation_policy_instruction,
  no_show_fee_percentage: payload.no_show_fee_percentage,
  no_show_fee_instruction: payload.no_show_fee_instruction,
  desired_location_area: payload.desired_location_area,
  desired_location_province: payload.desired_location_province,
  desired_location_services: payload.desired_location_services,
  section_sync_settings: sectionSyncSettings,
  team_members: teamMembers,
});

export const applyUnpublishedDraftToSetup = async (setup, queryFn) => {
  if (!setup) return setup;

  const { unpublished_draft: unpublishedDraft, ...setupWithoutDraft } = setup;
  const draft = parseJsonValue(unpublishedDraft, null);
  const hasUnpublished =
    setup.has_unpublished_changes === true &&
    draft &&
    typeof draft === "object" &&
    !Array.isArray(draft);

  if (!hasUnpublished) {
    return {
      ...setupWithoutDraft,
      has_unpublished_changes: false,
    };
  }

  const next = {
    ...setupWithoutDraft,
    has_unpublished_changes: true,
  };

  for (const field of DRAFT_SCALAR_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(draft, field)) {
      next[field] = draft[field];
    }
  }

  for (const field of DRAFT_TEXT_ARRAY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(draft, field)) {
      next[field] = parseTextArray(draft[field]);
    }
  }

  const draftServiceCategories = parseJsonArray(draft.service_categories);
  if (draftServiceCategories.length) {
    next.service_categories = draftServiceCategories;
  }
  if (Object.prototype.hasOwnProperty.call(draft, "book_service_combinations")) {
    next.book_service_combinations = parseJsonArray(draft.book_service_combinations);
  }
  if (Object.prototype.hasOwnProperty.call(draft, "section_sync_settings")) {
    next.section_sync_settings = parseJsonValue(draft.section_sync_settings, {});
  }
  if (Array.isArray(draft.team_members) && draft.team_members.length) {
    // Draft team payloads only carry public template fields (name/photo/services).
    // Merge onto persisted members so personal info + review stats aren't wiped.
    const existingById = new Map(
      (Array.isArray(setup.team_members) ? setup.team_members : []).map((member) => [
        String(member?.id ?? ""),
        member,
      ]),
    );
    next.team_members = draft.team_members.map((member) => {
      const { photo_upload_key: _photoUploadKey, ...rest } = member || {};
      const existing = existingById.get(String(rest.id ?? "")) || null;
      const definedDraft = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined),
      );
      return {
        ...(existing || {}),
        ...definedDraft,
        assigned_services: parseJsonArray(
          rest.assigned_services !== undefined
            ? rest.assigned_services
            : existing?.assigned_services,
        ),
        personal_documents: parseJsonArray(
          rest.personal_documents !== undefined
            ? rest.personal_documents
            : existing?.personal_documents,
        ),
        rating: rest.rating ?? existing?.rating ?? 0,
        total_reviews: rest.total_reviews ?? existing?.total_reviews ?? 0,
      };
    });
  }

  next.service_details = await buildServiceDetailsFromCategories(
    next.service_categories,
    setup.id,
    queryFn,
    {
      teamMembers: next.team_members || [],
      useTeamAssignmentsFallback: false,
    },
  );

  return next;
};
