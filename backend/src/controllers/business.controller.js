import { getClient, query } from "../db/index.js";
import {
  isS3UploadConfigured,
  uploadBusinessMediaFilesToS3,
  uploadTeamMemberPhotoFileToS3,
  uploadTeamMemberDocumentFileToS3,
} from "../services/s3-upload.service.js";
import {
  buildServiceDetailsFromCategories,
  normalizeServiceDiscountFields,
} from "../utils/business-service-categories.js";
import {
  applyUnpublishedDraftToSetup,
  buildUnpublishedDraftPayload,
  firstNonEmptyArray,
  getDraftLiveColumnUpdates,
  isDraftSetupRequest,
  isPublishSetupRequest,
  mergeUnpublishedDraft,
  omitEmptyCollections,
  pickSectionDraft,
} from "../utils/business-setup-draft.js";
import { syncBookingToFinanceTransaction } from "../services/finance-sync.service.js";
import {
  listBookingActivityEvents,
  logBookingCreatedActivity,
  logBookingStatusActivity,
} from "../services/bookingActivity.service.js";
import { getTeamMemberReviewAggregates } from "../services/review.service.js";
import { safeEnsureProfessionalClientFromBooking } from "../services/professional-clients.service.js";
import {
  BOOKING_NOTIFICATION_EVENTS,
  dispatchBookingCreatedNotifications,
  dispatchBookingEventNotification,
  dispatchBookingUpdatedNotifications,
} from "../services/bookingNotification.service.js";
import {
  extractCalendarClientEmail,
  notifyNonMollureCalendarClient,
} from "../services/bookingEmail.service.js";
import {
  emitBookingChanged,
  emitBusinessChanged,
  emitBusinessChangedForProfile,
} from "../messaging/messagingSocket.js";
import { normalizeEntityId } from "../utils/business-setup-parsers.js";
import { saveBookingAttachments } from "../services/booking-upload.service.js";
import {
  isValidUuid,
  parseOptionalUuid,
  parseUuid,
  parseUuidArray,
} from "../utils/uuid.js";
import {
  listResponse,
  parseListPagination,
  sqlLimitOffset,
  withPaginationParams,
} from "../utils/pagination.js";
import {
  buildApprovedEditRequest,
  buildPendingEditRequest,
  buildRejectedClear,
  isEditRequestPending,
  parseEditRequest,
} from "../helpers/bookingEditRequest.js";

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSavedServiceOrder = (saved) => ({
  categories: Array.isArray(saved.categories) ? saved.categories.map(String) : [],
  servicesByCategory:
    saved.servicesByCategory && typeof saved.servicesByCategory === "object"
      ? saved.servicesByCategory
      : {},
  hiddenCategories: Array.isArray(saved.hiddenCategories)
    ? saved.hiddenCategories.map(String)
    : [],
  hiddenServicesByCategory:
    saved.hiddenServicesByCategory &&
    typeof saved.hiddenServicesByCategory === "object"
      ? saved.hiddenServicesByCategory
      : {},
});

/**
 * Preserve a saved Service Order when present.
 * Do not invent the platform-8 category list — the client seeds defaults from the
 * Business Template (service_details) so Edit is always available from day one.
 */
const ensureAvailabilityServiceOrder = (availability) => {
  const base =
    availability && typeof availability === "object" && !Array.isArray(availability)
      ? { ...availability }
      : {};
  const saved = base.serviceOrder;
  const hasCategories =
    saved &&
    typeof saved === "object" &&
    Array.isArray(saved.categories) &&
    saved.categories.length > 0;

  if (hasCategories) {
    return {
      ...base,
      serviceOrder: normalizeSavedServiceOrder(saved),
    };
  }

  if (saved && typeof saved === "object") {
    return {
      ...base,
      serviceOrder: normalizeSavedServiceOrder(saved),
    };
  }

  const next = { ...base };
  delete next.serviceOrder;
  return next;
};

const parseTextArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const parsed = parseJsonValue(value, null);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseJsonArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const toIsoDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // DATE columns were parsed as local midnight by pg — use local Y-M-D, not UTC.
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const wallClock = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (wallClock) return wallClock[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const toTimeLabel = (value) => {
  if (!value) return null;
  const iso = value instanceof Date ? value.toISOString() : String(value);
  const wallClock = iso.match(/T(\d{2}:\d{2})/);
  if (wallClock) return wallClock[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(11, 16);
};

const normalizeBookingDateInput = (value) => {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

const calendarEntryDateSql = (alias) =>
  `substring(COALESCE(${alias}.start_time::text, ${alias}.blocked_time_start::text, ${alias}.start_date::text) from 1 for 10)::date`;

const calendarEntryInRangeSql = (alias, startParam, endParam) => `(
  ${calendarEntryDateSql(alias)} BETWEEN ${startParam}::date AND ${endParam}::date
  OR (
    ${alias}.start_date IS NOT NULL
    AND ${alias}.end_date IS NOT NULL
    AND ${alias}.start_date <= ${endParam}::date
    AND ${alias}.end_date >= ${startParam}::date
  )
)`;

const bookingDateSql = (alias) =>
  `substring(COALESCE(${alias}.booking_date::text, ${alias}.start_time::text) from 1 for 10)::date`;

const BOOKING_CODE_PREFIX = {
  online: "ol",
  offline: "of",
  blocked: "BLK",
};

const makeCalendarCode = (prefix = BOOKING_CODE_PREFIX.offline) =>
  `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 6)}`;

const codeStartsWithPrefix = (code, prefix) =>
  String(code ?? "")
    .toLowerCase()
    .startsWith(String(prefix ?? "").toLowerCase());

const calendarStatusSet = new Set([
  "requested",
  "br_accepted",
  "cancelled",
  "completed",
  "confirmed",
  "blocked",
  "in_progress",
  "no_show",
  "invalid",
]);
const bookingStatusSet = new Set([
  "requested",
  "br_accepted",
  "cancelled",
  "completed",
  "confirmed",
  "in_progress",
  "no_show",
  "invalid",
]);

const uniqueCodeExists = async (code) => {
  const existing = await query(
    `SELECT 1 WHERE EXISTS (SELECT 1 FROM bookings WHERE unique_code = $1)
        OR EXISTS (SELECT 1 FROM calendar_entries WHERE unique_code = $1)`,
    [code],
  );
  return existing.rows.length > 0;
};

const ensureUniqueBookingCode = async (preferredCode, prefix = BOOKING_CODE_PREFIX.online) => {
  const trimmed = String(preferredCode ?? "").trim();
  if (trimmed && codeStartsWithPrefix(trimmed, prefix)) {
    if (!(await uniqueCodeExists(trimmed))) {
      return trimmed;
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = makeCalendarCode(prefix);
    if (!(await uniqueCodeExists(candidate))) {
      return candidate;
    }
  }

  return makeCalendarCode(prefix);
};

const normalizeCalendarStatus = (value, fallback = "confirmed") => {
  const next = String(value ?? "").trim().toLowerCase();
  if (next === "canceled") return "cancelled";
  return calendarStatusSet.has(next) ? next : fallback;
};

const normalizeBookingStatus = (value, fallback = "requested") => {
  const next = String(value ?? "").trim().toLowerCase();
  if (next === "canceled") return "cancelled";
  return bookingStatusSet.has(next) ? next : fallback;
};

/** Online / request / project channels mint ol codes; only true offline uses of. */
const ONLINE_CHANNEL_BOOKING_TYPES = new Set(["online", "request", "project"]);
const OFFLINE_DISALLOWED_STATUSES = new Set(["requested", "invalid"]);

const normalizeCalendarBookingType = (value, status) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "online" || raw === "request" || raw === "project" || raw === "offline") {
    // Canonical: approval-required rows store as online (not legacy "request").
    if (raw === "request" || (raw === "offline" && String(status).toLowerCase() === "requested")) {
      return "online";
    }
    return raw;
  }
  if (String(status).toLowerCase() === "requested") return "online";
  return "offline";
};

const calendarCodePrefixFor = (status, bookingType) => {
  if (String(status).toLowerCase() === "blocked") return BOOKING_CODE_PREFIX.blocked;
  if (ONLINE_CHANNEL_BOOKING_TYPES.has(String(bookingType).toLowerCase())) {
    return BOOKING_CODE_PREFIX.online;
  }
  if (String(status).toLowerCase() === "requested") return BOOKING_CODE_PREFIX.online;
  return BOOKING_CODE_PREFIX.offline;
};

const fallbackUniqueCode = (booking) => {
  if (booking?.unique_code) return booking.unique_code;
  const prefix = calendarCodePrefixFor(booking?.status, booking?.booking_type);
  return `${prefix}${booking?.id ?? ""}`;
};

const isOfflineBookingType = (bookingType) =>
  String(bookingType ?? "").trim().toLowerCase() === "offline";

const assertOfflineAllowsStatus = (bookingType, status) => {
  if (!isOfflineBookingType(bookingType)) return null;
  const next = String(status ?? "").trim().toLowerCase();
  if (OFFLINE_DISALLOWED_STATUSES.has(next)) {
    return "Offline bookings cannot use Requested or Invalid status.";
  }
  return null;
};

const normalizeServiceCategories = (value) => {
  return parseJsonArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const categoryId = normalizeEntityId(item.category_id) ?? String(item.category_id ?? "").trim();
      const serviceId = normalizeEntityId(item.service_id) ?? String(item.service_id ?? "").trim();
      const amount = parseOptionalNumber(item.amount);
      const durationLabel = String(item.duration_label ?? item.duration ?? "").trim() || null;
      const categoryTitle = String(item.category_title ?? item.categoryTitle ?? "").trim() || null;
      const serviceTitle = String(item.service_title ?? item.serviceTitle ?? "").trim() || null;
      const parentServiceId =
        String(item.parent_service_id ?? item.parentServiceId ?? "").trim() || null;

      if (!categoryId || !serviceId || amount == null || amount <= 0) {
        return null;
      }

      return {
        category_id: categoryId,
        service_id: serviceId,
        category_title: categoryTitle,
        service_title: serviceTitle,
        amount,
        duration_label: durationLabel,
        parent_service_id: parentServiceId,
        is_visible: item.is_visible === false || item.isVisible === false ? false : true,
        ...normalizeServiceDiscountFields(item),
      };
    })
    .filter(Boolean);
};

const normalizeBookServiceCombinations = (value) => {
  return parseJsonArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const categoryId = parseUuid(item.category_id);
      const serviceId = parseUuid(item.service_id);

      if (!categoryId || !serviceId) {
        return null;
      }

      return {
        category_id: categoryId,
        category_title: item.category_title ? String(item.category_title).trim() : null,
        service_id: serviceId,
        service_title: item.service_title ? String(item.service_title).trim() : null,
      };
    })
    .filter(Boolean);
};

const normalizeTeamMembers = (value) => {
  return parseJsonArray(value)
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const fullName = String(item.full_name ?? item.name ?? "").trim();
      if (!fullName) {
        return null;
      }

      const id = parseUuid(item.id);
      const normalizedAssignedServices = parseJsonArray(item.assigned_services)
        .map((service) => {
          if (!service || typeof service !== "object") {
            return null;
          }

          const serviceId = parseUuid(service.service_id);
          if (!serviceId) {
            return null;
          }

          return {
            service_id: serviceId,
            title: service.title ? String(service.title).trim() : null,
          };
        })
        .filter(Boolean);

      const photoUploadKey = String(item.photo_upload_key ?? "").trim();

      return {
        id: id || null,
        photo_upload_key: photoUploadKey || null,
        full_name: fullName,
        role: String(item.role ?? "Team member").trim() || "Team member",
        profile_photo: item.profile_photo ? String(item.profile_photo).trim() : null,
        assigned_services: normalizedAssignedServices,
        display_order: parseOptionalInteger(item.display_order) ?? index + 1,
      };
    })
    .filter(Boolean);
};

