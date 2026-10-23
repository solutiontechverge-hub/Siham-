import bcrypt from "bcrypt";
import crypto from "crypto";
import { query } from "../db/index.js";
import {
  deleteProfileMediaIfOwned,
  isS3UploadConfigured,
  uploadProfileMulterFilesToS3,
} from "../services/s3-upload.service.js";
import {
  notifyChangeEmailVerify,
  notifyEmailChangeAlert,
  updateProfessionalValidation,
} from "../services/authEmail.service.js";
import { logAdminActivityFromRequest } from "../services/adminActivity.service.js";
import { logError, sendCaughtError } from "../utils/httpError.js";

const SALT_ROUNDS = 12;

const hashToken = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

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
    return sendCaughtError(res, error, { fallbackMessage: "Failed to fetch profile." });
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

    const hasPic = req.files?.profile_picture?.[0]?.buffer?.length;
    const hasLogo = req.files?.logo?.[0]?.buffer?.length;
    if ((hasPic || hasLogo) && !isS3UploadConfigured()) {
      return res.status(503).json({
        success: false,
        message: "File upload is temporarily unavailable.",
        data: null,
      });
    }

    const uploaded = await uploadProfileMulterFilesToS3(req.user.id, req.files);
    if (uploaded.profile_picture && config.fields.includes("profile_picture")) {
      updates.profile_picture = uploaded.profile_picture;
    }
    if (uploaded.logo && config.fields.includes("logo")) {
      updates.logo = uploaded.logo;
    }

    const previousMediaCols = [];
    if (uploaded.profile_picture && config.fields.includes("profile_picture")) {
      previousMediaCols.push("profile_picture");
    }
    if (uploaded.logo && config.fields.includes("logo")) {
      previousMediaCols.push("logo");
    }

    let previousMedia = {};
    if (previousMediaCols.length > 0) {
      const previousResult = await query(
        `SELECT ${previousMediaCols.join(", ")} FROM ${config.table} WHERE user_id = $1`,
        [req.user.id],
      );
      previousMedia = previousResult.rows[0] || {};
    }

    if (req.body.email !== undefined) {
      return res.status(400).json({
        success: false,
        message: "To change your email, use the change-email flow.",
        data: null,
      });
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

      if (
        uploaded.profile_picture &&
        previousMedia.profile_picture &&
        previousMedia.profile_picture !== uploaded.profile_picture
      ) {
        await deleteProfileMediaIfOwned(previousMedia.profile_picture, req.user.id);
      }
      if (uploaded.logo && previousMedia.logo && previousMedia.logo !== uploaded.logo) {
        await deleteProfileMediaIfOwned(previousMedia.logo, req.user.id);
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
      logError("updateProfile", error);
      return res.status(409).json({
        success: false,
        message: "Email is already in use.",
        data: null,
      });
    }

    return sendCaughtError(res, error, { fallbackMessage: "Failed to update profile." });
  }
};

export const requestChangeEmail = async (req, res) => {
  try {
    const newEmail = String(req.body.new_email || "")
      .trim()
      .toLowerCase();
    const currentPassword = req.body.current_password;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New email and current password are required.",
        data: null,
      });
    }

    const userResult = await query(
      `SELECT id, email, password_hash
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
      });
    }

    const user = userResult.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message:
          "This account uses social login and has no password. Set a password before changing email.",
        data: null,
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
        data: null,
      });
    }

    if (newEmail === String(user.email).toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Enter a different email address.",
        data: null,
      });
    }

    const taken = await query(
      `SELECT 1 FROM users WHERE email = $1 AND id <> $2 LIMIT 1`,
      [newEmail, user.id],
    );
    if (taken.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use.",
        data: null,
      });
    }

    // Drop prior unused change-email tokens for this user.
    await query(
      `UPDATE email_verifications
       SET is_used = true
       WHERE user_id = $1 AND is_used = false AND new_email IS NOT NULL`,
      [user.id],
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    await query(
      `INSERT INTO email_verifications (user_id, token, new_email, is_used, expires_at, created_at)
       VALUES ($1, $2, $3, false, NOW() + INTERVAL '24 hours', NOW())`,
      [user.id, hashToken(rawToken), newEmail],
    );

    try {
      await notifyChangeEmailVerify(newEmail, rawToken);
    } catch (error) {
      logError("requestChangeEmail.verify", error);
      return res.status(502).json({
        success: false,
        message: "Could not send verification email. Please try again.",
        data: null,
      });
    }

    try {
      await notifyEmailChangeAlert(user.email, newEmail);
    } catch (error) {
      // Alert is best-effort; verification already sent.
      logError("requestChangeEmail.alert", error);
    }

    return res.status(200).json({
      success: true,
      message:
        "Check your new email for a confirmation link. Your address will update after you confirm.",
      data: { pending_email: newEmail },
    });
  } catch (error) {
    return sendCaughtError(res, error, {
      fallbackMessage: "Failed to request email change.",
    });
  }
};

const isAdminRequest = (req) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  return req.headers["x-admin-api-key"] === adminKey;
};

export const setProfessionalValidation = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        message: "Admin authorization is required.",
        data: null,
      });
    }

    const { validation_status: validationStatus } = req.body;
    if (!["validated", "not_validated", "pending"].includes(validationStatus)) {
      return res.status(400).json({
        success: false,
        message: "validation_status must be validated, not_validated, or pending.",
        data: null,
      });
    }

    const result = await updateProfessionalValidation(req.params.userId, validationStatus);
    if (!result.updated) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const statusLabel =
      validationStatus === "validated"
        ? "Validated professional"
        : validationStatus === "not_validated"
          ? "Rejected professional"
          : "Set professional pending";

    void logAdminActivityFromRequest(req, {
      action: statusLabel,
      detail: `User ID ${req.params.userId} → ${validationStatus}`,
      color: validationStatus === "validated" ? "teal" : validationStatus === "not_validated" ? "warning" : "navy",
      module: "professional",
      actionType: "changed_status",
    });

    return res.status(200).json({
      success: true,
      message: "Professional validation status updated.",
      data: result,
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to update professional validation." });
  }
};
