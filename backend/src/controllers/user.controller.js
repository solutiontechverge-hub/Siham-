import { query } from "../db/index.js";

const profileConfig = {
  individual: {
    table: "individual_profiles",
    fields: [
      "first_name",
      "last_name",
      "phone",
      "date_of_birth",
      "gender",
      "address",
      "city",
      "country",
      "profile_picture",
    ],
  },
  company: {
    table: "company_profiles",
    fields: [
      "company_name",
      "registration_number",
      "industry",
      "company_size",
      "website",
      "phone",
      "address",
      "city",
      "country",
      "logo",
    ],
  },
  professional: {
    table: "professional_profiles",
    fields: [
      "first_name",
      "last_name",
      "phone",
      "profession",
      "specialization",
      "experience_years",
      "license_number",
      "organization",
      "address",
      "city",
      "country",
      "profile_picture",
      "bio",
    ],
  },
};

const getProfileQuery = (userType) => {
  const config = profileConfig[userType];

  return `
    SELECT
      u.id,
      u.user_type,
      u.email,
      u.is_email_verified,
      u.is_active,
      u.created_at,
      u.updated_at,
      row_to_json(p) AS profile
    FROM users u
    LEFT JOIN ${config.table} p ON p.user_id = u.id
    WHERE u.id = $1
  `;
};

export const getProfile = async (req, res) => {
  try {
    const result = await query(getProfileQuery(req.user.user_type), [req.user.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      data: {
        error: error.message,
      },
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const config = profileConfig[req.user.user_type];
    const updates = {};

    for (const field of config.fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.files?.profile_picture?.[0] && config.fields.includes("profile_picture")) {
      updates.profile_picture = req.files.profile_picture[0].filename;
    }

    if (req.files?.logo?.[0] && config.fields.includes("logo")) {
      updates.logo = req.files.logo[0].filename;
    }

    const updateEntries = Object.entries(updates);

    if (updateEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided for update.",
        data: null,
      });
    }

    const setClause = updateEntries
      .map(([field], index) => `${field} = $${index + 1}`)
      .join(", ");
    const values = updateEntries.map(([, value]) => value);

    const updateResult = await query(
      `UPDATE ${config.table}
       SET ${setClause}
       WHERE user_id = $${values.length + 1}
       RETURNING *`,
      [...values, req.user.id],
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
        data: null,
      });
    }

    await query(
      `UPDATE users
       SET updated_at = NOW()
       WHERE id = $1`,
      [req.user.id],
    );

    const profileResult = await query(getProfileQuery(req.user.user_type), [req.user.id]);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profileResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      data: {
        error: error.message,
      },
    });
  }
};