const getProfessionalProfile = async (userId) => {
  const result = await query(
    `SELECT id, user_id
     FROM professional_profiles
     WHERE user_id = $1`,
    [userId],
  );

  return result.rows[0] || null;
};

const getBusinessSetupByUserId = async (userId, preferredLocationType = null) => {
  const result = await query(
    `SELECT bs.*
     FROM business_setups bs
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE pp.user_id = $1
     ORDER BY bs.updated_at DESC NULLS LAST, bs.created_at DESC NULLS LAST`,
    [userId],
  );

  const rows = result.rows || [];
  if (!rows.length) return null;
  if (!preferredLocationType) return rows[0];

  const preferred = String(preferredLocationType).toLowerCase();
  const modeMatch =
    preferred === "desired"
      ? rows.find((row) => String(row.location_mode || "").toLowerCase() === "desired")
      : preferred === "fixed"
        ? rows.find((row) => String(row.location_mode || "").toLowerCase() === "fixed")
        : null;
  return modeMatch || rows[0];
};

const getBusinessSetupDetailById = async (
  setupId,
  client = { query },
  options = {},
) => {
  const setupResult = await client.query(
    `SELECT
       bs.*,
       pp.phone AS professional_phone,
       pp.legal_name AS professional_legal_name,
       pp.vat_number AS professional_vat_number,
       pp.ccc_number AS professional_coc_number,
       pp.street AS professional_street,
       pp.street_number AS professional_street_number,
       pp.postal_code AS professional_postal_code,
       pp.municipality AS professional_municipality,
       pp.province AS professional_province
     FROM business_setups bs
     LEFT JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE bs.id = $1`,
    [setupId],
  );

  const businessSetup = setupResult.rows[0];

  if (!businessSetup) {
    return null;
  }

  const teamMembersResult = await client.query(
    `SELECT
       id,
       business_setup_id,
       full_name,
       role,
       profile_photo,
       assigned_services,
       display_order,
       first_name,
       last_name,
       contact_number,
       email,
       emergency_contact_name,
       emergency_contact_number,
       personal_note,
       personal_documents,
       created_at,
       updated_at
     FROM business_team_members
     WHERE business_setup_id = $1
     ORDER BY display_order ASC, id ASC`,
    [setupId],
  );

  const teamMembers = teamMembersResult.rows.map((member) => ({
    ...member,
    assigned_services: parseJsonArray(member.assigned_services),
    personal_documents: parseJsonArray(member.personal_documents),
  }));

  const teamMemberRatingStats = await getTeamMemberReviewAggregates(setupId);
  const teamMembersWithRatings = teamMembers.map((member) => {
    const stats = teamMemberRatingStats.get(String(member.id));
    return {
      ...member,
      rating: stats?.rating ?? 0,
      total_reviews: stats?.totalReviews ?? 0,
    };
  });

  const serviceCategories = parseJsonArray(businessSetup.service_categories);
  const serviceDetails = await buildServiceDetailsFromCategories(
    serviceCategories,
    setupId,
    client.query.bind(client),
    { teamMembers, useTeamAssignmentsFallback: false },
  );

  const detail = {
    ...businessSetup,
    service_categories: serviceCategories,
    book_service_combinations: parseJsonArray(businessSetup.book_service_combinations),
    section_sync_settings: parseJsonValue(businessSetup.section_sync_settings, {}),
    team_members: teamMembersWithRatings,
    service_details: serviceDetails,
  };

  if (options.includeDraft) {
    return applyUnpublishedDraftToSetup(detail, client.query.bind(client));
  }

  const { unpublished_draft: _unpublishedDraft, ...liveDetail } = detail;
  return {
    ...liveDetail,
    has_unpublished_changes: businessSetup.has_unpublished_changes === true,
  };
};

const getBusinessSetupDetailByUserId = async (
  userId,
  client = { query },
  options = {},
) => {
  const businessSetup = await getBusinessSetupByUserId(userId);

  if (!businessSetup) {
    return null;
  }

  return getBusinessSetupDetailById(businessSetup.id, client, options);
};

export const listCategories = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query);
    const { clause: limitClause } = sqlLimitOffset(1);

    const countResult = await query(`SELECT COUNT(*)::int AS total FROM categories`);
    const total = countResult.rows[0]?.total ?? 0;

    const result = await query(
      `SELECT
         c.id,
         c.title,
         c.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', s.id,
               'title', s.title,
               'category_id', s.category_id,
               'created_at', s.created_at
             )
             ORDER BY s.title
           ) FILTER (WHERE s.id IS NOT NULL),
           '[]'::json
         ) AS subcategories
       FROM categories c
       LEFT JOIN subcategories s ON s.category_id = c.id
       GROUP BY c.id
       ORDER BY c.title
       ${pagination.paginate ? limitClause : ""}`,
      withPaginationParams([], pagination),
    );

    return res.status(200).json(
      listResponse({
        message: "Categories fetched successfully.",
        data: result.rows,
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
      data: {
        error: error.message,
      },
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO categories (title)
       VALUES ($1)
       RETURNING *`,
      [req.body.title.trim()],
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    const message =
      error.code === "23505" ? "Category title already exists." : "Failed to create category.";

    return res.status(statusCode).json({
      success: false,
      message,
      data: {
        error: error.message,
      },
    });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO subcategories (category_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [req.body.category_id, req.body.title.trim()],
    );

    return res.status(201).json({
      success: true,
      message: "Subcategory created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    const message =
      error.code === "23505"
        ? "Subcategory title already exists for this category."
        : "Failed to create subcategory.";

    return res.status(statusCode).json({
      success: false,
      message,
      data: {
        error: error.message,
      },
    });
  }
};

export const getBusinessSetup = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can access business setup.",
        data: null,
      });
    }

    const liveOnly =
      req.query.include_draft === "0" ||
      req.query.include_draft === "false" ||
      req.query.live === "1" ||
      req.query.live === "true";
    const includeDraft = !liveOnly;
    const businessSetup = await getBusinessSetupDetailByUserId(
      req.user.id,
      { query },
      { includeDraft },
    );

    return res.status(200).json({
      success: true,
      message: "Business setup fetched successfully.",
      data: businessSetup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business setup.",
      data: {
        error: error.message,
      },
    });
  }
};

export const updateBusinessSetupActive = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can update business setup status.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const isActive = req.body.is_active === true;

    const existingSetup = await getBusinessSetupByUserId(req.user.id);

    if (!existingSetup) {
      const insertResult = await query(
        `INSERT INTO business_setups (professional_profile_id, location_mode, is_active)
         VALUES ($1, 'fixed', $2)
         RETURNING id`,
        [professionalProfile.id, isActive],
      );

      const savedBusinessSetup = await getBusinessSetupDetailById(insertResult.rows[0].id);
      emitBusinessChanged({
        business_setup_id: savedBusinessSetup?.id,
        action: isActive ? "activated" : "deactivated",
        scope: "listing",
      });

      return res.status(200).json({
        success: true,
        message: isActive ? "Business profile activated successfully." : "Business profile deactivated successfully.",
        data: savedBusinessSetup,
      });
    }

    await query(
      `UPDATE business_setups
       SET is_active = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [existingSetup.id, isActive],
    );

    const savedBusinessSetup = await getBusinessSetupDetailById(existingSetup.id);
    emitBusinessChanged({
      business_setup_id: savedBusinessSetup?.id ?? existingSetup.id,
      action: isActive ? "activated" : "deactivated",
      scope: "listing",
    });

    return res.status(200).json({
      success: true,
      message: isActive ? "Business profile activated successfully." : "Business profile deactivated successfully.",
      data: savedBusinessSetup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update business setup status.",
      data: {
        error: error.message,
      },
    });
  }
};

const isPersistedMediaUrl = (value) =>
  typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));

const TEAM_MEMBER_PHOTO_FIELD_PREFIX = "team_member_photo__";

const mapTeamMemberPhotoFiles = (files = []) => {
  const photoFilesByKey = new Map();

  for (const file of files) {
    if (!file?.fieldname?.startsWith(TEAM_MEMBER_PHOTO_FIELD_PREFIX)) {
      continue;
    }

    const key = file.fieldname.slice(TEAM_MEMBER_PHOTO_FIELD_PREFIX.length);
    if (key) {
      photoFilesByKey.set(key, file);
    }
  }

  return photoFilesByKey;
};

const applyTeamMemberPhotoUploads = async (teamMembers, files, userId) => {
  const photoFilesByKey = mapTeamMemberPhotoFiles(files);
  if (!photoFilesByKey.size) {
    return teamMembers;
  }

  if (!isS3UploadConfigured()) {
    throw new Error("File upload is temporarily unavailable.");
  }

  return Promise.all(
    teamMembers.map(async (member) => {
      const lookupKeys = [member.photo_upload_key, member.id].filter(Boolean).map(String);
      const file = lookupKeys.map((key) => photoFilesByKey.get(key)).find(Boolean);
      if (!file) {
        return member;
      }

      const profilePhoto = await uploadTeamMemberPhotoFileToS3(userId, file);
      return { ...member, profile_photo: profilePhoto };
    }),
  );
};

