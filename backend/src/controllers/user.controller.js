import bcrypt from "bcrypt";
import { query } from "../db/index.js";

const SALT_ROUNDS = 12;

const profileConfig = {
  individual: {
    table: "individual_profiles",
    fields: [
      "first_name",
      "last_name",
      "display_name",
      "date_of_birth",
      "gender",
      "country_code",
      "phone",
      "profile_picture",
    ],
  },
  company: {
    table: "company_profiles",
    fields: [
      "legal_name",
      "ccc_number",
      "vat_number",
      "street",
      "street_number",
      "postal_code",
      "province",
      "municipality",
      "contact_first_name",
      "contact_last_name",
      "phone",
      "logo",
    ],
  },
  professional: {
    table: "professional_profiles",
    fields: [
      "legal_name",
      "ccc_number",
      "vat_number",
      "street",
      "street_number",
      "postal_code",
      "province",
      "municipality",
      "business_type",
      "website",
      "instagram",
      "other_link",
      "contact_first_name",
      "contact_last_name",
      "phone",
      "profile_picture",
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
    const userUpdates = {};

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

    if (req.body.email !== undefined) {
      userUpdates.email = req.body.email.trim().toLowerCase();
    }

    if (req.body.password) {
      userUpdates.password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    const updateEntries = Object.entries(updates);
    const userUpdateEntries = Object.entries(userUpdates);

    if (updateEntries.length === 0 && userUpdateEntries.length === 0) {
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

    if (updateEntries.length > 0) {
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
    }

    if (userUpdateEntries.length > 0) {
      const userSetClause = userUpdateEntries
        .map(([field], index) => `${field} = $${index + 1}`)
        .concat(`updated_at = NOW()`)
        .join(", ");
      const userValues = userUpdateEntries.map(([, value]) => value);

      await query(
        `UPDATE users
         SET ${userSetClause}
         WHERE id = $${userValues.length + 1}`,
        [...userValues, req.user.id],
      );
    } else {
      await query(
        `UPDATE users
         SET updated_at = NOW()
         WHERE id = $1`,
        [req.user.id],
      );
    }

    const profileResult = await query(getProfileQuery(req.user.user_type), [req.user.id]);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profileResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email is already in use.",
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      data: {
        error: error.message,
      },
    });
  }
};
