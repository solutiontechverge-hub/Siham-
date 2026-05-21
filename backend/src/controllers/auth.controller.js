import bcrypt from "bcrypt";
import crypto from "crypto";
import { getClient, query } from "../db/index.js";
import {
  sendPasswordResetOtpEmail,
  sendVerificationEmail,
} from "../helpers/email.helper.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../helpers/jwt.helper.js";

const SALT_ROUNDS = 12;
const USER_TYPES = ["individual", "company", "professional"];

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
    requiredFields: ["first_name", "last_name"],
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
    requiredFields: [
      "legal_name",
      "ccc_number",
      "vat_number",
      "contact_first_name",
      "contact_last_name",
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
    requiredFields: [
      "legal_name",
      "ccc_number",
      "vat_number",
      "business_type",
      "contact_first_name",
      "contact_last_name",
    ],
  },
};

const hashToken = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const generateSixDigitOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const getProfilePayload = (userType, body, files = {}) => {
  const config = profileConfig[userType];
  const payload = {};

  for (const field of config.fields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  const profilePicture = files.profile_picture?.[0]?.filename;
  const logo = files.logo?.[0]?.filename;

  if (profilePicture && config.fields.includes("profile_picture")) {
    payload.profile_picture = profilePicture;
  }

  if (logo && config.fields.includes("logo")) {
    payload.logo = logo;
  }

  return payload;
};

const getMissingFields = (userType, body) =>
  profileConfig[userType].requiredFields.filter((field) => !body[field]);

const getUserWithProfile = async (userId) => {
  const userResult = await query(
    `SELECT id, user_type, email, is_email_verified, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [userId],
  );

  if (userResult.rowCount === 0) {
    return null;
  }

  const user = userResult.rows[0];
  const config = profileConfig[user.user_type];
  const profileResult = await query(
    `SELECT *
     FROM ${config.table}
     WHERE user_id = $1`,
    [userId],
  );

  return {
    ...user,
    profile: profileResult.rows[0] || null,
  };
};

export const selectUserType = async (req, res) =>
  res.status(200).json({
    success: true,
    message: "User type selected successfully.",
    data: {
      user_type: req.body.user_type,
    },
  });

export const register = async (req, res) => {
  const client = await getClient();

  try {
    const { email, password, user_type: userType } = req.body;

    if (!USER_TYPES.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type.",
        data: null,
      });
    }

    const missingFields = getMissingFields(userType, req.body);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required profile fields.",
        data: {
          missing_fields: missingFields,
        },
      });
    }

    await client.query("BEGIN");

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Email is already registered.",
        data: null,
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userResult = await client.query(
      `INSERT INTO users (user_type, email, password_hash, is_email_verified, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, user_type, email, is_email_verified, is_active, created_at, updated_at`,
      [userType, email.toLowerCase(), passwordHash, false, true],
    );

    const user = userResult.rows[0];
    const config = profileConfig[userType];
    const profilePayload = getProfilePayload(userType, req.body, req.files);
    const profileFields = ["user_id", ...config.fields];
    const profileValues = [user.id, ...config.fields.map((field) => profilePayload[field] ?? null)];
    const placeholders = profileFields.map((_, index) => `$${index + 1}`).join(", ");

    await client.query(
      `INSERT INTO ${config.table} (${profileFields.join(", ")})
       VALUES (${placeholders})`,
      profileValues,
    );

    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    await client.query(
      `INSERT INTO email_verifications (user_id, token, is_used, expires_at, created_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours', NOW())`,
      [user.id, hashToken(rawVerificationToken), false],
    );

    await sendVerificationEmail({
      email: user.email,
      token: rawVerificationToken,
    });

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Verification email sent.",
      data: await getUserWithProfile(user.id),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
      data: {
        error: error.message,
      },
    });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      `SELECT id, user_type, email, password_hash, is_email_verified, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
        data: null,
      });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        access_token: generateAccessToken(user),
        refresh_token: generateRefreshToken(user),
        user: {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          is_email_verified: user.is_email_verified,
          is_active: user.is_active,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to login.",
      data: {
        error: error.message,
      },
    });
  }
};

export const forgotPassword = async (req, res) => {
  const client = await getClient();

  try {
    const { email } = req.body;
    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id, email
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(200).json({
        success: true,
        message: "If this email exists, an OTP has been sent.",
        data: null,
      });
    }

    const user = userResult.rows[0];
    const otp = generateSixDigitOtp();
    const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
    const resetToken = crypto.randomBytes(32).toString("hex");

    await client.query(
      `UPDATE password_reset_tokens
       SET expires_at = NOW()
       WHERE user_id = $1 AND is_used = false`,
      [user.id],
    );

    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token, otp_code, is_used, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes', NOW())`,
      [user.id, hashToken(resetToken), hashedOtp, false],
    );

    await sendPasswordResetOtpEmail({
      email: user.email,
      otp,
    });

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "If this email exists, an OTP has been sent.",
      data: null,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request.",
      data: {
        error: error.message,
      },
    });
  } finally {
    client.release();
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const resetResult = await query(
      `SELECT prt.id, prt.user_id, prt.otp_code, prt.expires_at, prt.is_used
       FROM password_reset_tokens prt
       INNER JOIN users u ON u.id = prt.user_id
       WHERE u.email = $1
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [email.toLowerCase()],
    );

    if (resetResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "OTP record not found.",
        data: null,
      });
    }

    const resetRecord = resetResult.rows[0];

    if (resetRecord.is_used) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been used.",
        data: null,
      });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
        data: null,
      });
    }

    const otpMatches = await bcrypt.compare(otp, resetRecord.otp_code);

    if (!otpMatches) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
        data: null,
      });
    }

    await query(
      `UPDATE password_reset_tokens
       SET is_used = true
       WHERE id = $1`,
      [resetRecord.id],
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      data: {
        user_id: resetRecord.user_id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP.",
      data: {
        error: error.message,
      },
    });
  }
};

export const resetPassword = async (req, res) => {
  const client = await getClient();

  try {
    const { user_id: userId, new_password: newPassword } = req.body;
    await client.query("BEGIN");

    const validResetResult = await client.query(
      `SELECT id
       FROM password_reset_tokens
       WHERE user_id = $1
         AND is_used = true
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    if (validResetResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "OTP verification is required before resetting the password.",
        data: null,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updateResult = await client.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, user_type, is_email_verified, is_active, created_at, updated_at`,
      [passwordHash, userId],
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
      });
    }

    await client.query(
      `UPDATE password_reset_tokens
       SET expires_at = NOW()
       WHERE user_id = $1`,
      [userId],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      data: {
        user: updateResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
      data: {
        error: error.message,
      },
    });
  } finally {
    client.release();
  }
};

export const verifyEmail = async (req, res) => {
  const client = await getClient();

  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
        data: null,
      });
    }

    await client.query("BEGIN");

    const verificationResult = await client.query(
      `SELECT id, user_id, is_used, expires_at
       FROM email_verifications
       WHERE token = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [hashToken(token)],
    );

    if (verificationResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Invalid verification token.",
        data: null,
      });
    }

    const verification = verificationResult.rows[0];

    if (verification.is_used) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Verification token has already been used.",
        data: null,
      });
    }

    if (new Date(verification.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Verification token has expired.",
        data: null,
      });
    }

    await client.query(
      `UPDATE email_verifications
       SET is_used = true
       WHERE id = $1`,
      [verification.id],
    );

    await client.query(
      `UPDATE users
       SET is_email_verified = true, updated_at = NOW()
       WHERE id = $1`,
      [verification.user_id],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: await getUserWithProfile(verification.user_id),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to verify email.",
      data: {
        error: error.message,
      },
    });
  } finally {
    client.release();
  }
};