export const uploadBusinessMedia = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can upload business media.",
        data: null,
      });
    }

    const files = Array.isArray(req.files) ? req.files : [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No image files provided.",
        data: null,
      });
    }

    if (!isS3UploadConfigured()) {
      return res.status(503).json({
        success: false,
        message: "File upload is temporarily unavailable.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const existingSetup = await getBusinessSetupByUserId(req.user.id);
    const existingMedia = parseTextArray(existingSetup?.business_media).filter(isPersistedMediaUrl);

    if (existingMedia.length + files.length > 10) {
      return res.status(400).json({
        success: false,
        message: `You can upload at most 10 images (${existingMedia.length} already saved).`,
        data: null,
      });
    }

    const uploadedUrls = await uploadBusinessMediaFilesToS3(req.user.id, files);
    const nextMedia = [...existingMedia, ...uploadedUrls].slice(0, 10);

    let businessSetupId;

    if (existingSetup) {
      const result = await query(
        `UPDATE business_setups
         SET business_media = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [existingSetup.id, nextMedia],
      );
      businessSetupId = result.rows[0]?.id;
    } else {
      const result = await query(
        `INSERT INTO business_setups (professional_profile_id, location_mode, business_media)
         VALUES ($1, 'fixed', $2)
         RETURNING id`,
        [professionalProfile.id, nextMedia],
      );
      businessSetupId = result.rows[0]?.id;
    }

    if (!businessSetupId) {
      return res.status(500).json({
        success: false,
        message: "Failed to save business media.",
        data: null,
      });
    }

    emitBusinessChanged({
      business_setup_id: businessSetupId,
      action: "updated",
      scope: "listing",
    });

    return res.status(200).json({
      success: true,
      message: "Business media uploaded successfully.",
      data: {
        business_media: nextMedia,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload business media.",
      data: {
        error: error.message,
      },
    });
  }
};

export const upsertBusinessSetup = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can manage business setup.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const serviceCategories = normalizeServiceCategories(req.body.service_categories);
    const bookServiceCombinations = normalizeBookServiceCombinations(req.body.book_service_combinations);
    let teamMembers = normalizeTeamMembers(req.body.team_members);
    teamMembers = await applyTeamMemberPhotoUploads(teamMembers, req.files, req.user.id);
    teamMembers = teamMembers.map(({ photo_upload_key: _photoUploadKey, ...member }) => member);

    const existingSetup = await getBusinessSetupByUserId(req.user.id);
    const existingDraft = parseJsonValue(existingSetup?.unpublished_draft, {});
    const resolvedServiceCategories = firstNonEmptyArray(
      serviceCategories,
      existingDraft?.service_categories,
      existingSetup?.service_categories,
    );
    const resolvedTeamMembers = firstNonEmptyArray(
      teamMembers,
      existingDraft?.team_members,
    );

    const payload = {
      location_mode: req.body.location_mode,
      business_name: req.body.business_name ?? null,
      business_about: req.body.business_about ?? null,
      business_keywords: parseTextArray(req.body.business_keywords),
      business_media: parseTextArray(req.body.business_media),
      salon_name: req.body.salon_name ?? null,
      fixed_location_address: req.body.fixed_location_address ?? null,
      fixed_location_street_number: req.body.fixed_location_street_number ?? null,
      fixed_location_postal_code: req.body.fixed_location_postal_code ?? null,
      fixed_location_province: req.body.fixed_location_province ?? null,
      fixed_location_municipality: req.body.fixed_location_municipality ?? null,
      service_for: parseTextArray(req.body.service_for),
      service_categories: JSON.stringify(resolvedServiceCategories),
      project: req.body.project ?? null,
      book_service_notes: req.body.book_service_notes ?? null,
      book_service_combinations: JSON.stringify(bookServiceCombinations),
      team_member_ids: [],
      additional_notes: req.body.additional_notes ?? null,
      price_range: req.body.price_range ?? null,
      prepayment_percentage: parseOptionalNumber(req.body.prepayment_percentage),
      prepayment_instruction: req.body.prepayment_instruction ?? null,
      kilometer_allowance: parseOptionalNumber(req.body.kilometer_allowance),
      kilometer_allowance_instruction: req.body.kilometer_allowance_instruction ?? null,
      response_time_hours: parseOptionalInteger(req.body.response_time_hours),
      response_time_minutes: parseOptionalInteger(req.body.response_time_minutes),
      policy_custom_instruction: req.body.policy_custom_instruction ?? null,
      appointment_before_hours: parseOptionalInteger(req.body.appointment_before_hours),
      appointment_before_minutes: parseOptionalInteger(req.body.appointment_before_minutes),
      late_reschedule_fee_percentage: parseOptionalNumber(req.body.late_reschedule_fee_percentage),
      late_reschedule_policy_instruction: req.body.late_reschedule_policy_instruction ?? null,
      cancellation_before_hours: parseOptionalInteger(req.body.cancellation_before_hours),
      cancellation_before_minutes: parseOptionalInteger(req.body.cancellation_before_minutes),
      late_cancellation_fee_percentage: parseOptionalNumber(req.body.late_cancellation_fee_percentage),
      cancellation_policy_instruction: req.body.cancellation_policy_instruction ?? null,
      no_show_fee_percentage: parseOptionalNumber(req.body.no_show_fee_percentage),
      no_show_fee_instruction: req.body.no_show_fee_instruction ?? null,
      desired_location_area: req.body.desired_location_area ?? null,
      desired_location_province: req.body.desired_location_province ?? null,
      desired_location_services: parseTextArray(req.body.desired_location_services),
      section_sync_settings: JSON.stringify(
        parseJsonValue(req.body.section_sync_settings, {}),
      ),
    };

    if (isDraftSetupRequest(req.body)) {
      const fullDraft = buildUnpublishedDraftPayload({
        payload,
        serviceCategories,
        bookServiceCombinations,
        sectionSyncSettings: parseJsonValue(req.body.section_sync_settings, {}),
        teamMembers,
      });
      const section = String(req.body.section ?? "").trim();
      const patch = section
        ? pickSectionDraft(section, fullDraft)
        : omitEmptyCollections(fullDraft);
      const mergedDraft = mergeUnpublishedDraft(existingDraft, patch);

      const draftResult = await query(
        `INSERT INTO business_setups (
           professional_profile_id,
           location_mode,
           unpublished_draft,
           has_unpublished_changes,
           is_active
         )
         VALUES ($1, $2, $3::jsonb, true, false)
         ON CONFLICT (professional_profile_id)
         DO UPDATE SET
           unpublished_draft = EXCLUDED.unpublished_draft,
           has_unpublished_changes = true,
           updated_at = NOW()
         RETURNING id`,
        [
          professionalProfile.id,
          payload.location_mode || "fixed",
          JSON.stringify(mergedDraft),
        ],
      );

      const savedBusinessSetup = await getBusinessSetupDetailById(
        draftResult.rows[0].id,
        { query },
        { includeDraft: true },
      );

      return res.status(200).json({
        success: true,
        message: "Business setup saved. Publish to make changes live.",
        data: savedBusinessSetup,
      });
    }

    if (isPublishSetupRequest(req.body)) {
      const incomingDraft = buildUnpublishedDraftPayload({
        payload,
        serviceCategories,
        bookServiceCombinations,
        sectionSyncSettings: parseJsonValue(req.body.section_sync_settings, {}),
        teamMembers,
      });
      const section = String(req.body.section ?? "").trim();
      const publishDraft = section
        ? mergeUnpublishedDraft(existingDraft, pickSectionDraft(section, incomingDraft))
        : existingDraft && typeof existingDraft === "object"
          ? existingDraft
          : {};

      const client = await getClient();
      try {
        await client.query("BEGIN");

        let setupId = existingSetup?.id;
        if (!setupId) {
          const inserted = await client.query(
            `INSERT INTO business_setups (professional_profile_id, location_mode, is_active)
             VALUES ($1, $2, true)
             RETURNING id`,
            [professionalProfile.id, payload.location_mode || "fixed"],
          );
          setupId = inserted.rows[0].id;
        }

        const columnUpdates = getDraftLiveColumnUpdates(publishDraft);
        if (columnUpdates.length) {
          const assignments = columnUpdates
            .map((col, index) => `${col.field} = $${index + 2}${col.jsonb ? "::jsonb" : ""}`)
            .concat(
              "unpublished_draft = NULL",
              "has_unpublished_changes = false",
              "updated_at = NOW()",
            )
            .join(", ");
          await client.query(
            `UPDATE business_setups SET ${assignments} WHERE id = $1`,
            [setupId, ...columnUpdates.map((col) => col.value)],
          );
        } else {
          await client.query(
            `UPDATE business_setups
             SET unpublished_draft = NULL,
                 has_unpublished_changes = false,
                 updated_at = NOW()
             WHERE id = $1`,
            [setupId],
          );
        }

        if (Object.prototype.hasOwnProperty.call(publishDraft, "team_members")) {
          const draftTeamMembers = parseJsonArray(publishDraft.team_members);
          const syncedTeamMemberIds = [];
          const existingMembersResult = await client.query(
            `SELECT id FROM business_team_members WHERE business_setup_id = $1`,
            [setupId],
          );
          const existingMemberIds = new Set(
            existingMembersResult.rows.map((row) => row.id),
          );

          for (const member of draftTeamMembers) {
            if (member.id && existingMemberIds.has(member.id)) {
              const updatedMemberResult = await client.query(
                `UPDATE business_team_members
                 SET
                   full_name = $2,
                   role = $3,
                   profile_photo = $4,
                   assigned_services = $5::jsonb,
                   display_order = $6,
                   updated_at = NOW()
                 WHERE id = $1
                 RETURNING id`,
                [
                  member.id,
                  member.full_name,
                  member.role,
                  member.profile_photo,
                  JSON.stringify(member.assigned_services ?? []),
                  member.display_order,
                ],
              );
              if (updatedMemberResult.rows[0]?.id) {
                syncedTeamMemberIds.push(updatedMemberResult.rows[0].id);
              }
            } else {
              const insertedMemberResult = await client.query(
                `INSERT INTO business_team_members (
                   business_setup_id, full_name, role, profile_photo, assigned_services, display_order
                 )
                 VALUES ($1, $2, $3, $4, $5::jsonb, $6)
                 RETURNING id`,
                [
                  setupId,
                  member.full_name,
                  member.role,
                  member.profile_photo,
                  JSON.stringify(member.assigned_services ?? []),
                  member.display_order,
                ],
              );
              if (insertedMemberResult.rows[0]?.id) {
                syncedTeamMemberIds.push(insertedMemberResult.rows[0].id);
              }
            }
          }

          await client.query(
            `DELETE FROM business_team_members
             WHERE business_setup_id = $1
               AND NOT (id = ANY($2::uuid[]))`,
            [setupId, syncedTeamMemberIds],
          );
          await client.query(
            `UPDATE business_setups
             SET team_member_ids = $2::uuid[], updated_at = NOW()
             WHERE id = $1`,
            [setupId, syncedTeamMemberIds],
          );
        }

        await client.query("COMMIT");

        const savedBusinessSetup = await getBusinessSetupDetailById(setupId);
        emitBusinessChanged({
          business_setup_id: setupId,
          action: "published",
          scope: "listing",
        });

        return res.status(200).json({
          success: true,
          message: "Business setup published successfully.",
          data: savedBusinessSetup,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    const jsonbFields = new Set([
      "service_categories",
      "book_service_combinations",
      "section_sync_settings",
    ]);

    const fields = Object.keys(payload);
    const values = [professionalProfile.id, ...fields.map((field) => payload[field])];
    const updateAssignments = fields
      .map((field, index) => {
        const castType = jsonbFields.has(field) ? "::jsonb" : "";
        return `${field} = $${index + 2}${castType}`;
      })
      .concat("updated_at = NOW()")
      .join(", ");

    const client = await getClient();

    try {
      await client.query("BEGIN");

      const insertValues = fields
        .map((field, index) => {
          const castType = jsonbFields.has(field) ? "::jsonb" : "";
          return `$${index + 2}${castType}`;
        })
        .join(", ");

      const result = await client.query(
        `INSERT INTO business_setups (
           professional_profile_id,
           ${fields.join(", ")}
         )
         VALUES (
           $1,
           ${insertValues}
         )
         ON CONFLICT (professional_profile_id)
         DO UPDATE SET
           ${updateAssignments}
         RETURNING *`,
        values,
      );

      const businessSetup = result.rows[0];

      const syncedTeamMemberIds = [];
      const membersToSync = teamMembers.length > 0 ? teamMembers : resolvedTeamMembers;

      if (membersToSync.length > 0) {
        const existingMembersResult = await client.query(
          `SELECT id
           FROM business_team_members
           WHERE business_setup_id = $1`,
          [businessSetup.id],
        );

        const existingMemberIds = new Set(existingMembersResult.rows.map((row) => row.id));

        for (const member of membersToSync) {
          if (member.id && existingMemberIds.has(member.id)) {
            const updatedMemberResult = await client.query(
              `UPDATE business_team_members
               SET
                 full_name = $2,
                 role = $3,
                 profile_photo = $4,
                 assigned_services = $5::jsonb,
                 display_order = $6,
                 updated_at = NOW()
               WHERE id = $1
               RETURNING id`,
              [
                member.id,
                member.full_name,
                member.role,
                member.profile_photo,
                JSON.stringify(member.assigned_services),
                member.display_order,
              ],
            );

            if (updatedMemberResult.rows[0]?.id) {
              syncedTeamMemberIds.push(updatedMemberResult.rows[0].id);
            }
          } else {
            const insertedMemberResult = await client.query(
              `INSERT INTO business_team_members (
                 business_setup_id,
                 full_name,
                 role,
                 profile_photo,
                 assigned_services,
                 display_order
               )
               VALUES ($1, $2, $3, $4, $5::jsonb, $6)
               RETURNING id`,
              [
                businessSetup.id,
                member.full_name,
                member.role,
                member.profile_photo,
                JSON.stringify(member.assigned_services),
                member.display_order,
              ],
            );

            if (insertedMemberResult.rows[0]?.id) {
              syncedTeamMemberIds.push(insertedMemberResult.rows[0].id);
            }
          }
        }

        await client.query(
          `DELETE FROM business_team_members
           WHERE business_setup_id = $1
             AND NOT (id = ANY($2::uuid[]))`,
          [businessSetup.id, syncedTeamMemberIds],
        );
      } else {
        const existingMembersResult = await client.query(
          `SELECT id
           FROM business_team_members
           WHERE business_setup_id = $1
           ORDER BY display_order ASC, id ASC`,
          [businessSetup.id],
        );
        syncedTeamMemberIds.push(
          ...existingMembersResult.rows.map((row) => row.id).filter(Boolean),
        );
      }
      await client.query(
        `UPDATE business_setups
         SET
           team_member_ids = $2::uuid[],
           updated_at = NOW()
         WHERE id = $1`,
        [businessSetup.id, syncedTeamMemberIds],
      );

      if (isPublishSetupRequest(req.body)) {
        await client.query(
          `UPDATE business_setups
           SET unpublished_draft = NULL,
               has_unpublished_changes = false,
               updated_at = NOW()
           WHERE id = $1`,
          [businessSetup.id],
        );
      }

      const savedBusinessSetup = await getBusinessSetupDetailById(
        businessSetup.id,
        client,
      );

      await client.query("COMMIT");

      emitBusinessChanged({
        business_setup_id: businessSetup.id,
        action: isPublishSetupRequest(req.body) ? "published" : "updated",
        scope: "listing",
      });

      return res.status(200).json({
        success: true,
        message: isPublishSetupRequest(req.body)
          ? "Business setup published successfully."
          : "Business setup saved successfully.",
        data: savedBusinessSetup,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save business setup.",
      data: {
        error: error.message,
      },
    });
  }
};

export const listCalendarEntries = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can access calendar entries.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const pagination = parseListPagination(req.query);
    const { clause: limitClause } = sqlLimitOffset(2);

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM calendar_entries
       WHERE professional_profile_id = $1`,
      [professionalProfile.id],
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await query(
      `SELECT
         id,
         professional_profile_id,
         team_member_id,
         status,
         title,
         unique_code,
         start_time,
         end_time,
         start_date,
         end_date,
         blocked_time_start,
         blocked_time_end,
         location_type,
         booking_type,
         client_name,
         notes,
         service_ids,
         created_at,
         updated_at
       FROM calendar_entries
       WHERE professional_profile_id = $1
       ORDER BY created_at DESC
       ${pagination.paginate ? limitClause : ""}`,
      withPaginationParams([professionalProfile.id], pagination),
    );

    return res.status(200).json(
      listResponse({
        message: "Calendar entries fetched successfully.",
        data: result.rows,
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar entries.",
      data: {
        error: error.message,
      },
    });
  }
};

export const createCalendarEntry = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can create calendar entries.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const normalizedStatus = normalizeCalendarStatus(req.body.status, "confirmed");
    const normalizedBookingType = normalizeCalendarBookingType(
      req.body.booking_type,
      normalizedStatus,
    );
    const offlineStatusError = assertOfflineAllowsStatus(normalizedBookingType, normalizedStatus);
    if (offlineStatusError) {
      return res.status(400).json({
        success: false,
        message: offlineStatusError,
        data: null,
      });
    }
    const codePrefix = calendarCodePrefixFor(normalizedStatus, normalizedBookingType);

    const result = await query(
      `INSERT INTO calendar_entries (
         professional_profile_id,
         team_member_id,
         status,
         title,
         unique_code,
         start_time,
         end_time,
         start_date,
         end_date,
         blocked_time_start,
         blocked_time_end,
         location_type,
         booking_type,
         client_name,
         notes,
         service_ids
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        professionalProfile.id,
        parseOptionalUuid(req.body.team_member_id),
        normalizedStatus,
        req.body.title || (normalizedStatus === "blocked" ? "Blocked time" : "Offline booking"),
        await ensureUniqueBookingCode(req.body.unique_code, codePrefix),
        req.body.start_time ?? null,
        req.body.end_time ?? null,
        req.body.start_date ?? null,
        req.body.end_date ?? null,
        req.body.blocked_time_start ?? null,
        req.body.blocked_time_end ?? null,
        req.body.location_type ?? null,
        normalizedBookingType,
        req.body.client_name ?? null,
        req.body.notes ?? null,
        parseUuidArray(req.body.service_ids),
      ],
    );

    const entry = result.rows[0];
    if (entry && normalizedStatus === "requested") {
      try {
        await mirrorCalendarRequestToBooking({
          entry,
          professionalUserId: req.user.id,
        });
      } catch {
        // Client list mirror is best-effort; calendar entry still succeeds.
      }
    } else if (entry && normalizedStatus !== "blocked") {
      void notifyNonMollureCalendarClient(entry, { kind: "created" }).catch((error) => {
        console.error("[booking-email] calendar create notify failed:", error.message || error);
      });
    }

    // Offline / confirmed calendar bookings: register Activity with real timestamps.
    // Requested BRs are logged when mirrored into `bookings` (avoid duplicates).
    if (entry && normalizedStatus !== "blocked" && normalizedStatus !== "requested") {
      void logBookingCreatedActivity(
        {
          id: null,
          unique_code: entry.unique_code,
          status: entry.status,
          booking_type: entry.booking_type,
          prepayment_status: null,
          total_price: null,
          created_at: entry.created_at,
        },
        {
          actor: "professional",
          actorLabel: "Professional",
        },
      );
    }

    emitBusinessChangedForProfile(professionalProfile.id, {
      action: "updated",
      scope: "calendar",
    });

    return res.status(201).json({
      success: true,
      message: "Calendar entry created successfully.",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create calendar entry.",
      data: {
        error: error.message,
      },
    });
  }
};

export const getCalendarOverview = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can access calendar overview.",
        data: null,
      });
    }

    const startDate = normalizeBookingDateInput(req.query.startDate);
    const endDate = normalizeBookingDateInput(req.query.endDate);

    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required when filtering calendar overview.",
        data: null,
      });
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate must be on or before endDate.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const dateFilterParams = startDate && endDate ? [startDate, endDate] : [];
    const entriesDateClause =
      startDate && endDate ? `AND ${calendarEntryInRangeSql("calendar_entries", "$2", "$3")}` : "";
    const bookingsDateClause =
      startDate && endDate ? `AND ${bookingDateSql("b")} BETWEEN $2::date AND $3::date` : "";

    const [entriesResult, bookingsResult, settingsResult] = await Promise.all([
      query(
        `SELECT *
         FROM calendar_entries
         WHERE professional_profile_id = $1
         ${entriesDateClause}
         ORDER BY COALESCE(start_time, blocked_time_start, created_at) DESC`,
        [professionalProfile.id, ...dateFilterParams],
      ),
      query(
        `SELECT
           b.*,
           s.title AS service_title,
           tm.full_name AS team_member_name,
           COALESCE(
             NULLIF(TRIM(ip.display_name), ''),
             NULLIF(TRIM(CONCAT_WS(' ', ip.first_name, ip.last_name)), ''),
             NULLIF(TRIM(cp.legal_name), ''),
             NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), ''),
             u.email
           ) AS customer_name,
           u.email AS customer_email,
           CASE
             WHEN u.user_type = 'company' THEN 'company'
             WHEN u.user_type = 'individual' THEN 'individual'
             ELSE NULL
           END AS client_kind
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         LEFT JOIN subcategories s ON s.id = b.service_id
         LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
         LEFT JOIN users u ON u.id = b.customer_id
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id
         LEFT JOIN company_profiles cp ON cp.user_id = u.id
         WHERE bs.professional_profile_id = $1
         ${bookingsDateClause}
         ORDER BY COALESCE(b.start_time, b.created_at) DESC`,
        [professionalProfile.id, ...dateFilterParams],
      ),
      query(
        `SELECT *
         FROM calendar_settings
         WHERE professional_profile_id = $1`,
        [professionalProfile.id],
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "Calendar overview fetched successfully.",
      data: {
        entries: entriesResult.rows.map((entry) => ({
          ...entry,
          date: toIsoDate(entry.start_time || entry.blocked_time_start || entry.start_date),
          start: toTimeLabel(entry.start_time || entry.blocked_time_start),
          end: toTimeLabel(entry.end_time || entry.blocked_time_end),
        })),
        bookings: bookingsResult.rows.map((booking) => {
          const bookingDate = toIsoDate(booking.booking_date || booking.start_time);
          return {
            ...booking,
            booking_date: bookingDate,
            booking_type:
              booking.booking_type || (normalizeBookingStatus(booking.status, "confirmed") === "requested" ? "request" : "online"),
            unique_code: fallbackUniqueCode(booking),
            date: bookingDate,
            start: toTimeLabel(booking.start_time),
            end: toTimeLabel(booking.end_time),
          };
        }),
        settings: settingsResult.rows[0]
          ? {
              ...settingsResult.rows[0],
              availability: ensureAvailabilityServiceOrder(
                parseJsonValue(settingsResult.rows[0].availability, {}),
              ),
            }
          : {
              professional_profile_id: professionalProfile.id,
              availability: ensureAvailabilityServiceOrder({}),
              design: {},
            },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar overview.",
      data: {
        error: error.message,
      },
    });
  }
};

export const upsertCalendarSettings = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can manage calendar settings.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const availability = ensureAvailabilityServiceOrder(
      parseJsonValue(req.body.availability, {}),
    );
    const design = parseJsonValue(req.body.design, {});

    const result = await query(
      `INSERT INTO calendar_settings (
         professional_profile_id,
         availability,
         design
       )
       VALUES ($1, $2::jsonb, $3::jsonb)
       ON CONFLICT (professional_profile_id)
       DO UPDATE SET
         availability = EXCLUDED.availability,
         design = EXCLUDED.design,
         updated_at = NOW()
       RETURNING *`,
      [professionalProfile.id, JSON.stringify(availability), JSON.stringify(design)],
    );

    emitBusinessChangedForProfile(professionalProfile.id, {
      action: "updated",
      scope: "calendar",
    });

    return res.status(200).json({
      success: true,
      message: "Calendar settings saved successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save calendar settings.",
      data: {
        error: error.message,
      },
    });
  }
};

/**
 * Resolve which Mollure user should receive a professional-sent calendar BR.
 * Tries: users.email → professional_clients.email → professional_clients.display_name.
 */
const resolveMollureCustomerIdForCalendarEntry = async ({
  entry,
  professionalUserId,
}) => {
  const email = extractCalendarClientEmail(entry.client_name, entry.notes);
  const clientName = String(entry.client_name ?? "").trim();

  if (email) {
    const byUserEmail = await query(
      `SELECT id
       FROM users
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
         AND user_type IN ('individual', 'company')
         AND COALESCE(is_active, true) = true
       LIMIT 1`,
      [email],
    );
    if (byUserEmail.rows[0]?.id) return byUserEmail.rows[0].id;
  }

  const professionalProfile = await getProfessionalProfile(professionalUserId);
  if (!professionalProfile?.id) return null;

  const byClient = await query(
    `SELECT mollure_user_id
     FROM professional_clients
     WHERE professional_profile_id = $1
       AND mollure_user_id IS NOT NULL
       AND (
         ($2::text IS NOT NULL AND LOWER(TRIM(COALESCE(email, ''))) = LOWER(TRIM($2)))
         OR ($3::text <> '' AND LOWER(TRIM(COALESCE(display_name, ''))) = LOWER(TRIM($3)))
       )
     LIMIT 1`,
    [professionalProfile.id, email, clientName],
  );
  return byClient.rows[0]?.mollure_user_id ?? null;
};

/**
 * Mirror a professional-sent calendar BR into `bookings` so it appears on the
 * client's Past / Ongoing / Upcoming list (incoming BR).
 */
const mirrorCalendarRequestToBooking = async ({
  entry,
  professionalUserId,
}) => {
  if (!entry || String(entry.status).toLowerCase() !== "requested") return null;

  const customerId = await resolveMollureCustomerIdForCalendarEntry({
    entry,
    professionalUserId,
  });
  if (!customerId) return null;

  const businessSetup = await getBusinessSetupByUserId(
    professionalUserId,
    entry.location_type ?? null,
  );
  if (!businessSetup?.id) return null;

  const uniqueCode =
    entry.unique_code ||
    makeCalendarCode(calendarCodePrefixFor(entry.status, entry.booking_type || "online"));
  const bookingDate =
    normalizeBookingDateInput(entry.start_date) ||
    normalizeBookingDateInput(entry.start_time) ||
    null;
  const serviceIds = Array.isArray(entry.service_ids) ? entry.service_ids : [];
  const serviceId = parseOptionalUuid(serviceIds.find((id) => Boolean(id)) ?? null);

  // Mark as professional-outgoing so the client list can show an incoming BR badge.
  let notes = entry.notes ?? null;
  let mirroredTotal = null;
  if (notes && String(notes).includes("---mollure-meta---")) {
    try {
      const [human, metaRaw] = String(notes).split("---mollure-meta---");
      const meta = JSON.parse(metaRaw.trim() || "{}");
      if (!meta.requestDirection) meta.requestDirection = "outgoing";
      const servicesTotal = Array.isArray(meta.services)
        ? meta.services.reduce((sum, s) => sum + (Number(s?.price) || 0), 0)
        : 0;
      const productsTotal = Array.isArray(meta.products)
        ? meta.products.reduce(
            (sum, p) => sum + (Number(p?.price) || 0) * (Number(p?.quantity) || 1),
            0,
          )
        : 0;
      const snapshotServices = Array.isArray(meta.clientSnapshot?.services)
        ? meta.clientSnapshot.services.reduce((sum, s) => sum + (Number(s?.price) || 0), 0)
        : 0;
      const computed = servicesTotal + productsTotal || snapshotServices;
      if (computed > 0) mirroredTotal = computed;
      notes = `${human}---mollure-meta---\n${JSON.stringify(meta)}`;
    } catch {
      // keep original notes
    }
  } else {
    notes = `${notes ? `${notes}\n` : ""}---mollure-meta---\n${JSON.stringify({
      requestDirection: "outgoing",
    })}`;
  }

  const existing = await query(
    `SELECT id, status, prepayment_status FROM bookings WHERE unique_code = $1 LIMIT 1`,
    [uniqueCode],
  );
  if (existing.rows[0]) {
    // Update-in-place so pro BR edits do not create a second client booking.
    const updated = await query(
      `UPDATE bookings
       SET booking_date = COALESCE($1, booking_date),
           service_id = COALESCE($2, service_id),
           team_member_id = COALESCE($3, team_member_id),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           location_type = COALESCE($6, location_type),
           notes = $7,
           status = CASE
             WHEN LOWER(COALESCE(status, '')) IN ('cancelled', 'completed', 'no_show') THEN status
             ELSE 'requested'
           END,
           booking_type = 'online',
           total_price = COALESCE($8, total_price),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        bookingDate,
        serviceId,
        entry.team_member_id ?? null,
        entry.start_time ?? null,
        entry.end_time ?? null,
        entry.location_type ?? "fixed",
        notes,
        mirroredTotal,
        existing.rows[0].id,
      ],
    );
    const booking = updated.rows[0] ?? existing.rows[0];
    if (booking?.id) {
      try {
        void dispatchBookingUpdatedNotifications(
          booking,
          existing.rows[0].status,
          existing.rows[0].prepayment_status,
          {
            notifyIncomingEr: true,
            initiatedBy: "professional",
          },
        );
      } catch {
        // best-effort email/notification
      }
      try {
        emitBookingChanged(booking, "updated");
      } catch {
        // best-effort
      }
    }
    return booking;
  }

  const inserted = await query(
    `INSERT INTO bookings (
       booking_date,
       business_setup_id,
       customer_id,
       service_id,
       team_member_id,
       start_time,
       end_time,
       location_type,
       notes,
       status,
       booking_type,
       unique_code,
       total_price
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'requested', 'online', $10, $11)
     RETURNING *`,
    [
      bookingDate,
      businessSetup.id,
      customerId,
      serviceId,
      entry.team_member_id ?? null,
      entry.start_time ?? null,
      entry.end_time ?? null,
      entry.location_type ?? "fixed",
      notes,
      uniqueCode,
      mirroredTotal,
    ],
  );
  const booking = inserted.rows[0] ?? null;
  if (booking?.id) {
    try {
      await dispatchBookingCreatedNotifications(booking, { fromProfessional: true });
    } catch {
      // Notification/email is best-effort; mirrored booking still succeeds.
    }
    try {
      emitBookingChanged(booking, "created");
    } catch {
      // Socket emit is best-effort.
    }
    void logBookingCreatedActivity(booking, {
      actor: "professional",
      actorLabel: "Professional",
    });
  }
  return booking;
};

