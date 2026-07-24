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
    const serviceDetailsBySetupId = await buildServiceDetailsMapForSetups(setupRows, query, {
      teamMembersBySetupId,
      useTeamAssignmentsFallback: true,
    });
    const reviewAggregates = await getReviewAggregatesForSetups(setupIds);

    const data = setupRows.map((row) =>
      transformBusinessSetupForListing(row, {
        teamMembers: teamMembersBySetupId[row.id] ?? [],
        serviceDetails: serviceDetailsBySetupId[row.id] ?? [],
        ratingStats: reviewAggregates.get(String(row.id)) ?? null,
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
