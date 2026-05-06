import { query } from "../db/index.js";
import { verifyAccessToken } from "../helpers/jwt.helper.js";

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex <= 0) return acc;
      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      if (key) acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

const extractAccessToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies.access_token || cookies.token || null;
};

export const authenticateUser = async (req, res, next) => {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required.",
        data: null,
      });
    }

    const decoded = verifyAccessToken(token);

    const result = await query(
      `SELECT id, email, user_type, is_email_verified, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [decoded.id],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
        data: null,
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
        data: null,
      });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
      data: null,
    });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  const normalizedRoles = allowedRoles
    .flat()
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
        data: null,
      });
    }

    const userRole = String(req.user.user_type ?? "").trim().toLowerCase();
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource.",
        data: null,
      });
    }

    return next();
  };
};