/**
 * Backfill: professional calendar BRs addressed to this Mollure user that were
 * never written into `bookings` (so they never showed on Your Bookings).
 */
const ensureIncomingCalendarRequestsMirrored = async (customerUserId) => {
  const userResult = await query(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [
    customerUserId,
  ]);
  const email = String(userResult.rows[0]?.email ?? "")
    .trim()
    .toLowerCase();

  const entries = await query(
    `SELECT
       ce.*,
       pp.user_id AS professional_user_id
     FROM calendar_entries ce
     INNER JOIN professional_profiles pp ON pp.id = ce.professional_profile_id
     WHERE ce.status = 'requested'
       AND NOT EXISTS (
         SELECT 1 FROM bookings b WHERE b.unique_code = ce.unique_code
       )
       AND (
         ($2::text <> '' AND LOWER(TRIM(ce.client_name)) = $2)
         OR ($2::text <> '' AND ce.notes ILIKE '%' || $2 || '%')
         OR EXISTS (
           SELECT 1
           FROM professional_clients pc
           WHERE pc.professional_profile_id = pp.id
             AND pc.mollure_user_id = $1
             AND (
               LOWER(TRIM(COALESCE(pc.display_name, ''))) = LOWER(TRIM(ce.client_name))
               OR (
                 NULLIF(TRIM(pc.email), '') IS NOT NULL
                 AND (
                   LOWER(TRIM(pc.email)) = LOWER(TRIM(ce.client_name))
                   OR ce.notes ILIKE '%' || TRIM(pc.email) || '%'
                 )
               )
             )
         )
       )
     LIMIT 50`,
    [customerUserId, email],
  );

  for (const entry of entries.rows) {
    try {
      await mirrorCalendarRequestToBooking({
        entry,
        professionalUserId: entry.professional_user_id,
      });
    } catch {
      // best-effort backfill — list should still return existing bookings
    }
  }
};

