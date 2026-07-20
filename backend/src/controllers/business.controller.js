import { getClient, query } from "../db/index.js";
import {
  isS3UploadConfigured,
  uploadBusinessMediaFilesToS3,
  uploadTeamMemberPhotoFileToS3,
} from "../services/s3-upload.service.js";
import { buildServiceDetailsFromCategories } from "../utils/business-service-categories.js";
import { syncBookingToFinanceTransaction } from "../services/finance-sync.service.js";
import {
  BOOKING_NOTIFICATION_EVENTS,
  dispatchBookingCreatedNotifications,
  dispatchBookingEventNotification,
  dispatchBookingUpdatedNotifications,
} from "../services/bookingNotification.service.js";
import { emitBookingChanged } from "../messaging/messagingSocket.js";
import { normalizeEntityId } from "../utils/business-setup-parsers.js";
import { saveBookingAttachments } from "../services/booking-upload.service.js";
import {
  isValidUuid,
  parseOptionalUuid,
  parseUuid,
  parseUuidArray,
} from "../utils/uuid.js";

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

const makeCalendarCode = (prefix = "OF123") => `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
const calendarStatusSet = new Set(["requested", "cancelled", "completed", "confirmed", "blocked", "no_show"]);
const bookingStatusSet = new Set(["requested", "cancelled", "completed", "confirmed", "no_show"]);

const ensureUniqueBookingCode = async (preferredCode, prefix = "123") => {
  const trimmed = String(preferredCode ?? "").trim();
  if (trimmed) {
    const existing = await query(`SELECT 1 FROM bookings WHERE unique_code = $1 LIMIT 1`, [trimmed]);
    if (!existing.rows.length) {
      return trimmed;
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = makeCalendarCode(prefix);
    const existing = await query(`SELECT 1 FROM bookings WHERE unique_code = $1 LIMIT 1`, [candidate]);
    if (!existing.rows.length) {
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

      if (!categoryId || !serviceId) {
        return null;
      }

      return {
        category_id: categoryId,
        service_id: serviceId,
        category_title: categoryTitle,
        service_title: serviceTitle,
        amount: amount ?? 0,
        duration_label: durationLabel,
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

const getBusinessSetupByUserId = async (userId) => {
  const result = await query(
    `SELECT bs.*
     FROM business_setups bs
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE pp.user_id = $1`,
    [userId],
  );

  return result.rows[0] || null;
};

const getBusinessSetupDetailById = async (setupId, client = { query }) => {
  const setupResult = await client.query(
    `SELECT bs.*
     FROM business_setups bs
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
  }));

  const serviceCategories = parseJsonArray(businessSetup.service_categories);
  const serviceDetails = await buildServiceDetailsFromCategories(
    serviceCategories,
    setupId,
    client.query.bind(client),
    { teamMembers, useTeamAssignmentsFallback: false },
  );

  return {
    ...businessSetup,
    service_categories: serviceCategories,
    book_service_combinations: parseJsonArray(businessSetup.book_service_combinations),
    team_members: teamMembers,
    service_details: serviceDetails,
  };
};

const getBusinessSetupDetailByUserId = async (userId, client = { query }) => {
  const businessSetup = await getBusinessSetupByUserId(userId);

  if (!businessSetup) {
    return null;
  }

  return getBusinessSetupDetailById(businessSetup.id, client);
};

export const listCategories = async (_req, res) => {
  try {
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
       ORDER BY c.title`,
    );

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully.",
      data: result.rows,
    });
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

    const businessSetup = await getBusinessSetupDetailByUserId(req.user.id);

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

    if (existingMedia.length + files.length > 4) {
      return res.status(400).json({
        success: false,
        message: `You can upload at most 4 images (${existingMedia.length} already saved).`,
        data: null,
      });
    }

    const uploadedUrls = await uploadBusinessMediaFilesToS3(req.user.id, files);
    const nextMedia = [...existingMedia, ...uploadedUrls].slice(0, 4);

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
      service_categories: JSON.stringify(serviceCategories),
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
    };

    const fields = Object.keys(payload);
    const values = [professionalProfile.id, ...fields.map((field) => payload[field])];
    const updateAssignments = fields
      .map((field, index) => {
        const castType = ["service_categories", "book_service_combinations"].includes(field) ? "::jsonb" : "";
        return `${field} = $${index + 2}${castType}`;
      })
      .concat("updated_at = NOW()")
      .join(", ");

    const client = await getClient();

    try {
      await client.query("BEGIN");

      const insertValues = fields
        .map((field, index) => {
          const castType = ["service_categories", "book_service_combinations"].includes(field) ? "::jsonb" : "";
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

      if (teamMembers.length > 0) {
        const existingMembersResult = await client.query(
          `SELECT id
           FROM business_team_members
           WHERE business_setup_id = $1`,
          [businessSetup.id],
        );

        const existingMemberIds = new Set(existingMembersResult.rows.map((row) => row.id));

        for (const member of teamMembers) {
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
        await client.query(
          `DELETE FROM business_team_members
           WHERE business_setup_id = $1`,
          [businessSetup.id],
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

      const savedBusinessSetup = await getBusinessSetupDetailById(businessSetup.id, client);

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Business setup saved successfully.",
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
       ORDER BY created_at DESC`,
      [professionalProfile.id],
    );

    return res.status(200).json({
      success: true,
      message: "Calendar entries fetched successfully.",
      data: result.rows,
    });
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
    const normalizedBookingType = req.body.booking_type ?? (normalizedStatus === "requested" ? "request" : "offline");
    const codePrefix =
      normalizedStatus === "blocked" ? "BLK" : normalizedBookingType === "online" ? "123" : "OF123";

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
        req.body.unique_code || makeCalendarCode(codePrefix),
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

    return res.status(201).json({
      success: true,
      message: "Calendar entry created successfully.",
      data: result.rows[0],
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
             u.email
           ) AS customer_name,
           u.email AS customer_email
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         LEFT JOIN subcategories s ON s.id = b.service_id
         LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
         LEFT JOIN users u ON u.id = b.customer_id
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id
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
            unique_code: booking.unique_code || `123${booking.id}`,
            date: bookingDate,
            start: toTimeLabel(booking.start_time),
            end: toTimeLabel(booking.end_time),
          };
        }),
        settings: settingsResult.rows[0] || null,
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

    const availability = parseJsonValue(req.body.availability, {});
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

