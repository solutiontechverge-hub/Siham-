import { query } from "../db/index.js";
import { buildServiceDetailsMapForSetups } from "../utils/business-service-categories.js";
import {
  groupRowsByBusinessSetupId,
  transformBusinessSetupForListing,
} from "../utils/business-setup-listing.mapper.js";
import {
  listResponse,
  parseListPagination,
} from "../utils/pagination.js";
import { getRankedActiveBusinessSetups } from "../services/listing-ranking.service.js";
import {
  getReviewAggregatesForSetups,
  getTeamMemberReviewAggregatesForSetups,
} from "../services/review.service.js";
import { logError, sendCaughtError } from "../utils/httpError.js";
import {
  calendarEntryCoversDateSql,
  pushBusyInterval,
  wallClockTimeToMinutes,
} from "../utils/teamMemberAvailability.js";

function parseJsonField(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizePublicBusinessHours(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return [raw];
  return [];
}

function parseAssignedServiceIds(raw) {
  const items = Array.isArray(raw) ? raw : [];
  return items
    .map((item) => {
      if (item == null) return "";
      if (typeof item === "object") {
        return String(item.service_id ?? item.serviceId ?? "").trim();
      }
      return String(item).trim();
    })
    .filter(Boolean);
}

export const getSetupAvailabilityForDate = async (req, res) => {
  try {
    const setupId = req.params.setupId;
    const date = String(req.query.date ?? "").trim();
    const location = String(req.query.location ?? "FL").trim().toUpperCase() === "DL" ? "DL" : "FL";
    const excludeBookingId = String(req.query.excludeBookingId ?? "").trim() || null;

    if (!setupId) {
      return res.status(400).json({
        success: false,
        message: "Business setup id is required.",
        data: null,
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid date query parameter (YYYY-MM-DD) is required.",
        data: null,
      });
    }

    const setupResult = await query(
      `SELECT id, professional_profile_id
       FROM business_setups
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [setupId],
    );
    const setup = setupResult.rows[0];
    if (!setup?.professional_profile_id) {
      return res.status(404).json({
        success: false,
        message: "Business setup not found.",
        data: null,
      });
    }

    const [teamMembersResult, settingsResult, bookingsResult, entriesResult] =
      await Promise.all([
        query(
          `SELECT id, full_name, assigned_services
           FROM business_team_members
           WHERE business_setup_id = $1
           ORDER BY display_order ASC, id ASC`,
          [setupId],
        ),
        query(
          `SELECT availability
           FROM calendar_settings
           WHERE professional_profile_id = $1
           LIMIT 1`,
          [setup.professional_profile_id],
        ),
        query(
          `SELECT team_member_id, start_time, end_time, status
           FROM bookings
           WHERE business_setup_id = $1
             AND substring(COALESCE(booking_date::text, start_time::text) from 1 for 10)::date = $2::date
             AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'invalid')
             AND team_member_id IS NOT NULL
             AND ($3::uuid IS NULL OR id <> $3::uuid)`,
          [setupId, date, excludeBookingId],
        ),
        query(
          `SELECT team_member_id, start_time, end_time, blocked_time_start, blocked_time_end, status, start_date, end_date
           FROM calendar_entries
           WHERE professional_profile_id = $1
             AND team_member_id IS NOT NULL
             AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'invalid')
             AND ${calendarEntryCoversDateSql("calendar_entries", "$2")}`,
          [setup.professional_profile_id, date],
        ),
      ]);

    const availability = parseJsonField(settingsResult.rows[0]?.availability, {});
    const bookingRules = availability?.bookingRules ?? {};
    const slotStepMinutes =
      location === "DL"
        ? Number(bookingRules.dlIntervalMinutes) || 15
        : Number(bookingRules.flIntervalMinutes) || 30;

    const busyByMember = {};

    for (const booking of bookingsResult.rows) {
      const startMin = wallClockTimeToMinutes(booking.start_time);
      const endMin = wallClockTimeToMinutes(booking.end_time);
      pushBusyInterval(busyByMember, booking.team_member_id, startMin, endMin);
    }

    for (const entry of entriesResult.rows) {
      const status = String(entry.status ?? "").toLowerCase();
      if (status === "cancelled" || status === "invalid") continue;
      // Multi-day blocks: start_date…end_date already matched in SQL; use the
      // daily wall-clock window from blocked_time_* (do not skip mid-range days).
      const startValue = entry.blocked_time_start ?? entry.start_time;
      const endValue = entry.blocked_time_end ?? entry.end_time;
      const startMin = wallClockTimeToMinutes(startValue);
      const endMin = wallClockTimeToMinutes(endValue);
      pushBusyInterval(busyByMember, entry.team_member_id, startMin, endMin);
    }

    const teamMembers = teamMembersResult.rows.map((member) => ({
      id: String(member.id),
      name: member.full_name?.trim() || "Team member",
      assignedServiceIds: parseAssignedServiceIds(
        parseJsonField(member.assigned_services, []),
      ),
    }));

    return res.status(200).json({
      success: true,
      message: "Setup availability fetched successfully.",
      data: {
        date,
        location,
        slotStepMinutes,
        scheduleAvailability: Array.isArray(availability?.scheduleAvailability)
          ? availability.scheduleAvailability
          : [],
        dateOverrides: Array.isArray(availability?.dateOverrides)
          ? availability.dateOverrides
          : [],
        publicBusinessHours: normalizePublicBusinessHours(
          availability?.publicBusinessHours,
        ),
        teamMembers,
        busyByMember,
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to fetch setup availability." });
  }
};

export const getPublicBusinessHoursForSetup = async (req, res) => {
  try {
    const setupId = req.params.setupId;
    if (!setupId) {
      return res.status(400).json({
        success: false,
        message: "Business setup id is required.",
        data: null,
      });
    }

    const setupResult = await query(
      `SELECT id, professional_profile_id
       FROM business_setups
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [setupId],
    );
    const setup = setupResult.rows[0];
    if (!setup?.professional_profile_id) {
      return res.status(404).json({
        success: false,
        message: "Business setup not found.",
        data: null,
      });
    }

    const settingsResult = await query(
      `SELECT availability
       FROM calendar_settings
       WHERE professional_profile_id = $1
       LIMIT 1`,
      [setup.professional_profile_id],
    );
    const availability = parseJsonField(settingsResult.rows[0]?.availability, {});
    const publicBusinessHours = normalizePublicBusinessHours(
      availability?.publicBusinessHours,
    );

    return res.status(200).json({
      success: true,
      message: "Public business hours fetched successfully.",
      data: {
        publicBusinessHours,
        bookingRules: availability?.bookingRules ?? {},
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to fetch public business hours." });
  }
};

export const listAllBusinessSetups = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query);

    const rankedSetups = await getRankedActiveBusinessSetups();
    const total = rankedSetups.length;
    const paginatedRanked = pagination.paginate
      ? rankedSetups.slice(pagination.offset, pagination.offset + pagination.limit)
      : rankedSetups;
    const setupIds = paginatedRanked.map((item) => item.businessSetupId);
    const rankingBySetupId = new Map(
      paginatedRanked.map((item) => [item.businessSetupId, item]),
    );

    if (!setupIds.length) {
      return res.status(200).json(
        listResponse({
          message: "Business setups fetched successfully",
          data: [],
          page: pagination.page,
          limit: pagination.limit,
          total,
          paginate: pagination.paginate,
        }),
      );
    }

    const setupsResult = await query(
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
       WHERE bs.id = ANY($1::uuid[])`,
      [setupIds],
    );

    const setupById = new Map(
      setupsResult.rows.map((row) => [String(row.id), row]),
    );
    const setupRows = setupIds
      .map((setupId) => setupById.get(String(setupId)))
      .filter(Boolean);

    if (!setupRows.length) {
      return res.status(200).json(
        listResponse({
          message: "Business setups fetched successfully",
          data: [],
          page: pagination.page,
          limit: pagination.limit,
          total,
          paginate: pagination.paginate,
        }),
      );
    }

    const teamMembersResult = await query(
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
       WHERE business_setup_id = ANY($1::uuid[])
       ORDER BY business_setup_id ASC, display_order ASC, id ASC`,
      [setupIds],
    );

    const teamMembersBySetupId = groupRowsByBusinessSetupId(teamMembersResult.rows);
    // Only expose services from business setup service_categories (Services Details).
    // Do NOT invent services from team member assignments for the public listing.
    const serviceDetailsBySetupId = await buildServiceDetailsMapForSetups(setupRows, query, {
      teamMembersBySetupId,
      useTeamAssignmentsFallback: false,
    });

    const profileIds = [
      ...new Set(
        setupRows
          .map((row) => row.professional_profile_id)
          .filter(Boolean)
          .map(String),
      ),
    ];
    const calendarSettingsByProfileId = new Map();
    if (profileIds.length) {
      const calendarResult = await query(
        `SELECT professional_profile_id, availability
         FROM calendar_settings
         WHERE professional_profile_id = ANY($1::uuid[])`,
        [profileIds],
      );
      for (const row of calendarResult.rows) {
        const availability = parseJsonField(row.availability, {});
        calendarSettingsByProfileId.set(String(row.professional_profile_id), {
          serviceOrder: availability?.serviceOrder ?? null,
        });
      }
    }

    const reviewAggregates = await getReviewAggregatesForSetups(setupIds);
    const teamMemberReviewAggregates =
      await getTeamMemberReviewAggregatesForSetups(setupIds);

    const data = setupRows.map((row) =>
      transformBusinessSetupForListing(row, {
        teamMembers: teamMembersBySetupId[row.id] ?? [],
        serviceDetails: serviceDetailsBySetupId[row.id] ?? [],
        ratingStats: reviewAggregates.get(String(row.id)) ?? null,
        serviceOrder:
          calendarSettingsByProfileId.get(String(row.professional_profile_id))?.serviceOrder ??
          null,
        teamMemberRatingStats:
          teamMemberReviewAggregates.get(String(row.id)) ?? null,
        rankingStats: rankingBySetupId.get(String(row.id)) ?? null,
      }),
    );

    return res.status(200).json(
      listResponse({
        message: "Business setups fetched successfully",
        data,
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to fetch business setups." });
  }
};