/**
 * Past / Ongoing / Upcoming buckets for client + professional booking lists.
 *
 * Upcoming = not started yet (requested, confirmed, invalid, waiting-for-prepayment).
 * Ongoing  = service currently happening (in_progress only; scoped per client/business).
 * Past     = finished / cancelled / no-show — never requested or confirmed.
 *
 * "Waiting for Prepayment" is confirmed/requested with unpaid required prepayment.
 */
const parseBookingsTabFilter = (tab, alias = "b") => {
  const normalized = String(tab ?? "").trim().toLowerCase();
  const waitingPrepaymentSql = `(
    LOWER(TRIM(COALESCE(${alias}.prepayment_status, ''))) IN ('pending', 'required')
    AND ${alias}.status IN ('requested', 'br_accepted', 'confirmed')
  )`;

  if (normalized === "past") {
    return `AND ${alias}.status IN ('completed', 'cancelled', 'no_show')`;
  }
  if (normalized === "ongoing") {
    return `AND ${alias}.status = 'in_progress'`;
  }
  if (normalized === "upcoming") {
    return `AND (
      ${alias}.status IN ('requested', 'br_accepted', 'confirmed', 'invalid')
      OR ${waitingPrepaymentSql}
    )`;
  }
  return "";
};

/** Normalize booking search: strip # / BK- so unique_code matches loosely. */
const parseBookingsSearchTerm = (raw) => {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/^#/, "")
    .replace(/^bk-?/i, "")
    .trim();
};

const mapBookingListRow = (booking) => {
  const bookingDate = toIsoDate(booking.booking_date || booking.start_time);
  return {
    ...booking,
    booking_date: bookingDate,
    date: bookingDate,
    start: toTimeLabel(booking.start_time),
    end: toTimeLabel(booking.end_time),
    booking_type:
      booking.booking_type ||
      (normalizeBookingStatus(booking.status, "confirmed") === "requested" ? "request" : "online"),
    unique_code: fallbackUniqueCode(booking),
  };
};

export const listBookings = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query);
    const tabFilterSql = parseBookingsTabFilter(req.query.tab);
    const searchTerm = parseBookingsSearchTerm(req.query.q ?? req.query.search);
    const searchPattern = searchTerm ? `%${searchTerm}%` : null;

    let result;
    let total = 0;

    if (req.user.user_type === "professional") {
      const businessSetup = await getBusinessSetupByUserId(req.user.id);

      if (!businessSetup) {
        return res.status(200).json(
          listResponse({
            message: "Bookings fetched successfully.",
            data: [],
            page: 1,
            limit: pagination.paginate ? pagination.limit : 0,
            total: 0,
            paginate: pagination.paginate,
          }),
        );
      }

      const baseParams = [businessSetup.id];
      let searchSql = "";
      if (searchPattern) {
        baseParams.push(searchPattern);
        searchSql = `AND (
          b.unique_code ILIKE $2
          OR CAST(b.id AS text) ILIKE $2
          OR COALESCE(
            NULLIF(TRIM(ip.display_name), ''),
            NULLIF(TRIM(CONCAT_WS(' ', ip.first_name, ip.last_name)), ''),
            u.email,
            ''
          ) ILIKE $2
          OR COALESCE(u.email, '') ILIKE $2
          OR COALESCE(s.title, '') ILIKE $2
        )`;
      }

      const { clause: limitClause } = sqlLimitOffset(baseParams.length + 1);

      const countResult = await query(
        `SELECT COUNT(*)::int AS total
         FROM bookings b
         LEFT JOIN users u ON u.id = b.customer_id
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id
         LEFT JOIN subcategories s ON s.id = b.service_id
         WHERE b.business_setup_id = $1
         ${tabFilterSql}
         ${searchSql}`,
        baseParams,
      );
      total = countResult.rows[0]?.total ?? 0;

      result = await query(
        `SELECT
           b.*,
           s.title AS service_title,
           tm.full_name AS team_member_name,
           bs.business_name,
           bs.fixed_location_municipality,
           bs.fixed_location_address,
           bs.fixed_location_street_number,
           bs.fixed_location_postal_code,
           bs.fixed_location_province,
           COALESCE(
             NULLIF(TRIM(ip.display_name), ''),
             NULLIF(TRIM(CONCAT_WS(' ', ip.first_name, ip.last_name)), ''),
             NULLIF(TRIM(cp.legal_name), ''),
             NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), ''),
             u.email
           ) AS customer_name,
           u.email AS customer_email,
           CASE
             WHEN u.user_type = 'company' THEN 'company'
             WHEN u.user_type = 'individual' THEN 'individual'
             ELSE NULL
           END AS client_kind
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         LEFT JOIN subcategories s ON s.id = b.service_id
         LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
         LEFT JOIN users u ON u.id = b.customer_id
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id
         LEFT JOIN company_profiles cp ON cp.user_id = u.id
         WHERE b.business_setup_id = $1
         ${tabFilterSql}
         ${searchSql}
         ORDER BY COALESCE(b.start_time, b.created_at) DESC
         ${pagination.paginate ? limitClause : ""}`,
        withPaginationParams(baseParams, pagination),
      );
    } else {
      // Backfill professional-sent BRs so they appear on the client's list.
      try {
        await ensureIncomingCalendarRequestsMirrored(req.user.id);
      } catch {
        // ignore — listing existing bookings is more important
      }

      const baseParams = [req.user.id];
      let searchSql = "";
      if (searchPattern) {
        baseParams.push(searchPattern);
        searchSql = `AND (
          b.unique_code ILIKE $2
          OR CAST(b.id AS text) ILIKE $2
          OR COALESCE(bs.business_name, '') ILIKE $2
          OR COALESCE(s.title, '') ILIKE $2
          OR COALESCE(bs.fixed_location_municipality, '') ILIKE $2
          OR COALESCE(bs.fixed_location_address, '') ILIKE $2
        )`;
      }

      const { clause: limitClause } = sqlLimitOffset(baseParams.length + 1);

      const countResult = await query(
        `SELECT COUNT(*)::int AS total
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         LEFT JOIN subcategories s ON s.id = b.service_id
         WHERE b.customer_id = $1
         ${tabFilterSql}
         ${searchSql}`,
        baseParams,
      );
      total = countResult.rows[0]?.total ?? 0;

      result = await query(
        `SELECT
           b.*,
           s.title AS service_title,
           tm.full_name AS team_member_name,
           bs.business_name,
           bs.fixed_location_municipality,
           bs.fixed_location_address,
           bs.fixed_location_street_number,
           bs.fixed_location_postal_code,
           bs.fixed_location_province
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         LEFT JOIN subcategories s ON s.id = b.service_id
         LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
         WHERE b.customer_id = $1
         ${tabFilterSql}
         ${searchSql}
         ORDER BY COALESCE(b.start_time, b.created_at) DESC
         ${pagination.paginate ? limitClause : ""}`,
        withPaginationParams(baseParams, pagination),
      );
    }

    const bookings = result.rows.map(mapBookingListRow);

    return res.status(200).json(
      listResponse({
        message: "Bookings fetched successfully.",
        data: bookings,
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings.",
      data: {
        error: error.message,
      },
    });
  }
};