export const listBookings = async (req, res) => {
  try {
    let result;

    if (req.user.user_type === "professional") {
      const businessSetup = await getBusinessSetupByUserId(req.user.id);

      if (!businessSetup) {
        return res.status(200).json({
          success: true,
          message: "Bookings fetched successfully.",
          data: [],
        });
      }

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
             u.email
           ) AS customer_name,
           u.email AS customer_email
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         LEFT JOIN subcategories s ON s.id = b.service_id
         LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
         LEFT JOIN users u ON u.id = b.customer_id
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id
         WHERE b.business_setup_id = $1
         ORDER BY COALESCE(b.start_time, b.created_at) DESC`,
        [businessSetup.id],
      );
    } else {
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
         ORDER BY COALESCE(b.start_time, b.created_at) DESC`,
        [req.user.id],
      );
    }

    const bookings = result.rows.map((booking) => {
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
        unique_code: booking.unique_code || `123${booking.id}`,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully.",
      data: bookings,
    });
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

    const normalizedStatus = normalizeBookingStatus(req.body.status, "requested");
    const bookingType = req.body.booking_type ?? "online";
    const generatedCodePrefix = bookingType === "offline" ? "OF123" : "123";
    const uniqueCode = await ensureUniqueBookingCode(req.body.unique_code, generatedCodePrefix);

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
        req.body.notes ?? null,
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
    }

    void dispatchBookingCreatedNotifications(booking);
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

    return res.status(200).json({
      success: true,
      message: "Calendar entry status updated successfully.",
      data: result.rows[0],
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

    if (!hasStatus && !hasPrepayment) {
      return res.status(400).json({
        success: false,
        message: "Provide status and/or prepayment_status to update.",
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
      if (!["cancelled", "confirmed"].includes(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: "Customers may only set booking status to cancelled or confirmed.",
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
      if (normalizedPrepayment === "paid" && nextStatus === "requested") {
        nextStatus = "confirmed";
      }
    }

    const result = await query(
      `UPDATE bookings
       SET status = $1,
           prepayment_status = $2,
           updated_at = NOW()
       WHERE id = $3
         AND customer_id = $4
       RETURNING *`,
      [nextStatus, nextPrepayment, bookingId, req.user.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const booking = result.rows[0];
    if (["confirmed", "completed"].includes(booking.status)) {
      try {
        await syncBookingToFinanceTransaction(booking.id, {
          paymentPhase: booking.prepayment_status === "paid" ? "prepay" : "full",
          paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        });
      } catch {
        // best-effort
      }
    }

    if (previousStatus !== booking.status || existing.prepayment_status !== booking.prepayment_status) {
      void dispatchBookingUpdatedNotifications(booking, previousStatus, existing.prepayment_status, {
        notificationEvent: req.body.notification_event,
        initiatedBy: "client",
        notifyIncomingEr:
          req.body.notify_incoming_er === true || req.body.email_scenario === "incoming_er",
      });
    }
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

    const businessSetup = await getBusinessSetupByUserId(req.user.id);
    if (!businessSetup) {
      return res.status(404).json({
        success: false,
        message: "Business setup not found.",
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

    const existingResult = await query(
      `SELECT status
       FROM bookings
       WHERE id = $1
         AND business_setup_id = $2
       LIMIT 1`,
      [bookingId, businessSetup.id],
    );

    if (!existingResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const previousStatus = existingResult.rows[0].status;

    const result = await query(
      `UPDATE bookings
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
         AND business_setup_id = $3
       RETURNING *`,
      [status, bookingId, businessSetup.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }

    const booking = result.rows[0];
    if (["confirmed", "completed"].includes(booking.status)) {
      try {
        await syncBookingToFinanceTransaction(booking.id, {
          paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        });
      } catch {
        // best-effort
      }
    }

    void dispatchBookingUpdatedNotifications(booking, previousStatus, booking.prepayment_status, {
      notifyIncomingEr: req.body.notify_incoming_er === true || req.body.email_scenario === "incoming_er",
      notificationEvent: req.body.notification_event,
      initiatedBy: req.body.initiated_by === "client" ? "client" : "professional",
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
