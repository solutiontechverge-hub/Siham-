import { query } from "../db/index.js";
import { verifyAccessToken } from "../helpers/jwt.helper.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required.",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];
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
