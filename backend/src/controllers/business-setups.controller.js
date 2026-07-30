import { query } from "../db/index.js";
import { buildServiceDetailsMapForSetups } from "../utils/business-service-categories.js";
import {
  groupRowsByBusinessSetupId,
  transformBusinessSetupForListing,
} from "../utils/business-setup-listing.mapper.js";
import {
  listResponse,
  parseListPagination,
  sqlLimitOffset,
  withPaginationParams,
} from "../utils/pagination.js";
import { getReviewAggregatesForSetups } from "../services/review.service.js";

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
      data: { publicBusinessHours },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public business hours.",
      data: { error: error.message },
    });
  }
};

export const listAllBusinessSetups = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query);
    const { clause: limitClause } = sqlLimitOffset(1);

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM business_setups bs
       WHERE bs.is_active = true`,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const setupsResult = await query(
      `SELECT bs.*
       FROM business_setups bs
       WHERE bs.is_active = true
       ORDER BY bs.updated_at DESC, bs.id DESC
       ${pagination.paginate ? limitClause : ""}`,
      withPaginationParams([], pagination),
    );

    const setupRows = setupsResult.rows;

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

    const setupIds = setupRows.map((row) => row.id);

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

    const data = setupRows.map((row) =>
      transformBusinessSetupForListing(row, {
        teamMembers: teamMembersBySetupId[row.id] ?? [],
        serviceDetails: serviceDetailsBySetupId[row.id] ?? [],
        ratingStats: reviewAggregates.get(String(row.id)) ?? null,
        serviceOrder:
          calendarSettingsByProfileId.get(String(row.professional_profile_id))?.serviceOrder ??
          null,
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business setups.",
      data: {
        error: error.message,
      },
    });
  }
};