export const uploadBookingAttachments = async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files provided.",
        data: null,
      });
    }

    const attachments = await saveBookingAttachments(req.user.id, files);
    return res.status(201).json({
      success: true,
      message: "Booking attachments uploaded successfully.",
      data: { attachments },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to upload booking attachments.",
      data: null,
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const locationDetails = parseJsonValue(req.body.location_details, {});
    if (req.user.user_type === "company" || req.user.user_type === "individual") {
      locationDetails.clientKind = req.user.user_type === "company" ? "company" : "individual";
    }

    const normalizedStatus = normalizeBookingStatus(req.body.status, "requested");
    let bookingType = req.body.booking_type ?? "online";
    if (bookingType === "project" && req.user.user_type === "individual") {
      bookingType = req.body.location_type === "desired" ? "request" : "online";
    }
    const generatedCodePrefix =
      bookingType === "offline" ? BOOKING_CODE_PREFIX.offline : BOOKING_CODE_PREFIX.online;
    const uniqueCode = await ensureUniqueBookingCode(req.body.unique_code, generatedCodePrefix);

    let notes = req.body.notes ?? null;
    if (
      (req.user.user_type === "company" || req.user.user_type === "individual") &&
      typeof notes === "string" &&
      notes.includes("---mollure-meta---")
    ) {
      const marker = "---mollure-meta---";
      const markerIndex = notes.indexOf(marker);
      try {
        const meta = JSON.parse(notes.slice(markerIndex + marker.length).trim());
        meta.clientKind = req.user.user_type === "company" ? "company" : "individual";
        notes = `${notes.slice(0, markerIndex)}${marker}\n${JSON.stringify(meta)}`;
      } catch {
        // keep original notes
      }
    }

    const result = await query(
      `INSERT INTO bookings (
         booking_date,
         business_setup_id,
         customer_id,
         service_id,
         team_member_id,
         start_time,
         end_time,
         location_type,
         location_details,
         notes,
         prepayment_status,
         status,
         booking_type,
         unique_code,
         total_price,
         images,
         contact_number,
         documents,
         province,
         municipality,
         street_address,
         street_number,
         postal_code
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
       )
       RETURNING *`,
      [
        normalizeBookingDateInput(req.body.booking_date),
        req.body.business_setup_id,
        req.user.id,
        req.body.service_id ?? null,
        req.body.team_member_id ?? null,
        req.body.start_time ?? null,
        req.body.end_time ?? null,
        req.body.location_type ?? null,
        JSON.stringify(locationDetails),
        notes,
        req.body.prepayment_status ?? null,
        normalizedStatus,
        bookingType,
        uniqueCode,
        parseOptionalNumber(req.body.total_price),
        parseTextArray(req.body.images),
        req.body.contact_number ?? null,
        parseTextArray(req.body.documents),
        req.body.province ?? null,
        req.body.municipality ?? null,
        req.body.street_address ?? null,
        req.body.street_number ?? null,
        req.body.postal_code ?? null,
      ],
    );

    const booking = result.rows[0];
    if (booking && ["confirmed", "completed"].includes(booking.status)) {
      try {
        await syncBookingToFinanceTransaction(booking.id, {
          paymentPhase: booking.prepayment_status === "paid" ? "prepay" : "full",
          paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        });
      } catch {
        // finance sync is best-effort
      }
      await safeEnsureProfessionalClientFromBooking(booking.id);
    }

    void logBookingCreatedActivity(booking);

    void dispatchBookingCreatedNotifications(booking).catch((error) => {
      console.error("[booking-notification] create dispatch failed:", error.message || error);
    });

    emitBookingChanged(booking, "created");

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create booking.",
      data: {
        error: error.message,
      },
    });
  }
};

export const updateCalendarEntryStatus = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can update calendar entry status.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);
    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const entryId = parseUuid(req.params.id);
    if (!entryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar entry id.",
        data: null,
      });
    }

    const status = normalizeCalendarStatus(req.body.status, "confirmed");
    if (status === "blocked") {
      return res.status(400).json({
        success: false,
        message: "Blocked status cannot be set through status update endpoint.",
        data: null,
      });
    }

    const existingForGuard = await query(
      `SELECT booking_type, status, unique_code, client_name
       FROM calendar_entries
       WHERE id = $1 AND professional_profile_id = $2
       LIMIT 1`,
      [entryId, professionalProfile.id],
    );
    if (!existingForGuard.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Calendar entry not found.",
        data: null,
      });
    }
    const previousEntry = existingForGuard.rows[0];
    const offlineStatusError = assertOfflineAllowsStatus(
      previousEntry.booking_type,
      status,
    );
    if (offlineStatusError) {
      return res.status(400).json({
        success: false,
        message: offlineStatusError,
        data: null,
      });
    }

    const result = await query(
      `UPDATE calendar_entries
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
         AND professional_profile_id = $3
       RETURNING *`,
      [status, entryId, professionalProfile.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Calendar entry not found.",
        data: null,
      });
    }

    const entry = result.rows[0];
    void logBookingStatusActivity(
      {
        id: null,
        unique_code: entry.unique_code,
        status: entry.status,
        booking_type: entry.booking_type,
        prepayment_status: null,
        total_price: null,
      },
      {
        previousStatus: previousEntry.status,
        actorLabel: "Professional",
      },
    );

    void notifyNonMollureCalendarClient(entry, {
      kind: "status",
      previousStatus: previousEntry.status,
      previousEntry,
    }).catch((error) => {
      console.error("[booking-email] calendar status notify failed:", error.message || error);
    });

    emitBusinessChangedForProfile(professionalProfile.id, {
      action: "updated",
      scope: "calendar",
    });

    return res.status(200).json({
      success: true,
      message: "Calendar entry status updated successfully.",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update calendar entry status.",
      data: {
        error: error.message,
      },
    });
  }
};

export const updateCalendarEntry = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can update calendar entries.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);
    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const entryId = parseUuid(req.params.id);
    if (!entryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar entry id.",
        data: null,
      });
    }

    const existingResult = await query(
      `SELECT * FROM calendar_entries
       WHERE id = $1 AND professional_profile_id = $2
       LIMIT 1`,
      [entryId, professionalProfile.id],
    );
    if (!existingResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Calendar entry not found.",
        data: null,
      });
    }

    const existing = existingResult.rows[0];
    const normalizedStatus =
      req.body.status !== undefined && req.body.status !== null && req.body.status !== ""
        ? normalizeCalendarStatus(req.body.status, existing.status)
        : existing.status;
    const normalizedBookingType = normalizeCalendarBookingType(
      req.body.booking_type !== undefined && req.body.booking_type !== null && req.body.booking_type !== ""
        ? req.body.booking_type
        : existing.booking_type,
      normalizedStatus,
    );
    const offlineStatusError = assertOfflineAllowsStatus(normalizedBookingType, normalizedStatus);
    if (offlineStatusError) {
      return res.status(400).json({
        success: false,
        message: offlineStatusError,
        data: null,
      });
    }

    const result = await query(
      `UPDATE calendar_entries
       SET team_member_id = COALESCE($1, team_member_id),
           status = $2,
           title = COALESCE(NULLIF($3, ''), title),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           start_date = COALESCE($6, start_date),
           end_date = COALESCE($7, end_date),
           location_type = COALESCE($8, location_type),
           booking_type = COALESCE($9, booking_type),
           client_name = COALESCE($10, client_name),
           notes = COALESCE($11, notes),
           service_ids = COALESCE($12, service_ids),
           updated_at = NOW()
       WHERE id = $13
         AND professional_profile_id = $14
       RETURNING *`,
      [
        parseOptionalUuid(req.body.team_member_id) ?? existing.team_member_id,
        normalizedStatus,
        req.body.title ?? existing.title,
        req.body.start_time !== undefined ? req.body.start_time : existing.start_time,
        req.body.end_time !== undefined ? req.body.end_time : existing.end_time,
        req.body.start_date !== undefined ? req.body.start_date : existing.start_date,
        req.body.end_date !== undefined ? req.body.end_date : existing.end_date,
        req.body.location_type !== undefined ? req.body.location_type : existing.location_type,
        normalizedBookingType,
        req.body.client_name !== undefined ? req.body.client_name : existing.client_name,
        req.body.notes !== undefined ? req.body.notes : existing.notes,
        req.body.service_ids !== undefined
          ? parseUuidArray(req.body.service_ids)
          : existing.service_ids,
        entryId,
        professionalProfile.id,
      ],
    );

    const entry = result.rows[0];
    if (entry && String(entry.status).toLowerCase() === "requested") {
      try {
        await mirrorCalendarRequestToBooking({
          entry,
          professionalUserId: req.user.id,
        });
      } catch {
        // best-effort mirror upsert
      }
    } else if (entry) {
      void notifyNonMollureCalendarClient(entry, {
        kind: "updated",
        previousEntry: existing,
      }).catch((error) => {
        console.error("[booking-email] calendar update notify failed:", error.message || error);
      });
    }

    emitBusinessChangedForProfile(professionalProfile.id, {
      action: "updated",
      scope: "calendar",
    });

    return res.status(200).json({
      success: true,
      message: "Calendar entry updated successfully.",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update calendar entry.",
      data: {
        error: error.message,
      },
    });
  }
};

export const deleteCalendarEntry = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can delete calendar entries.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);
    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const entryId = parseUuid(req.params.id);
    if (!entryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar entry id.",
        data: null,
      });
    }

    const result = await query(
      `DELETE FROM calendar_entries
       WHERE id = $1
         AND professional_profile_id = $2
       RETURNING id`,
      [entryId, professionalProfile.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Calendar entry not found.",
        data: null,
      });
    }

    emitBusinessChangedForProfile(professionalProfile.id, {
      action: "updated",
      scope: "calendar",
    });

    return res.status(200).json({
      success: true,
      message: "Calendar entry deleted successfully.",
      data: { id: result.rows[0].id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete calendar entry.",
      data: {
        error: error.message,
      },
    });
  }
};

