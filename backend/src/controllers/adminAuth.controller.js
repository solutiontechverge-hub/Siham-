import bcrypt from "bcrypt";
import { query } from "../db/index.js";
import {
  generateAdminAccessToken,
  generateAdminRefreshToken,
} from "../helpers/jwt.helper.js";
import { logAdminActivityFromRequest } from "../services/adminActivity.service.js";
import { sendCaughtError } from "../utils/httpError.js";

export const adminLogin = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
        data: null,
      });
    }

    const result = await query(
      `SELECT id, email, password_hash, user_type, is_email_verified, is_active
       FROM users
       WHERE email = $1`,
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    const user = result.rows[0];

    if (String(user.user_type).toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This account is not an admin user.",
        data: null,
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

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
        message: "Admin account is inactive.",
        data: null,
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_type: "admin",
      name: user.email.split("@")[0],
    };

    await logAdminActivityFromRequest(req, {
      action: "Admin logged in",
      detail: user.email,
      color: "mint",
      module: "authentication",
      actionType: "logged_in",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        access_token: generateAdminAccessToken(user),
        refresh_token: generateAdminRefreshToken(user),
        user: {
          id: user.id,
          email: user.email,
          user_type: "admin",
          is_email_verified: Boolean(user.is_email_verified),
          is_active: Boolean(user.is_active),
        },
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to login." });
  }
};

export const adminMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user || String(user.user_type).toLowerCase() !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Admin authentication is required.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin session loaded.",
      data: {
        id: user.id,
        email: user.email,
        user_type: "admin",
        is_email_verified: Boolean(user.is_email_verified ?? true),
        is_active: Boolean(user.is_active ?? true),
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to load admin session." });
  }
};
