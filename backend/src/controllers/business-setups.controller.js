import { query } from "../db/index.js";
import { buildServiceDetailsMapForSetups } from "../utils/business-service-categories.js";
import {
  groupRowsByBusinessSetupId,
  transformBusinessSetupForListing,
} from "../utils/business-setup-listing.mapper.js";

export const listAllBusinessSetups = async (_req, res) => {
  try {
    const setupsResult = await query(
      `SELECT bs.*
       FROM business_setups bs
       WHERE bs.is_active = true
       ORDER BY bs.updated_at DESC, bs.id DESC`,
    );

    const setupRows = setupsResult.rows;

    if (!setupRows.length) {
      return res.status(200).json({
        success: true,
        message: "Business setups fetched successfully",
        data: [],
      });
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

    const data = setupRows.map((row) =>
      transformBusinessSetupForListing(row, {
        teamMembers: teamMembersBySetupId[row.id] ?? [],
        serviceDetails: serviceDetailsBySetupId[row.id] ?? [],
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Business setups fetched successfully",
      data,
    });
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