export const updateMyBooking = async (req, res) => {
  try {
    if (req.user.user_type === "professional") {
      return res.status(403).json({
        success: false,
        message: "Professionals must use the status endpoint for booking updates.",
        data: null,
      });
    }

    const bookingId = parseUuid(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id.",
        data: null,
      });
    }

    const hasStatus = req.body.status !== undefined && req.body.status !== null && req.body.status !== "";
    const hasPrepayment =
      req.body.prepayment_status !== undefined &&
      req.body.prepayment_status !== null &&
      req.body.prepayment_status !== "";
    const hasNotes = req.body.notes !== undefined && req.body.notes !== null;
    const hasSchedule =
      (req.body.booking_date !== undefined && req.body.booking_date !== null && req.body.booking_date !== "") ||
      (req.body.start_time !== undefined && req.body.start_time !== null && req.body.start_time !== "") ||
      (req.body.end_time !== undefined && req.body.end_time !== null && req.body.end_time !== "");

    if (!hasStatus && !hasPrepayment && !hasNotes && !hasSchedule) {
      return res.status(400).json({
        success: false,
        message: "Provide status, prepayment_status, notes, and/or schedule fields to update.",
        data: null,
      });
    }

    const existingResult = await query(
      `SELECT *
       FROM bookings
       WHERE id = $1
         AND customer_id = $2
       LIMIT 1`,
      [bookingId, req.user.id],
    );

    if (!existingResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const existing = existingResult.rows[0];
    const previousStatus = existing.status;

    let nextStatus = existing.status;
    if (hasStatus) {
      nextStatus = normalizeBookingStatus(req.body.status, existing.status);
      const allowedCustomerStatuses = ["cancelled", "confirmed", "requested", "br_accepted", "invalid"];
      if (!allowedCustomerStatuses.includes(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: "Customers may only set booking status to cancelled, confirmed, requested, br_accepted, or invalid.",
          data: null,
        });
      }
      // Re-open a confirmed booking as an incoming booking request for the professional.
      if (nextStatus === "requested" && existing.status !== "confirmed" && existing.status !== "requested") {
        return res.status(400).json({
          success: false,
          message: "Booking can only be re-requested from a confirmed booking.",
          data: null,
        });
      }
    }

    let nextPrepayment = existing.prepayment_status;
    if (hasPrepayment) {
      const normalizedPrepayment = String(req.body.prepayment_status).trim().toLowerCase();
      if (!["paid", "pending", "failed", "required"].includes(normalizedPrepayment)) {
        return res.status(400).json({
          success: false,
          message: "prepayment_status must be paid, pending, failed, or required.",
          data: null,
        });
      }
      nextPrepayment = normalizedPrepayment;
      if (normalizedPrepayment === "paid") {
        if (nextStatus === "requested") {
          nextStatus = "confirmed";
        } else if (nextStatus === "br_accepted") {
          nextStatus = "confirmed";
        }
      }
    }

    const nextNotes = hasNotes ? String(req.body.notes) : existing.notes;
    const nextTotalPrice =
      req.body.total_price !== undefined && req.body.total_price !== null && req.body.total_price !== ""
        ? Number(req.body.total_price)
        : existing.total_price;
    const nextBookingDate = hasSchedule
      ? normalizeBookingDateInput(req.body.booking_date) || existing.booking_date
      : existing.booking_date;
    const nextStartTime =
      req.body.start_time !== undefined && req.body.start_time !== null && req.body.start_time !== ""
        ? req.body.start_time
        : existing.start_time;
    const nextEndTime =
      req.body.end_time !== undefined && req.body.end_time !== null && req.body.end_time !== ""
        ? req.body.end_time
        : existing.end_time;

    const scheduleOrTotalChanged =
      hasSchedule ||
      (req.body.total_price !== undefined &&
        req.body.total_price !== null &&
        req.body.total_price !== "" &&
        Number(req.body.total_price) !== Number(existing.total_price));

    // Confirmed bookings can be edited directly — no ER grant required.
    let nextEditRequest = existing.edit_request ?? null;
    if (
      scheduleOrTotalChanged &&
      existing.status === "confirmed" &&
      nextStatus === "confirmed"
    ) {
      nextEditRequest = null;
    }

    const result = await query(
      `UPDATE bookings
       SET status = $1,
           prepayment_status = $2,
           notes = $3,
           total_price = $4,
           booking_date = $5,
           start_time = $6,
           end_time = $7,
           edit_request = $8,
           updated_at = NOW()
       WHERE id = $9
         AND customer_id = $10
       RETURNING *`,
      [
        nextStatus,
        nextPrepayment,
        nextNotes,
        Number.isFinite(nextTotalPrice) ? nextTotalPrice : existing.total_price,
        nextBookingDate,
        nextStartTime,
        nextEndTime,
        nextEditRequest,
        bookingId,
        req.user.id,
      ],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const booking = result.rows[0];

    // Keep mirrored calendar_entries in sync when the client accepts / rejects / suggests.
    if (booking.unique_code) {
      try {
        await query(
          `UPDATE calendar_entries
           SET status = $1,
               notes = $2,
               start_time = COALESCE($3, start_time),
               end_time = COALESCE($4, end_time),
               updated_at = NOW()
           WHERE unique_code = $5`,
          [booking.status, booking.notes, booking.start_time, booking.end_time, booking.unique_code],
        );
      } catch {
        // best-effort — booking update still succeeds
      }
    }

    if (["confirmed", "completed"].includes(booking.status)) {
      try {
        await syncBookingToFinanceTransaction(booking.id, {
          paymentPhase: booking.prepayment_status === "paid" ? "prepay" : "full",
          paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        });
      } catch {
        // best-effort
      }
      await safeEnsureProfessionalClientFromBooking(booking.id);
    }

    if (previousStatus !== booking.status || existing.prepayment_status !== booking.prepayment_status) {
      void dispatchBookingUpdatedNotifications(booking, previousStatus, existing.prepayment_status, {
        notificationEvent: req.body.notification_event,
        initiatedBy: "client",
        notifyIncomingEr:
          req.body.notify_incoming_er === true || req.body.email_scenario === "incoming_er",
      });
    }
    void logBookingStatusActivity(booking, {
      previousStatus,
      previousPrepayment: existing.prepayment_status,
      actorLabel: "Client",
    });
    emitBookingChanged(booking, "updated");

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update booking.",
      data: {
        error: error.message,
      },
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can update booking status.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);
    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const bookingId = parseUuid(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id.",
        data: null,
      });
    }

    const status = normalizeBookingStatus(req.body.status, "requested");

    // Scope by professional profile (all business setups), not a single rows[0] setup —
    // calendar overview lists bookings across setups; Accept/Reject must match that.
    const existingResult = await query(
      `SELECT b.status, b.notes, b.total_price, b.booking_date, b.start_time, b.end_time,
              b.business_setup_id, b.customer_id, b.edit_request, b.prepayment_status,
              b.booking_type, b.unique_code
       FROM bookings b
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
       WHERE b.id = $1
         AND bs.professional_profile_id = $2
       LIMIT 1`,
      [bookingId, professionalProfile.id],
    );

    if (!existingResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const previousStatus = existingResult.rows[0].status;
    const businessSetupId = existingResult.rows[0].business_setup_id;
    const customerId = existingResult.rows[0].customer_id;

    // No Show = client booked but did not arrive. Only from active attendance states.
    if (status === "no_show" && !["confirmed", "in_progress"].includes(previousStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only confirmed or in-progress bookings can be marked as no show.",
        data: null,
      });
    }

    const existingBooking = existingResult.rows[0];
    if (
      isEditRequestPending(existingBooking.edit_request) &&
      ["cancelled", "in_progress", "no_show"].includes(status)
    ) {
      return res.status(409).json({
        success: false,
        message: "Cancel, In Progress, and No Show are locked while an edit request is pending.",
        data: null,
      });
    }

    const nextNotes =
      req.body.notes !== undefined && req.body.notes !== null
        ? String(req.body.notes)
        : existingBooking.notes;
    const nextTotalPrice =
      req.body.total_price !== undefined && req.body.total_price !== null && req.body.total_price !== ""
        ? Number(req.body.total_price)
        : existingBooking.total_price;

    const hasSchedule =
      (req.body.booking_date !== undefined && req.body.booking_date !== null && req.body.booking_date !== "") ||
      (req.body.start_time !== undefined && req.body.start_time !== null && req.body.start_time !== "") ||
      (req.body.end_time !== undefined && req.body.end_time !== null && req.body.end_time !== "");
    const nextBookingDate = hasSchedule
      ? normalizeBookingDateInput(req.body.booking_date) || existingBooking.booking_date
      : existingBooking.booking_date;
    const nextStartTime =
      req.body.start_time !== undefined && req.body.start_time !== null && req.body.start_time !== ""
        ? req.body.start_time
        : existingBooking.start_time;
    const nextEndTime =
      req.body.end_time !== undefined && req.body.end_time !== null && req.body.end_time !== ""
        ? req.body.end_time
        : existingBooking.end_time;

    const scheduleOrTotalChanged =
      hasSchedule ||
      (req.body.total_price !== undefined &&
        req.body.total_price !== null &&
        req.body.total_price !== "" &&
        Number(req.body.total_price) !== Number(existingBooking.total_price));

    // Confirmed bookings can be edited directly — no ER grant required.
    let nextEditRequest = existingBooking.edit_request ?? null;
    if (
      scheduleOrTotalChanged &&
      previousStatus === "confirmed" &&
      status === "confirmed"
    ) {
      nextEditRequest = null;
    }

    const result = await query(
      `UPDATE bookings
       SET status = $1,
           notes = $2,
           total_price = $3,
           booking_date = $4,
           start_time = $5,
           end_time = $6,
           edit_request = $7,
           updated_at = NOW()
       WHERE id = $8
         AND business_setup_id = $9
       RETURNING *`,
      [
        status,
        nextNotes,
        Number.isFinite(nextTotalPrice) ? nextTotalPrice : existingBooking.total_price,
        nextBookingDate,
        nextStartTime,
        nextEndTime,
        nextEditRequest,
        bookingId,
        businessSetupId,
      ],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const booking = result.rows[0];

    // Keep mirrored calendar_entries in sync (pro BR edits on b-* events).
    if (booking.unique_code) {
      try {
        await query(
          `UPDATE calendar_entries
           SET status = $1,
               notes = $2,
               title = COALESCE(NULLIF($3, ''), title),
               start_time = COALESCE($4, start_time),
               end_time = COALESCE($5, end_time),
               start_date = COALESCE($6, start_date),
               end_date = COALESCE($6, end_date),
               updated_at = NOW()
           WHERE unique_code = $7
             AND professional_profile_id = $8`,
          [
            booking.status,
            booking.notes,
            booking.service_title || null,
            booking.start_time,
            booking.end_time,
            booking.booking_date,
            booking.unique_code,
            professionalProfile.id,
          ],
        );
      } catch {
        // best-effort
      }
    }

    if (["confirmed", "completed"].includes(booking.status)) {
      try {
        await syncBookingToFinanceTransaction(booking.id, {
          paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        });
      } catch {
        // best-effort
      }
      await safeEnsureProfessionalClientFromBooking(booking.id);
    }

    // Flag the client record when they booked but did not show up.
    if (booking.status === "no_show" && customerId) {
      try {
        await query(
          `UPDATE professional_clients pc
           SET has_no_show = true,
               updated_at = NOW()
           WHERE pc.professional_profile_id = $1
             AND (
               pc.mollure_user_id = $2
               OR (
                 pc.email IS NOT NULL
                 AND lower(pc.email) = (
                   SELECT lower(u.email) FROM users u WHERE u.id = $2 LIMIT 1
                 )
               )
             )`,
          [professionalProfile.id, customerId],
        );
      } catch {
        // best-effort client flag
      }
    }

    void dispatchBookingUpdatedNotifications(booking, previousStatus, booking.prepayment_status, {
      notifyIncomingEr: req.body.notify_incoming_er === true || req.body.email_scenario === "incoming_er",
      notificationEvent: req.body.notification_event,
      initiatedBy: req.body.initiated_by === "client" ? "client" : "professional",
    });

    void logBookingStatusActivity(booking, {
      previousStatus,
      previousPrepayment: existingBooking.prepayment_status,
      actorLabel: "Professional",
    });

    emitBookingChanged(booking, "updated");

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update booking status.",
      data: {
        error: error.message,
      },
    });
  }
};

const loadBookingForEditRequestAccess = async (user, bookingId) => {
  if (user.user_type === "professional") {
    const professionalProfile = await getProfessionalProfile(user.id);
    if (!professionalProfile) return null;
    const result = await query(
      `SELECT b.*
       FROM bookings b
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
       WHERE b.id = $1
         AND bs.professional_profile_id = $2
       LIMIT 1`,
      [bookingId, professionalProfile.id],
    );
    return result.rows[0] ?? null;
  }

  const result = await query(
    `SELECT *
     FROM bookings
     WHERE id = $1
       AND customer_id = $2
     LIMIT 1`,
    [bookingId, user.id],
  );
  return result.rows[0] ?? null;
};

/**
 * Confirmed Edit Request (ER): send | accept | reject.
 * Body: { action: "send"|"accept"|"reject", note?: string }
 */
export const manageBookingEditRequest = async (req, res) => {
  try {
    const bookingId = parseUuid(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id.",
        data: null,
      });
    }

    const action = String(req.body.action ?? "").trim().toLowerCase();
    if (!["send", "accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be send, accept, or reject.",
        data: null,
      });
    }

    const booking = await loadBookingForEditRequestAccess(req.user, bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    if (String(booking.status).toLowerCase() !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Edit requests are only allowed on confirmed bookings.",
        data: null,
      });
    }

    const actor =
      req.user.user_type === "professional" ? "professional" : "client";
    const existingEr = parseEditRequest(booking.edit_request);
    let nextEditRequest = booking.edit_request ?? null;
    let message = "Edit request updated.";
    let notificationEvent = null;

    if (action === "send") {
      if (existingEr?.status === "pending") {
        return res.status(409).json({
          success: false,
          message: "An edit request is already pending.",
          data: null,
        });
      }
      const built = buildPendingEditRequest({
        note: req.body.note,
        initiatedBy: actor,
      });
      if (built.error) {
        return res.status(400).json({
          success: false,
          message: built.error,
          data: null,
        });
      }
      nextEditRequest = built.value;
      message = "Edit request sent.";
      notificationEvent =
        actor === "professional"
          ? BOOKING_NOTIFICATION_EVENTS.INCOMING_ER
          : BOOKING_NOTIFICATION_EVENTS.EDIT_REQUEST_OUTGOING;
    } else if (action === "accept") {
      if (!existingEr || existingEr.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "No pending edit request to accept.",
          data: null,
        });
      }
      if (existingEr.initiated_by === actor) {
        return res.status(403).json({
          success: false,
          message: "You cannot accept your own edit request.",
          data: null,
        });
      }
      const built = buildApprovedEditRequest(existingEr);
      if (built.error) {
        return res.status(400).json({
          success: false,
          message: built.error,
          data: null,
        });
      }
      nextEditRequest = built.value;
      message = "Edit request accepted.";
      notificationEvent = BOOKING_NOTIFICATION_EVENTS.ER_ACCEPTED;
    } else {
      if (!existingEr || existingEr.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "No pending edit request to reject.",
          data: null,
        });
      }
      if (existingEr.initiated_by === actor) {
        return res.status(403).json({
          success: false,
          message: "You cannot reject your own edit request.",
          data: null,
        });
      }
      nextEditRequest = buildRejectedClear().value;
      message = "Edit request rejected.";
      notificationEvent = BOOKING_NOTIFICATION_EVENTS.ER_REJECTED;
    }

    const result = await query(
      `UPDATE bookings
       SET edit_request = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [nextEditRequest, bookingId],
    );

    const updated = result.rows[0];
    if (notificationEvent) {
      void dispatchBookingEventNotification(updated.id, notificationEvent, {
        initiatedBy: actor,
        message: existingEr?.note || req.body.note || undefined,
      });
    }
    emitBookingChanged(updated, "updated");

    return res.status(200).json({
      success: true,
      message,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update edit request.",
      data: {
        error: error.message,
      },
    });
  }
};

export const getBookingActivity = async (req, res) => {
  try {
    const rawId = typeof req.params.id === "string" ? req.params.id.trim() : "";
    const bookingIdParam = parseUuid(rawId);
    const bookingCode =
      (typeof req.query.code === "string" && req.query.code.trim()) ||
      (!bookingIdParam && rawId ? rawId : null);

    if (!bookingIdParam && !bookingCode) {
      return res.status(400).json({
        success: false,
        message: "Booking id or code is required.",
        data: null,
      });
    }

    let authorizedBookingId = null;
    let authorizedCode = bookingCode;

    if (bookingIdParam) {
      const access = await query(
        `SELECT
           b.id,
           b.unique_code,
           b.customer_id,
           pp.user_id AS professional_user_id
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
         WHERE b.id = $1
         LIMIT 1`,
        [bookingIdParam],
      );
      const row = access.rows[0];
      if (!row) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
          data: null,
        });
      }
      const allowed =
        row.customer_id === req.user.id || row.professional_user_id === req.user.id;
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this booking activity.",
          data: null,
        });
      }
      authorizedBookingId = row.id;
      authorizedCode = row.unique_code || bookingCode;
    } else if (bookingCode) {
      // Calendar-only offline bookings: authorize via calendar_entries ownership or bookings.
      const byBooking = await query(
        `SELECT
           b.id,
           b.unique_code,
           b.customer_id,
           pp.user_id AS professional_user_id
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
         WHERE b.unique_code = $1
         LIMIT 1`,
        [bookingCode],
      );
      if (byBooking.rows[0]) {
        const row = byBooking.rows[0];
        const allowed =
          row.customer_id === req.user.id || row.professional_user_id === req.user.id;
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this booking activity.",
            data: null,
          });
        }
        authorizedBookingId = row.id;
        authorizedCode = row.unique_code;
      } else {
        const byEntry = await query(
          `SELECT ce.unique_code, pp.user_id AS professional_user_id
           FROM calendar_entries ce
           INNER JOIN professional_profiles pp ON pp.id = ce.professional_profile_id
           WHERE ce.unique_code = $1
           LIMIT 1`,
          [bookingCode],
        );
        if (!byEntry.rows[0] || byEntry.rows[0].professional_user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this booking activity.",
            data: null,
          });
        }
        authorizedCode = byEntry.rows[0].unique_code;
      }
    }

    const events = await listBookingActivityEvents({
      bookingId: authorizedBookingId,
      bookingCode: authorizedCode,
    });

    return res.status(200).json({
      success: true,
      message: "Booking activity loaded.",
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load booking activity.",
      data: {
        error: error.message,
      },
    });
  }
};

const assertBookingNotificationAccess = async (user, bookingId) => {
  const result = await query(
    `SELECT
       b.id,
       b.customer_id,
       pp.user_id AS professional_user_id
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId],
  );

  const row = result.rows[0];
  if (!row) return null;

  if (user.user_type === "professional") {
    return row.professional_user_id === user.id ? row : null;
  }

  return row.customer_id === user.id ? row : null;
};

export const createBookingNotification = async (req, res) => {
  try {
    const bookingId = parseUuid(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id.",
        data: null,
      });
    }

    const event = String(req.body.event ?? req.body.notification_event ?? "").trim();
    if (!event || !Object.values(BOOKING_NOTIFICATION_EVENTS).includes(event)) {
      return res.status(400).json({
        success: false,
        message: "A valid notification event is required.",
        data: null,
      });
    }

    const access = await assertBookingNotificationAccess(req.user, bookingId);
    if (!access) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const initiatedBy =
      req.body.initiated_by === "client" || req.body.initiated_by === "professional"
        ? req.body.initiated_by
        : req.user.user_type === "professional"
          ? "professional"
          : "client";

    await dispatchBookingEventNotification(bookingId, event, {
      initiatedBy,
      message: req.body.message ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Notification dispatched.",
      data: { bookingId, event },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch booking notification.",
      data: {
        error: error.message,
      },
    });
  }
};

const mapTeamMemberDetail = (row) => ({
  id: row.id,
  business_setup_id: row.business_setup_id,
  full_name: row.full_name,
  role: row.role,
  profile_photo: row.profile_photo,
  assigned_services: parseJsonArray(row.assigned_services),
  display_order: row.display_order,
  first_name: row.first_name,
  last_name: row.last_name,
  contact_number: row.contact_number,
  email: row.email,
  emergency_contact_name: row.emergency_contact_name,
  emergency_contact_number: row.emergency_contact_number,
  personal_note: row.personal_note,
  personal_documents: parseJsonArray(row.personal_documents),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const updateTeamMember = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professionals can update team members.",
        data: null,
      });
    }

    const memberId = parseUuid(req.params.id, "team member id");
    const professionalProfile = await getProfessionalProfile(req.user.id);
    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const existingResult = await query(
      `SELECT tm.*
       FROM business_team_members tm
       INNER JOIN business_setups bs ON bs.id = tm.business_setup_id
       WHERE tm.id = $1 AND bs.professional_profile_id = $2`,
      [memberId, professionalProfile.id],
    );

    if (!existingResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
        data: null,
      });
    }

    const existing = existingResult.rows[0];
    const body = req.body ?? {};

    let fullName =
      body.full_name !== undefined
        ? String(body.full_name ?? "").trim()
        : existing.full_name;
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Team member name is required.",
        data: null,
      });
    }

    let assignedServices = parseJsonArray(existing.assigned_services);
    if (body.assigned_services !== undefined) {
      assignedServices = parseJsonArray(body.assigned_services)
        .map((service) => {
          if (!service || typeof service !== "object") return null;
          const serviceId = parseUuid(service.service_id);
          if (!serviceId) return null;
          return {
            service_id: serviceId,
            title: service.title ? String(service.title).trim() : null,
          };
        })
        .filter(Boolean);
    }

    let profilePhoto = existing.profile_photo;
    const photoFile = req.files?.profile_photo?.[0];
    if (photoFile?.buffer?.length) {
      profilePhoto = await uploadTeamMemberPhotoFileToS3(req.user.id, photoFile);
    } else if (body.profile_photo === null || body.profile_photo === "") {
      profilePhoto = null;
    } else if (typeof body.profile_photo === "string" && body.profile_photo.trim()) {
      profilePhoto = body.profile_photo.trim();
    }

    let personalDocuments = parseJsonArray(existing.personal_documents);
    if (body.personal_documents !== undefined) {
      personalDocuments = parseJsonArray(body.personal_documents);
    }

    const documentFiles = Array.isArray(req.files?.personal_document)
      ? req.files.personal_document
      : req.files?.personal_document
        ? [req.files.personal_document]
        : [];

    for (const documentFile of documentFiles) {
      if (!documentFile?.buffer?.length) continue;
      if (personalDocuments.length >= 5) break;

      const url = await uploadTeamMemberDocumentFileToS3(req.user.id, documentFile);
      personalDocuments = [
        ...personalDocuments,
        {
          url,
          filename: documentFile.originalname || "document",
          uploaded_at: new Date().toISOString(),
        },
      ];
    }

    personalDocuments = personalDocuments.slice(0, 5);

    const nullableText = (value, fallback) => {
      if (value === undefined) return fallback;
      const trimmed = String(value ?? "").trim();
      return trimmed || null;
    };

    const updatedResult = await query(
      `UPDATE business_team_members
       SET
         full_name = $2,
         profile_photo = $3,
         assigned_services = $4::jsonb,
         first_name = $5,
         last_name = $6,
         contact_number = $7,
         email = $8,
         emergency_contact_name = $9,
         emergency_contact_number = $10,
         personal_note = $11,
         personal_documents = $12::jsonb,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        memberId,
        fullName,
        profilePhoto,
        JSON.stringify(assignedServices),
        nullableText(body.first_name, existing.first_name),
        nullableText(body.last_name, existing.last_name),
        nullableText(body.contact_number, existing.contact_number),
        nullableText(body.email, existing.email),
        nullableText(body.emergency_contact_name, existing.emergency_contact_name),
        nullableText(body.emergency_contact_number, existing.emergency_contact_number),
        nullableText(body.personal_note, existing.personal_note),
        JSON.stringify(personalDocuments),
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Team member updated.",
      data: mapTeamMemberDetail(updatedResult.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update team member.",
      data: { error: error.message },
    });
  }
};
